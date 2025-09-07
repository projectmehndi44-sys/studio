
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Artist, Booking } from '@/types';
import { DollarSign, Briefcase, Star, Bell } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { allBookings as initialBookings } from '@/lib/data';


interface ArtistDashboardPageProps {
    artist: Artist;
}

export default function ArtistDashboardPage({ artist }: ArtistDashboardPageProps) {
    const [bookings, setBookings] = React.useState<Booking[]>([]);

    const fetchArtistData = React.useCallback(() => {
        const allBookingsData: Booking[] = JSON.parse(localStorage.getItem('bookings') || JSON.stringify(initialBookings));
        const artistBookings = allBookingsData
            .map(b => ({ ...b, date: new Date(b.date) }))
            .filter(b => b.artistIds.includes(artist.id));
        setBookings(artistBookings);
    }, [artist.id]);

    React.useEffect(() => {
        fetchArtistData();
        window.addEventListener('storage', fetchArtistData);
        return () => {
            window.removeEventListener('storage', fetchArtistData);
        };
    }, [fetchArtistData]);
    
    if (!artist || !bookings) {
        return <div className="flex items-center justify-center min-h-full">Loading Dashboard...</div>;
    }

    // Dashboard widgets data
    const completedBookings = bookings.filter(b => b.status === 'Completed');
    const totalRevenue = completedBookings.reduce((sum, b) => sum + b.amount, 0);
    const totalBookings = bookings.length;
    const averageRating = artist.rating;
    const upcomingBookingsCount = bookings.filter(b => b.status === 'Confirmed' && new Date(b.date) > new Date()).length;

    // Recent activity data
    const recentBookings = [...bookings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

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

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Welcome back, {artist.name}!</CardTitle>
                    <CardDescription>Here's a quick overview of your performance on MehendiFy.</CardDescription>
                </CardHeader>
            </Card>

             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Based on completed bookings</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{totalBookings}</div>
                         <p className="text-xs text-muted-foreground">All-time bookings</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                        <Star className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{averageRating}</div>
                         <p className="text-xs text-muted-foreground">From customer reviews</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Upcoming Bookings</CardTitle>
                        <Bell className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{upcomingBookingsCount}</div>
                        <p className="text-xs text-muted-foreground">Confirmed bookings</p>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2"><Briefcase /> Recent Activity</CardTitle>
                        <CardDescription>Your last 5 bookings are shown here.</CardDescription>
                    </div>
                     <Link href="/artist/dashboard/bookings">
                        <Button variant="outline" size="sm">View All</Button>
                    </Link>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Service</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentBookings.length > 0 ? recentBookings.map(booking => (
                                <TableRow key={booking.id}>
                                    <TableCell>{booking.customerName}</TableCell>
                                    <TableCell>{new Date(booking.date).toLocaleDateString()}</TableCell>
                                    <TableCell>{booking.service}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(booking.status)}>{booking.status}</Badge>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center">You have no booking history yet.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
