

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Booking, Customer, Artist } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Briefcase, CalendarCheck2, History, Download, ShieldCheck, Star } from 'lucide-react';
import { format } from 'date-fns';
import { useInactivityTimeout } from '@/hooks/use-inactivity-timeout';
import { generateCustomerInvoice } from '@/lib/export';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getArtists, getBookings, getCustomer, createNotification, updateBooking } from '@/lib/services';
import { Timestamp } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

export default function AccountPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [customer, setCustomer] = React.useState<Customer | null>(null);
    const [bookings, setBookings] = React.useState<Booking[]>([]);
    const [artists, setArtists] = React.useState<Artist[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [reviewBooking, setReviewBooking] = React.useState<Booking | null>(null);
    const [rating, setRating] = React.useState(0);
    const [comment, setComment] = React.useState('');

    const handleLogout = React.useCallback(() => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('currentCustomerId');
        }
        router.push('/');
    }, [router]);

    useInactivityTimeout(handleLogout);

    const fetchCustomerData = React.useCallback(async () => {
        setIsLoading(true);
        let customerId: string | null = null;
        if (typeof window !== 'undefined') {
            customerId = localStorage.getItem('currentCustomerId');
        }

        if (!customerId) {
            router.push('/');
            return;
        }

        try {
            const [fetchedCustomer, fetchedArtists, allBookings] = await Promise.all([
                getCustomer(customerId),
                getArtists(),
                getBookings(),
            ]);

            if (!fetchedCustomer) {
                toast({
                    title: "Error",
                    description: "Could not find your account details.",
                    variant: "destructive",
                });
                handleLogout();
                return;
            }

            setCustomer(fetchedCustomer);
            setArtists(fetchedArtists);

            const customerBookings = allBookings.filter(b => b.customerId === customerId);
            setBookings(customerBookings.sort((a,b) => (b.date as any).toDate().getTime() - (a.date as any).toDate().getTime()));

        } catch (error) {
            console.error("Failed to fetch customer data:", error);
            toast({
                title: "Error",
                description: "Failed to load your account data. Please try again later.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }, [router, toast, handleLogout]);
    
    React.useEffect(() => {
        fetchCustomerData();
    }, [fetchCustomerData]);

    React.useEffect(() => {
        const checkReviewRequests = async () => {
            if (!customer) return;
            const now = new Date();
            const completedUnreviewedBookings = bookings.filter(b => 
                b.status === 'Completed' && 
                !b.reviewSubmitted &&
                (now.getTime() - (b.date as any).toDate().getTime()) > (24 * 60 * 60 * 1000)
            );

            if (completedUnreviewedBookings.length > 0) {
                // For simplicity, we just take the first one. A real app might queue these.
                const bookingToReview = completedUnreviewedBookings[0];
                 await createNotification({
                    customerId: customer.id,
                    bookingId: bookingToReview.id,
                    title: "How was your service?",
                    message: `Please take a moment to review your recent booking for ${bookingToReview.service} with ${bookingToReview.customerName}.`,
                    timestamp: new Date().toISOString(),
                    isRead: false,
                    type: 'review_request',
                });
            }
        }
        // Run this check periodically or on certain triggers
        const interval = setInterval(checkReviewRequests, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [bookings, customer]);


    const handleDownloadInvoice = (booking: Booking) => {
        if (customer) {
            generateCustomerInvoice(booking, customer);
            toast({
                title: 'Invoice Downloaded',
                description: `Invoice for booking #${booking.id} has been downloaded.`,
            });
        } else {
             toast({
                title: 'Error',
                description: 'Could not download invoice. Customer data not found.',
                variant: 'destructive',
            });
        }
    };

    const handleSubmitReview = async () => {
        if (!reviewBooking || rating === 0 || !comment || !customer) return;

        for (const artistId of reviewBooking.artistIds) {
            const artist = artists.find(a => a.id === artistId);
            if (artist) {
                const newReview = { id: `${reviewBooking.id}_${customer.id}`, customerName: customer.name, rating, comment };
                const updatedReviews = [...(artist.reviews || []), newReview];
                // A simple average for rating calculation
                const newRating = updatedReviews.reduce((acc, r) => acc + r.rating, 0) / updatedReviews.length;

                // TODO: This should be a transaction in a real app
                // await updateArtist(artist.id, { reviews: updatedReviews, rating: newRating });
            }
        }

        await updateBooking(reviewBooking.id, { reviewSubmitted: true });

        toast({
            title: "Review Submitted!",
            description: "Thank you for your feedback.",
        });

        // Close modal and reset state
        setReviewBooking(null);
        setRating(0);
        setComment('');
        fetchCustomerData(); // Refetch to update UI
    }

    const getStatusVariant = (status: Booking['status']) => {
        switch (status) {
            case 'Completed': return 'default';
            case 'Confirmed': return 'secondary';
            case 'Pending Approval': return 'outline';
            case 'Needs Assignment': return 'outline';
            case 'Cancelled': return 'destructive';
            case 'Disputed': return 'destructive';
            default: return 'outline';
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading your account...</div>;
    }
    
    if (!customer) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                Could not load customer data. Please try logging in again.
            </div>
        );
    }
    
    const getSafeDate = (date: Date | Timestamp): Date => {
        return date instanceof Timestamp ? date.toDate() : date;
    }


    const upcomingBookings = bookings.filter(b => getSafeDate(b.eventDate) >= new Date() && (b.status === 'Confirmed' || b.status === 'Pending Approval' || b.status === 'Needs Assignment'));
    const pastBookings = bookings.filter(b => getSafeDate(b.eventDate) < new Date() || b.status === 'Completed' || b.status === 'Cancelled' || b.status === 'Disputed');
    
    const renderBookingRow = (booking: Booking, isPastBooking: boolean = false) => {
        const assignedArtists = artists.filter(a => booking.artistIds?.includes(a.id));
        return (
             <TableRow key={booking.id}>
                <TableCell className="font-medium">{booking.service}</TableCell>
                <TableCell>
                    {assignedArtists.length > 0 ? (
                         <div className="flex flex-col">
                            {assignedArtists.map(artist => (
                                <span key={artist.id}>{artist.name}</span>
                            ))}
                        </div>
                    ) : (
                         <span className="text-muted-foreground">To be assigned</span>
                    )}
                </TableCell>
                <TableCell>
                    <div className="flex flex-col gap-1">
                        {booking.serviceDates.map((date, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                                {format(getSafeDate(date), "PPP")}
                            </Badge>
                        ))}
                    </div>
                </TableCell>
                <TableCell>₹{booking.amount.toLocaleString(undefined, {maximumFractionDigits: 0})}</TableCell>
                <TableCell><Badge variant={getStatusVariant(booking.status)}>{booking.status}</Badge></TableCell>
                <TableCell className="text-right">
                    {isPastBooking && booking.status === 'Completed' && !booking.reviewSubmitted && (
                        <Button variant="outline" size="sm" onClick={() => setReviewBooking(booking)}>
                            <Star className="mr-2 h-4 w-4"/> Rate Artist
                        </Button>
                    )}
                    {booking.status !== 'Cancelled' && booking.status !== 'Needs Assignment' && (
                        <Button variant="ghost" size="icon" onClick={() => handleDownloadInvoice(booking)}>
                            <Download className="h-4 w-4" />
                            <span className="sr-only">Download Invoice</span>
                        </Button>
                    )}
                </TableCell>
            </TableRow>
        );
    }

    const renderUpcomingBookingTable = (bookingsToShow: Booking[]) => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Artist(s)</TableHead>
                    <TableHead>Service Dates</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Invoice</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {bookingsToShow.length > 0 ? bookingsToShow.map(booking => (
                   <React.Fragment key={`frag-${booking.id}`}>
                        {renderBookingRow(booking, false)}
                        {booking.status === 'Confirmed' && booking.completionCode && (
                             <TableRow key={`code-${booking.id}`} className="bg-muted/50">
                                 <TableCell colSpan={6} className="p-0">
                                     <Alert variant="default" className="border-0 border-l-4 border-primary rounded-none">
                                        <ShieldCheck className="h-4 w-4 text-primary" />
                                        <AlertTitle className="font-semibold">Your Service Completion Code</AlertTitle>
                                        <AlertDescription>
                                            Share this code with your artist only after your service is fully completed: <strong className="text-lg tracking-widest ml-2">{booking.completionCode}</strong>
                                        </AlertDescription>
                                    </Alert>
                                 </TableCell>
                             </TableRow>
                        )}
                   </React.Fragment>
                )) : (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">You have no bookings in this category.</TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
    
    const renderPastBookingTable = (bookingsToShow: Booking[]) => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Artist(s)</TableHead>
                    <TableHead>Service Dates</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                 {bookingsToShow.length > 0 ? bookingsToShow.map(booking => renderBookingRow(booking, true)) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">You have no bookings in this category.</TableCell>
                    </TableRow>
                 )}
            </TableBody>
        </Table>
    );

    return (
        <>
        <div className="bg-background min-h-screen">
            <header className="bg-background border-b p-4 flex justify-between items-center">
                 <h1 className="text-2xl font-bold text-primary">My Dashboard</h1>
                 <Button variant="outline" onClick={() => router.push('/')}>Back to Home</Button>
            </header>
            <main className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
                 <Card>
                    <CardHeader className="flex flex-row items-center gap-4">
                         <Avatar className="h-16 w-16">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${customer.name}`} />
                            <AvatarFallback>{customer.name ? customer.name.charAt(0).toUpperCase() : 'C'}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-2xl">{customer.name}</CardTitle>
                            <CardDescription>{customer.email || customer.phone}</CardDescription>
                        </div>
                    </CardHeader>
                    <CardFooter className="flex justify-between items-center">
                        <div className="flex gap-4">
                            <div className="flex items-center text-sm text-muted-foreground"><CalendarCheck2 className="mr-2 h-4 w-4 text-green-500" /> <span>{upcomingBookings.length} Upcoming</span></div>
                            <div className="flex items-center text-sm text-muted-foreground"><History className="mr-2 h-4 w-4 text-blue-500" /> <span>{pastBookings.length} Past</span></div>
                             <div className="flex items-center text-sm text-muted-foreground"><Briefcase className="mr-2 h-4 w-4 text-purple-500" /> <span>{bookings.length} Total</span></div>
                        </div>
                         <Button variant="ghost" onClick={handleLogout}><LogOut className="mr-2 h-4 w-4"/> Logout</Button>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Upcoming Bookings</CardTitle>
                        <CardDescription>These are your future bookings. You will be notified of any status changes.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         {renderUpcomingBookingTable(upcomingBookings)}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Past Bookings</CardTitle>
                        <CardDescription>A history of all your past bookings with us. Please rate your experience!</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {renderPastBookingTable(pastBookings)}
                    </CardContent>
                </Card>

            </main>
        </div>

        <Dialog open={!!reviewBooking} onOpenChange={() => setReviewBooking(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Rate Your Experience</DialogTitle>
                    <DialogDescription>
                        Your feedback helps us and our artists improve. How was your service for "{reviewBooking?.service}"?
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map(star => (
                            <Star 
                                key={star}
                                className={`w-10 h-10 cursor-pointer transition-colors ${rating >= star ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
                                onClick={() => setRating(star)}
                            />
                        ))}
                    </div>
                    <Textarea 
                        placeholder="Share details of your own experience..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    />
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button onClick={handleSubmitReview} disabled={rating === 0 || !comment}>Submit Review</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
}
