

'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Booking } from '@/types';
import { useArtistPortal } from '../layout';
import { MapPin, User, Phone } from 'lucide-react';
import { format } from 'date-fns';

export default function ArtistBookingsPage() {
    const { artistBookings, allBookings } = useArtistPortal();
    const { toast } = useToast();

    const handleStatusUpdate = (bookingId: string, status: 'Completed') => {
        // This function simulates updating the booking status.
        // In a real app, this would be a server action that updates your database.
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

    if (!artistBookings) {
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
                            <TableHead>Customer Details</TableHead>
                            <TableHead>Event Details</TableHead>
                            <TableHead>Service Dates</TableHead>
                            <TableHead>Venue</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {artistBookings.length > 0 ? artistBookings.map(booking => (
                            <TableRow key={booking.id}>
                                <TableCell className="font-medium">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <span>{booking.customerName}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Phone className="h-4 w-4" />
                                            <span>{booking.customerContact}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                     <div className="flex flex-col">
                                        <span>{booking.eventType}</span>
                                        <span className="text-xs text-muted-foreground">{new Date(booking.eventDate).toLocaleDateString()}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        {booking.serviceDates.map((date, index) => (
                                            <Badge key={index} variant="outline" className="text-xs">
                                                {format(new Date(date), "PPP")}
                                            </Badge>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span>{booking.serviceAddress}</span>
                                        {booking.mapLink && (
                                            <a href={booking.mapLink} target="_blank" rel="noopener noreferrer">
                                                <Button variant="link" className="p-0 h-auto text-xs text-primary">
                                                    <MapPin className="mr-1 h-3 w-3"/>
                                                    Track Location
                                                </Button>
                                            </a>
                                        )}
                                    </div>
                                </TableCell>
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
