
'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Booking, Customer, Artist } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Briefcase, Calendar, Download } from 'lucide-react';
import { allBookings as initialBookings, initialCustomers, artists as initialArtists } from '@/lib/data';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function CustomerDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const customerId = params.id as string;

    const [customer, setCustomer] = React.useState<Customer | null>(null);
    const [bookings, setBookings] = React.useState<Booking[]>([]);
    const [artists, setArtists] = React.useState<Artist[]>([]);
    
    const getArtists = React.useCallback((): Artist[] => {
        const storedArtists = localStorage.getItem('artists');
        const localArtists: Artist[] = storedArtists ? JSON.parse(storedArtists) : [];
        const allArtistsMap = new Map<string, Artist>();
        initialArtists.forEach(a => allArtistsMap.set(a.id, a));
        localArtists.forEach(a => allArtistsMap.set(a.id, a));
        return Array.from(allArtistsMap.values());
    }, []);

    React.useEffect(() => {
        const isAdminAuthenticated = localStorage.getItem('isAdminAuthenticated');
        if (isAdminAuthenticated !== 'true') {
            router.push('/admin/login');
        }

        const allCustomersData = localStorage.getItem('customers');
        const allCustomers: Customer[] = allCustomersData ? JSON.parse(allCustomersData) : initialCustomers;
        const currentCustomer = allCustomers.find(c => c.id === customerId);
        
        if (currentCustomer) {
            setCustomer(currentCustomer);
        } else {
            toast({
                title: 'Customer not found',
                description: 'The requested customer could not be found.',
                variant: 'destructive',
            });
            router.push('/admin/customers');
            return;
        }

        setArtists(getArtists());
        
        const allBookingsData = localStorage.getItem('bookings');
        const allBookings: Booking[] = (allBookingsData ? JSON.parse(allBookingsData) : initialBookings).map((b: any) => ({...b, date: new Date(b.date), serviceDates: b.serviceDates.map((d:string) => new Date(d)) }));
        
        const customerBookings = allBookings.filter(b => b.customerId === customerId);
        setBookings(customerBookings.sort((a,b) => b.date.getTime() - a.date.getTime()));
    }, [router, customerId, toast, getArtists]);


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

    if (!customer) {
        return <div className="flex items-center justify-center min-h-screen">Loading customer details...</div>;
    }

    const renderBookingRow = (booking: Booking) => {
        const assignedArtists = artists.filter(a => booking.artistIds && booking.artistIds.includes(a.id));
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
            </TableRow>
        );
    }

    return (
        <>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-lg font-semibold md:text-2xl">Customer Details</h1>
                </div>
            </div>
            <div className="grid gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center gap-4">
                         <Avatar className="h-16 w-16">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${customer.name}`} />
                            <AvatarFallback>{customer.name ? customer.name.charAt(0).toUpperCase() : 'C'}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-2xl">{customer.name}</CardTitle>
                            <CardDescription>{customer.email || 'No email provided'} &middot; {customer.phone}</CardDescription>
                        </div>
                    </CardHeader>
                    <CardFooter>
                         <div className="flex items-center text-sm text-muted-foreground"><Briefcase className="mr-2 h-4 w-4 text-purple-500" /> <span>{bookings.length} Total Bookings</span></div>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Booking History</CardTitle>
                        <CardDescription>A complete log of all bookings made by this customer.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Service</TableHead>
                                    <TableHead>Artist(s)</TableHead>
                                    <TableHead>Service Dates</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bookings.length > 0 ? bookings.map(renderBookingRow) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground">This customer has not made any bookings yet.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
