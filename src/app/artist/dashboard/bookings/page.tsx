
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Booking } from '@/types';
import { allBookings as initialBookings } from '@/lib/data';

interface ArtistBookingsPageProps {
    artistId: string;
}

export default function ArtistBookingsPage({ artistId }: ArtistBookingsPageProps) {
    const { toast } = useToast();
    const [bookings, setBookings] = React.useState<Booking[]>([]);

    const fetchBookings = React.useCallback(() => {
        const allBookings: Booking[] = JSON.parse(localStorage.getItem('bookings') || JSON.stringify(initialBookings)).map((b: any) => ({...b, date: new Date(b.date)}));
        const artistBookings = allBookings.filter(b => b.artistIds.includes(artistId));
        setBookings(artistBookings.sort((a,b) => b.date.getTime() - a.date.getTime()));
    }, [artistId]);
    
    React.useEffect(() => {
        fetchBookings();
        window.addEventListener('storage', fetchBookings);
        return () => window.removeEventListener('storage', fetchBookings);
    }, [fetchBookings]);


    const handleStatusUpdate = (bookingId: string, status: 'Completed') => {
        // This function simulates updating the booking status.
        // In a real app, this would be a server action that updates your database.
        const allBookings: Booking[] = JSON.parse(localStorage.getItem('bookings') || '[]').map((b: any) => ({...b, date: new Date(b.date)}));
        const newAllBookings = allBookings.map((b: Booking) => 
            b.id === bookingId ? { ...b, status } : b
        );
        localStorage.setItem('bookings', JSON.stringify(newAllBookings));

        // Dispatch a storage event to notify other open tabs (like the admin portal)
        window.dispatchEvent(new Event('storage'));
        
        toast({
            title: "Booking Updated!",
            description: `Booking #${bookingId} has been marked as ${status}. Your payout will be processed in the next cycle.`
        });
    }

    const getStatusVariant = (status: Booking['status']) => {
        switch (status) {
            case 'Completed': return 'default';
            case 'Confirmed': return 'secondary';
            case 'Pending Approval': return 'outline';
            case 'Cancelled': return 'destructive';
            case 'Disputed': return 'destructive';
            default: return 'outline';
        }
    };

    if (!bookings) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Your Bookings</CardTitle>
                    <CardDescription>Manage your upcoming and past bookings.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Loading bookings...</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Your Bookings</CardTitle>
                <CardDescription>Manage your upcoming and past bookings. Mark bookings as 'Completed' once the service is done to request your payout.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead>Mehndi Date</TableHead>
                            <TableHead>Event Type</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {bookings.length > 0 ? bookings.map(booking => (
                            <TableRow key={booking.id}>
                                <TableCell>{booking.customerName}</TableCell>
                                <TableCell>{new Date(booking.date).toLocaleDateString()}</TableCell>
                                <TableCell>{booking.eventType}</TableCell>
                                <TableCell>{booking.location}, {booking.district}</TableCell>
                                <TableCell>
                                    <Badge variant={getStatusVariant(booking.status)}>{booking.status}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    {booking.status === 'Confirmed' && (
                                        <Button size="sm" onClick={() => handleStatusUpdate(booking.id, 'Completed')}>
                                            Mark as Completed
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center">You have no bookings yet.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
