
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, PieChart, Map } from 'lucide-react';
import type { Booking } from '@/types';
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Pie, Cell } from 'recharts';
import { BarChart as BarChartComponent, PieChart as PieChartComponent } from 'recharts';
import { allBookings as initialBookings } from '@/lib/data';


export default function AnalyticsPage() {
    const router = useRouter();
    const [bookings, setBookings] = React.useState<Booking[]>([]);

    const fetchBookings = React.useCallback(() => {
        const storedBookings = localStorage.getItem('bookings');
        const currentBookings = storedBookings ? JSON.parse(storedBookings) : initialBookings;
        setBookings(currentBookings.map((b: any) => ({...b, date: new Date(b.date)})));
    }, []);

    React.useEffect(() => {
        const isAdminAuthenticated = localStorage.getItem('isAdminAuthenticated');
        if (isAdminAuthenticated !== 'true') {
            router.push('/admin/login');
        }
        fetchBookings();
        window.addEventListener('storage', fetchBookings);
        return () => window.removeEventListener('storage', fetchBookings);
    }, [router, fetchBookings]);
    
    // --- Chart Data Processing ---

    // 1. Bookings and Revenue over time
    const monthlyData = bookings.reduce((acc, booking) => {
        const month = new Date(booking.date).toLocaleString('default', { month: 'short', year: 'numeric' });
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


    return (
        <>
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Analytics</h1>
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
            </div>
        </>
    );
}
