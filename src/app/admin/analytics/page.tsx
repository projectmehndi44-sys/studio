'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, PieChart, Map, Star, IndianRupee, Briefcase } from 'lucide-react';
import type { Artist, Booking } from '@/lib/types';
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Pie, Cell } from 'recharts';
import { BarChart as BarChartComponent, PieChart as PieChartComponent } from 'recharts';
import { listenToCollection } from '@/lib/services';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { format, parseISO, isValid } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

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

export default function AnalyticsPage() {
    const [bookings, setBookings] = React.useState<Booking[]>([]);
    const [artists, setArtists] = React.useState<Artist[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        setIsLoading(true);
        const unsubscribeBookings = listenToCollection<Booking>('bookings', (data) => {
            setBookings(data);
            if (artists.length > 0) setIsLoading(false);
        });
        const unsubscribeArtists = listenToCollection<Artist>('artists', (data) => {
            setArtists(data);
            if (bookings.length > 0 || data.length > 0) setIsLoading(false);
        });
        return () => {
            unsubscribeBookings();
            unsubscribeArtists();
        };
    }, []);
    
    // --- Chart Data Processing ---

    // 1. Bookings and Revenue over time
    const monthlyData = bookings.reduce((acc, booking) => {
        const date = getSafeDate(booking.eventDate);
        const month = format(date, 'MMM yyyy');
        if (!acc[month]) {
            acc[month] = { name: month, bookings: 0, revenue: 0 };
        }
        acc[month].bookings += 1;
        if (booking.status === 'Completed') {
            acc[month].revenue += booking.amount;
        }
        return acc;
    }, {} as Record<string, {name: string, bookings: number, revenue: number}>);
    
    const bookingsChartData = Object.values(monthlyData).sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());

    // 2. Service Popularity
    const serviceData = bookings.reduce((acc, booking) => {
        booking.items.forEach(item => {
            const serviceType = item.servicePackage.service; // 'mehndi', 'makeup', etc.
            const existing = acc.find(item => item.name === serviceType);
            if (existing) {
                existing.value += 1;
            } else {
                acc.push({ name: serviceType, value: 1 });
            }
        });
        return acc;
    }, [] as {name: string, value: number}[]);

    // 3. Bookings by Location (State)
    const locationData = bookings.reduce((acc, booking) => {
        const state = booking.state || 'Unknown';
        if (!acc[state]) {
            acc[state] = { name: state, bookings: 0 };
        }
        acc[state].bookings += 1;
        return acc;
    }, {} as Record<string, {name: string, bookings: number}>);

    const locationChartData = Object.values(locationData);


    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    // 4. Artist Leaderboard Data
    const artistPerformance = artists.map(artist => {
        const artistBookings = bookings.filter(b => b.artistIds.includes(artist.id) && b.status === 'Completed');
        const totalRevenue = artistBookings.reduce((sum, b) => sum + b.amount, 0);
        return {
            ...artist,
            totalBookings: artistBookings.length,
            totalRevenue: totalRevenue,
        };
    });

    const topArtistsByRevenue = [...artistPerformance].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 5);
    const topArtistsByBookings = [...artistPerformance].sort((a, b) => b.totalBookings - a.totalBookings).slice(0, 5);
    const topArtistsByRating = [...artists].sort((a, b) => b.rating - a.rating).slice(0, 5);

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><p>Loading analytics data...</p></div>
    }


    return (
        <>
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Analytics Dashboard</h1>
            </div>
            <div className="grid gap-4 md:gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><BarChart className="w-6 h-6 text-primary"/>Bookings & Revenue Over Time</CardTitle>
                        <CardDescription>Monthly trends for total bookings and completed revenue.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-96">
                            <ResponsiveContainer width="100%" height="100%">
                            <BarChartComponent data={bookingsChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis yAxisId="left" stroke="#8884d8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip />
                                <Legend />
                                <Bar yAxisId="left" dataKey="bookings" fill="hsl(var(--primary))" name="Total Bookings" radius={[4, 4, 0, 0]} />
                                <Bar yAxisId="right" dataKey="revenue" fill="hsl(var(--accent))" name="Completed Revenue (₹)" radius={[4, 4, 0, 0]} />
                            </BarChartComponent>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
                        <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><PieChart className="w-6 h-6 text-primary"/>Service Popularity</CardTitle>
                            <CardDescription>Distribution of bookings by service type.</CardDescription>
                        </CardHeader>
                        <CardContent className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChartComponent>
                                    <Pie data={serviceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                                            {serviceData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChartComponent>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                        <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Map className="w-6 h-6 text-primary"/>Bookings by State</CardTitle>
                            <CardDescription>Top locations for service bookings.</CardDescription>
                        </CardHeader>
                        <CardContent className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChartComponent data={locationChartData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis dataKey="name" type="category" width={80} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="bookings" fill="#FF8042" name="Bookings" />
                                </BarChartComponent>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Star className="w-6 h-6 text-primary"/>Artist Leaderboard</CardTitle>
                        <CardDescription>Identify your top performing artists across key metrics.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-4">
                            <h3 className="font-semibold flex items-center gap-2"><IndianRupee className="w-5 h-5 text-green-600"/>Top by Revenue</h3>
                            <Table>
                                <TableHeader><TableRow><TableHead>Artist</TableHead><TableHead className="text-right">Revenue</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {topArtistsByRevenue.map(artist => (
                                        <TableRow key={artist.id}>
                                            <TableCell className="font-medium p-2">
                                                <Link href={`/admin/artists/${artist.id}`} className="flex items-center gap-2 hover:underline">
                                                    <Avatar className="w-8 h-8"><AvatarImage src={artist.profilePicture} /><AvatarFallback>{artist.name.charAt(0)}</AvatarFallback></Avatar>
                                                    {artist.name}
                                                </Link>
                                            </TableCell>
                                            <TableCell className="text-right p-2">₹{artist.totalRevenue.toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                         <div className="space-y-4">
                            <h3 className="font-semibold flex items-center gap-2"><Briefcase className="w-5 h-5 text-blue-600"/>Top by Bookings</h3>
                             <Table>
                                <TableHeader><TableRow><TableHead>Artist</TableHead><TableHead className="text-right">Bookings</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {topArtistsByBookings.map(artist => (
                                        <TableRow key={artist.id}>
                                            <TableCell className="font-medium p-2">
                                                 <Link href={`/admin/artists/${artist.id}`} className="flex items-center gap-2 hover:underline">
                                                    <Avatar className="w-8 h-8"><AvatarImage src={artist.profilePicture} /><AvatarFallback>{artist.name.charAt(0)}</AvatarFallback></Avatar>
                                                    {artist.name}
                                                </Link>
                                            </TableCell>
                                            <TableCell className="text-right p-2">{artist.totalBookings}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                         <div className="space-y-4">
                            <h3 className="font-semibold flex items-center gap-2"><Star className="w-5 h-5 text-amber-500"/>Top by Rating</h3>
                             <Table>
                                <TableHeader><TableRow><TableHead>Artist</TableHead><TableHead className="text-right">Rating</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {topArtistsByRating.map(artist => (
                                        <TableRow key={artist.id}>
                                            <TableCell className="font-medium p-2">
                                                <Link href={`/admin/artists/${artist.id}`} className="flex items-center gap-2 hover:underline">
                                                    <Avatar className="w-8 h-8"><AvatarImage src={artist.profilePicture} /><AvatarFallback>{artist.name.charAt(0)}</AvatarFallback></Avatar>
                                                    {artist.name}
                                                </Link>
                                            </TableCell>
                                            <TableCell className="text-right p-2"><Badge variant="default">{artist.rating.toFixed(1)}</Badge></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
