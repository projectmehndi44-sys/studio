
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Shield, ArrowLeft, BarChart, PieChart, Users, Map } from 'lucide-react';
import type { Booking } from '@/types';
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Pie, Cell } from 'recharts';
import { BarChart as BarChartComponent, PieChart as PieChartComponent } from 'recharts';


const allBookings: Booking[] = [
    { id: 'book_01', artistIds: ['1'], customerName: 'Priya Patel', customerContact: "9876543210", serviceAddress: "address, Maharashtra", date: new Date('2024-07-20'), service: 'Bridal Mehndi', amount: 5000, status: 'Completed' },
    { id: 'book_02', artistIds: ['2'], customerName: 'Anjali Sharma', customerContact: "9876543211", serviceAddress: "address, Delhi", date: new Date('2024-07-25'), service: 'Party Makeup', amount: 3000, status: 'Completed' },
    { id: 'book_03', artistIds: ['3'], customerName: 'Sneha Reddy', customerContact: "9876543212", serviceAddress: "address, Karnataka", date: new Date('2024-08-05'), service: 'Mehndi & Makeup', amount: 8000, status: 'Pending Approval' },
    { id: 'book_04', artistIds: ['1'], customerName: 'Meera Iyer', customerContact: "9876543213", serviceAddress: "address, Maharashtra", date: new Date('2024-08-10'), service: 'Engagement Makeup', amount: 4500, status: 'Confirmed' },
    { id: 'book_05', artistIds: [], customerName: 'Rohan Gupta', customerContact: "9876543214", serviceAddress: "address, Maharashtra", date: new Date('2024-08-12'), service: 'Mehndi Package', amount: 1800, status: 'Needs Assignment' },
    { id: 'book_06', artistIds: ['4'], customerName: 'Kavita Singh', customerContact: "9876543215", serviceAddress: "address, Gujarat", date: new Date('2024-06-15'), service: 'Minimalist Mehndi', amount: 2200, status: 'Completed' },
];

export default function AnalyticsPage() {
    const router = useRouter();
    const [bookings, setBookings] = React.useState<Booking[]>([]);

    React.useEffect(() => {
        const isAdminAuthenticated = localStorage.getItem('isAdminAuthenticated');
        if (isAdminAuthenticated !== 'true') {
            router.push('/admin/login');
        }

        const storedBookings = localStorage.getItem('bookings');
        setBookings(storedBookings ? JSON.parse(storedBookings).map((b: any) => ({...b, date: new Date(b.date)})) : allBookings);
    }, [router]);
    
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
        const state = booking.serviceAddress.split(',').pop()?.trim() || 'Unknown';
        if (!acc[state]) {
            acc[state] = { name: state, bookings: 0 };
        }
        acc[state].bookings += 1;
        return acc;
    }, {} as Record<string, {name: string, bookings: number}>);

    const locationChartData = Object.values(locationData);


    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];


    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6 justify-between">
                <h1 className="flex items-center gap-2 text-xl font-bold text-primary">
                    <Shield className="w-6 h-6" />
                    Analytics Dashboard
                </h1>
                <Link href="/admin/settings">
                     <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4"/> Back to Settings</Button>
                </Link>
            </header>
            <main className="flex-1 p-4 sm:px-6 sm:py-0 md:gap-8">
                <div className="max-w-7xl mx-auto grid gap-6 py-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><BarChart className="w-6 h-6 text-primary"/>Bookings & Revenue Over Time</CardTitle>
                            <CardDescription>Monthly trends for total bookings and completed revenue.</CardDescription>
                        </CardHeader>
                        <CardContent className="h-96">
                             <ResponsiveContainer width="100%" height="100%">
                                <BarChartComponent data={bookingsChartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                                    <Tooltip />
                                    <Legend />
                                    <Bar yAxisId="left" dataKey="bookings" fill="#8884d8" name="Total Bookings" />
                                    <Bar yAxisId="right" dataKey="revenue" fill="#82ca9d" name="Completed Revenue (₹)" />
                                </BarChartComponent>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <div className="grid md:grid-cols-2 gap-6">
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
            </main>
        </div>
    );
}
