

'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Booking, Customer, Artist } from '@/lib/types';
import { LogOut, Briefcase, CalendarCheck2, History, Download, ShieldCheck, Star, X } from 'lucide-react';
import { format } from 'date-fns';
import { generateCustomerInvoice } from '@/lib/export';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { updateBooking } from '@/lib/services';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from '@/components/ui/textarea';
import { useAccount } from '../layout';
import { getSafeDate } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { callFirebaseFunction } from '@/lib/firebase';

export default function BookingsPage() {
    const { toast } = useToast();
    const { customer, artists, upcomingBookings, pastBookings, fetchData } = useAccount();

    const [reviewBooking, setReviewBooking] = React.useState<Booking | null>(null);
    const [cancelBooking, setCancelBooking] = React.useState<Booking | null>(null);
    const [rating, setRating] = React.useState(0);
    const [comment, setComment] = React.useState('');


    const handleDownloadInvoice = (booking: Booking) => {
        if (customer) {
            generateCustomerInvoice(booking, customer);
            toast({
                title: 'Invoice Downloaded',
                description: `Invoice for booking #${booking.id.substring(0, 7)} has been downloaded.`,
            });
        } else {
             toast({
                title: 'Error',
                description: 'Could not download invoice. Customer data not found.',
                variant: 'destructive',
            });
        }
    };
    
    const handleCancellation = async () => {
        if (!cancelBooking) return;
        try {
            const result: any = await callFirebaseFunction('requestCancellation', { bookingId: cancelBooking.id });
            toast({
                title: 'Cancellation Processed',
                description: result.data.message,
            });
            await fetchData(); // Refetch data to update UI
        } catch (error: any) {
            toast({
                title: 'Cancellation Failed',
                description: error.message || 'There was an error processing your cancellation.',
                variant: 'destructive',
            });
        } finally {
            setCancelBooking(null);
        }
    }


    const handleSubmitReview = async () => {
        if (!reviewBooking || rating === 0 || !comment || !customer) return;

        // In a real app, this review would be sent to the backend to be processed.
        // It would update the artist's rating and add the review to their profile.
        // Here, we simulate this by updating the booking and showing a toast.

        await updateBooking(reviewBooking.id, { reviewSubmitted: true });

        toast({
            title: "Review Submitted!",
            description: "Thank you for your feedback.",
        });

        setReviewBooking(null);
        setRating(0);
        setComment('');
        await fetchData(); // Refetch data to update UI
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
    
    const renderBookingRow = (booking: Booking, isUpcoming: boolean) => {
        const assignedArtists = artists.filter(a => booking.artistIds?.includes(a.id));
        const canCancel = booking.status === 'Confirmed' || booking.status === 'Pending Approval';

        return (
             <TableRow key={booking.id}>
                <TableCell className="font-medium">{booking.items.map(i => i.servicePackage.name).join(', ')}</TableCell>
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
                        {(booking.serviceDates || []).map((date, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                                {format(getSafeDate(date), "PPP")}
                            </Badge>
                        ))}
                    </div>
                </TableCell>
                <TableCell>₹{booking.amount.toLocaleString(undefined, {maximumFractionDigits: 0})}</TableCell>
                <TableCell><Badge variant={getStatusVariant(booking.status)}>{booking.status}</Badge></TableCell>
                <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-1">
                        {isUpcoming === false && booking.status === 'Completed' && !booking.reviewSubmitted && (
                            <Button variant="outline" size="sm" onClick={() => setReviewBooking(booking)}>
                                <Star className="mr-2 h-4 w-4"/> Rate Artist
                            </Button>
                        )}
                        {booking.status !== 'Cancelled' && booking.status !== 'Needs Assignment' && (
                            <Button variant="ghost" size="icon" onClick={() => handleDownloadInvoice(booking)} title="Download Invoice">
                                <Download className="h-4 w-4" />
                            </Button>
                        )}
                         {canCancel && (
                             <Button variant="ghost" size="icon" onClick={() => setCancelBooking(booking)} title="Cancel Booking">
                                <X className="h-4 w-4 text-destructive" />
                            </Button>
                        )}
                    </div>
                </TableCell>
            </TableRow>
        );
    }

    const renderBookingTable = (bookingsToShow: Booking[], isUpcoming: boolean) => (
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
                {bookingsToShow.length > 0 ? bookingsToShow.map(booking => (
                   <React.Fragment key={`frag-${booking.id}`}>
                        {renderBookingRow(booking, isUpcoming)}
                        {isUpcoming && booking.status === 'Confirmed' && booking.completionCode && (
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
                        <TableCell colSpan={6} className="text-center text-muted-foreground h-24">You have no bookings in this category.</TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );

    return (
        <>
        <Card>
            <CardHeader>
                <CardTitle>My Bookings</CardTitle>
                <CardDescription>Review and manage all your upcoming and past bookings.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="upcoming" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                        <TabsTrigger value="past">Past</TabsTrigger>
                    </TabsList>
                    <TabsContent value="upcoming" className="mt-4">
                        {renderBookingTable(upcomingBookings, true)}
                    </TabsContent>
                    <TabsContent value="past" className="mt-4">
                        {renderBookingTable(pastBookings, false)}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>

        {/* Cancellation Dialog */}
         <AlertDialog open={!!cancelBooking} onOpenChange={() => setCancelBooking(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to cancel?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Please review the cancellation policy. Bookings cancelled within 72 hours of the event are not eligible for an advance refund.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>No, Keep Booking</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancellation} className="bg-destructive hover:bg-destructive/90">
                       Yes, Cancel Booking
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>


        {/* Review Dialog */}
        <Dialog open={!!reviewBooking} onOpenChange={() => setReviewBooking(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Rate Your Experience</DialogTitle>
                    <DialogDescription>
                        Your feedback helps us and our artists improve. How was your service for "{reviewBooking?.items.map(i => i.servicePackage.name).join(', ')}"?
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
