
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Artist } from '@/types';
import { artists as initialArtists } from '@/lib/data';
import { DollarSign, BarChart, Users, Star } from 'lucide-react';

export default function ArtistDashboardPage() {
    const router = useRouter();
    const [artist, setArtist] = React.useState<Artist | null>(null);

    React.useEffect(() => {
        const isArtistAuthenticated = localStorage.getItem('isArtistAuthenticated');
        const artistId = localStorage.getItem('artistId');

        if (isArtistAuthenticated !== 'true' || !artistId) {
            router.push('/artist/login');
            return;
        }
        
        const localArtists: Artist[] = JSON.parse(localStorage.getItem('artists') || '[]');
        const allArtists: Artist[] = [...initialArtists, ...localArtists.filter(la => !initialArtists.some(ia => ia.id === la.id))];

        const currentArtist = allArtists.find((a: Artist) => a.id === artistId);
        
        if (currentArtist) {
            setArtist(currentArtist);
        } else {
            router.push('/artist/login');
        }
    }, [router]);

    if (!artist) {
        return <div className="flex items-center justify-center min-h-full">Loading Dashboard...</div>;
    }

    // Mock data for dashboard widgets
    const totalRevenue = 52350;
    const totalBookings = 12;
    const averageRating = 4.9;
    const upcomingBookings = 3;

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
            {/* We can add charts or recent activity feeds here in the future */}
        </div>
    )
}
