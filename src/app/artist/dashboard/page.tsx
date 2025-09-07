
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Artist, Booking } from '@/types';
import { DollarSign, BarChart, Users, Star } from 'lucide-react';

interface ArtistDashboardPageProps {
    artist: Artist;
    bookings: Booking[];
}

export default function ArtistDashboardPage({ artist, bookings }: ArtistDashboardPageProps) {
    
    if (!artist || !bookings) {
        return <div className="flex items-center justify-center min-h-full">Loading Dashboard...</div>;
    }

    // Mock data for dashboard widgets
    const completedBookings = bookings.filter(b => b.status === 'Completed');
    const totalRevenue = completedBookings.reduce((sum, b) => sum + b.amount, 0);
    const totalBookings = bookings.length;
    const averageRating = artist.rating;
    const upcomingBookings = bookings.filter(b => b.status === 'Confirmed' && new Date(b.date) > new Date()).length;

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
                        <Users className="h-4 w-4 text-muted-foreground" />
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
                        <BarChart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{upcomingBookings}</div>
                        <p className="text-xs text-muted-foreground">In the next 30 days</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
