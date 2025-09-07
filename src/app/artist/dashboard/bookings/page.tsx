
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Booking } from '@/types';

interface ArtistBookingsPageProps {
    bookings: Booking[];
    setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
}

export default function ArtistBookingsPage({ bookings, setBookings }: ArtistBookingsPageProps) {
    const { toast } = useToast();

    const handleStatusUpdate = (bookingId: string, status: 'Completed') => {
        // This function simulates updating the booking status.
        // In a real app, this would be a server action that updates your database.
        const updatedArtistBookings = bookings.map(b => 
            b.id === bookingId ? { ...b, status } : b
        );
        setBookings(updatedArtistBookings); // Update the local state for the artist's view

        // To ensure the Admin portal gets the update, we need to update the master list in localStorage
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
                            <TableHead>Date</TableHead>
                            <TableHead>Service</TableHead>
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
                                <TableCell>{booking.service}</TableCell>
                                <TableCell>{booking.serviceAddress}</TableCell>
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
