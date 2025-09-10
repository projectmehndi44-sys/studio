

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Booking, Customer, Artist } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Briefcase, CalendarCheck2, History, Download, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { useInactivityTimeout } from '@/hooks/use-inactivity-timeout';
import { generateCustomerInvoice } from '@/lib/export';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getArtists, getBookings, getCustomer } from '@/lib/services';

export default function AccountPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [customer, setCustomer] = React.useState<Customer | null>(null);
    const [bookings, setBookings] = React.useState<Booking[]>([]);
    const [artists, setArtists] = React.useState<Artist[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    const handleLogout = React.useCallback(() => {
        localStorage.removeItem('currentCustomerId');
        router.push('/');
    }, [router]);

    useInactivityTimeout(handleLogout);

    const fetchCustomerData = React.useCallback(async () => {
        setIsLoading(true);
        const customerId = localStorage.getItem('currentCustomerId');
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
            setBookings(customerBookings.sort((a,b) => b.date.getTime() - a.date.getTime()));

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

    const upcomingBookings = bookings.filter(b => b.date >= new Date() && (b.status === 'Confirmed' || b.status === 'Pending Approval' || b.status === 'Needs Assignment'));
    const pastBookings = bookings.filter(b => b.date < new Date() || b.status === 'Completed' || b.status === 'Cancelled' || b.status === 'Disputed');
    
    const renderBookingRow = (booking: Booking) => {
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
                                {format(date, "PPP")}
                            </Badge>
                        ))}
                    </div>
                </TableCell>
                <TableCell>₹{booking.amount.toLocaleString(undefined, {maximumFractionDigits: 0})}</TableCell>
                <TableCell><Badge variant={getStatusVariant(booking.status)}>{booking.status}</Badge></TableCell>
                <TableCell className="text-right">
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
                        {renderBookingRow(booking)}
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
                    <TableHead className="text-right">Invoice</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                 {bookingsToShow.length > 0 ? bookingsToShow.map(renderBookingRow) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">You have no bookings in this category.</TableCell>
                    </TableRow>
                 )}
            </TableBody>
        </Table>
    );

    return (
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
                        <CardDescription>A history of all your past bookings with us.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {renderPastBookingTable(pastBookings)}
                    </CardContent>
                </Card>

            </main>
        </div>
    );
}
