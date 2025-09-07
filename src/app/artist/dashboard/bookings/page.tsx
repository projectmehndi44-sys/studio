
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Artist, Booking } from '@/types';
import { artists as initialArtists } from '@/lib/data';

// Mock data that would be fetched for the logged-in artist
const allBookings: Booking[] = [
    { id: 'book_01', artistId: '1', customerName: 'Priya Patel', customerContact: '9876543210', serviceAddress: '123, Rose Villa, Bandra West, Mumbai', date: new Date('2024-07-20'), service: 'Bridal Mehndi', amount: 5000, status: 'Completed' },
    { id: 'book_04', artistId: '1', customerName: 'Meera Iyer', customerContact: '9876543213', serviceAddress: '321, Lakeview, Powai, Mumbai', date: new Date('2024-08-10'), service: 'Engagement Makeup', amount: 4500, status: 'Confirmed' },
    { id: 'book_07', artistId: '1', customerName: 'Neha Desai', customerContact: '9876543216', serviceAddress: '555, Juhu Beach, Mumbai', date: new Date('2024-08-20'), service: 'Bridal Package', amount: 9500, status: 'Confirmed' },
    { id: 'book_08', artistId: '2', customerName: 'Anika Verma', customerContact: '9876543217', serviceAddress: '777, CP, New Delhi', date: new Date('2024-08-22'), service: 'Reception Makeup', amount: 6000, status: 'Confirmed' },
];


export default function ArtistBookingsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [artist, setArtist] = React.useState<Artist | null>(null);
    const [bookings, setBookings] = React.useState<Booking[]>([]);

    React.useEffect(() => {
        const isArtistAuthenticated = localStorage.getItem('isArtistAuthenticated');
        const artistId = localStorage.getItem('artistId');

        if (isArtistAuthenticated !== 'true' || !artistId) {
            router.push('/artist/login');
            return;
        }

        const localArtists: Artist[] = JSON.parse(localStorage.getItem('artists') || '[]');
        const allArtists: Artist[] = [...initialArtists, ...localArtists.filter(la => !initialArtists.some(ia => ia.id === la.id))];
        const currentArtist = allArtists.find(a => a.id === artistId);
        setArtist(currentArtist || null);

        const localBookings: Booking[] = JSON.parse(localStorage.getItem('bookings') || '[]');
        const artistBookings = [...allBookings, ...localBookings].filter(b => b.artistId === artistId);
        setBookings(artistBookings);

    }, [router]);

    const handleStatusUpdate = (bookingId: string, status: 'Confirmed' | 'Completed') => {
        // This is a mock function. In a real app, this would be a server action.
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status } : b));
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

     if (!artist) {
        return <div className="flex items-center justify-center min-h-full">Loading Bookings...</div>;
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
