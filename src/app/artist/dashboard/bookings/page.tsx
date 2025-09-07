
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

    const handleStatusUpdate = (bookingId: string, status: 'Confirmed' | 'Completed') => {
        // In a real app, this would be a server action.
        const updatedBookings = bookings.map(b => b.id === bookingId ? { ...b, status } : b);
        
        // Persist to localStorage to simulate backend
        const allBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        const newAllBookings = allBookings.map((b: Booking) => b.id === bookingId ? { ...b, status } : b);
        localStorage.setItem('bookings', JSON.stringify(newAllBookings));

        setBookings(updatedBookings);
        
        toast({
            title: "Booking Updated",
            description: `Booking #${bookingId} has been marked as ${status}.`
        });
    }

    const getStatusVariant = (status: Booking['status']) => {
        switch (status) {
            case 'Completed': return 'default';
            case 'Confirmed': return 'secondary';
            case 'Pending Approval': return 'outline';
            case 'Cancelled': return 'destructive';
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
                <CardDescription>Manage your upcoming and past bookings.</CardDescription>
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
                            <TableHead>Action</TableHead>
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
                                <TableCell>
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
