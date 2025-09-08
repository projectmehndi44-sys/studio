

'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Booking } from '@/types';
import { IndianRupee, Briefcase, Star, Bell, BarChart, PieChart } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useArtistPortal } from './layout';
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Pie, Cell } from 'recharts';
import { BarChart as BarChartComponent, PieChart as PieChartComponent } from 'recharts';

export default function ArtistDashboardPage() {
    const { artist, artistBookings } = useArtistPortal();
    
    if (!artist) {
        return <div className="flex items-center justify-center min-h-full">Loading Dashboard...</div>;
    }

    // Dashboard widgets data
    const completedBookings = artistBookings.filter(b => b.status === 'Completed');
    const totalRevenue = completedBookings.reduce((sum, b) => sum + b.amount, 0);
    const totalBookings = artistBookings.length;
    const averageRating = artist.rating;
    const upcomingBookingsCount = artistBookings.filter(b => b.status === 'Confirmed' && new Date(b.date) > new Date()).length;

    // Recent activity data
    const recentBookings = [...artistBookings].slice(0, 5);

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
    
    // --- Chart Data Processing ---

    // 1. Bookings over time
    const monthlyData = artistBookings.reduce((acc, booking) => {
        const month = new Date(booking.date).toLocaleString('default', { month: 'short', year: 'numeric' });
        if (!acc[month]) {
            acc[month] = { name: month, bookings: 0 };
        }
        acc[month].bookings += 1;
        return acc;
    }, {} as Record<string, {name: string, bookings: number}>);
    
    const bookingsChartData = Object.values(monthlyData).sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());

    // 2. Service Popularity
    const serviceData = artistBookings.reduce((acc, booking) => {
        const serviceType = booking.service.toLowerCase().includes('mehndi') && booking.service.toLowerCase().includes('makeup') 
            ? 'Both'
            : booking.service.toLowerCase().includes('mehndi') ? 'Mehndi' : 'Makeup';
        
        const existing = acc.find(item => item.name === serviceType);
        if (existing) {
            existing.value += 1;
        } else {
            acc.push({ name: serviceType, value: 1 });
        }
        return acc;
    }, [] as {name: string, value: number}[]);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];


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
                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
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
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><BarChart className="w-5 h-5 text-primary"/>Bookings Over Time</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChartComponent data={bookingsChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="bookings" fill="#8884d8" name="Bookings" />
                            </BarChartComponent>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><PieChart className="w-5 h-5 text-primary"/>Service Breakdown</CardTitle>
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
