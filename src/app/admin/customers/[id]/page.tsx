
'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Booking, Customer, Artist } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Briefcase } from 'lucide-react';
import { getCustomer, listenToCollection } from '@/lib/services';
import { format, parseISO, isValid } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Timestamp, query, collection, where } from 'firebase/firestore';
import { getDb } from '@/lib/services';


function getSafeDate(date: any): Date {
    if (!date) return new Date();
    if (date instanceof Date && isValid(date)) return date;
    if (date instanceof Timestamp) return date.toDate();
    if (typeof date === 'string') {
        const parsed = parseISO(date);
        if (isValid(parsed)) return parsed;
    }
    return new Date();
}


export default function CustomerDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const customerId = params.id as string;

    const [customer, setCustomer] = React.useState<Customer | null>(null);
    const [bookings, setBookings] = React.useState<Booking[]>([]);
    const [artists, setArtists] = React.useState<Artist[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        if (!customerId) return;
        
        setIsLoading(true);

        getCustomer(customerId).then(customerData => {
            if (customerData) {
                setCustomer(customerData);
            } else {
                 toast({
                    title: 'Customer not found',
                    description: 'The requested customer could not be found.',
                    variant: 'destructive',
                });
                router.push('/admin/customers');
            }
        });
        
        const artistsUnsub = listenToCollection<Artist>('artists', setArtists);

        const db = getDb();
        const bookingsQuery = query(collection(db, 'bookings'), where('customerId', '==', customerId));
        const bookingsUnsub = listenToCollection<Booking>('bookings', (customerBookings) => {
            setBookings(customerBookings.sort((a, b) => getSafeDate(b.eventDate).getTime() - getSafeDate(a.eventDate).getTime()));
            setIsLoading(false);
        }, bookingsQuery);


        return () => {
            artistsUnsub();
            bookingsUnsub();
        };

    }, [router, customerId, toast]);


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

    if (isLoading || !customer) {
        return <div className="flex items-center justify-center min-h-screen">Loading customer details...</div>;
    }

    const renderBookingRow = (booking: Booking) => {
        const assignedArtists = artists.filter(a => booking.artistIds?.includes(a.id));
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
                        {booking.serviceDates?.map((date, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                                {format(getSafeDate(date), "PPP")}
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
