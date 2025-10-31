'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Briefcase, IndianRupee, Star, BarChart, PieChart } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { listenToCollection, getFinancialSettings } from '@/lib/services';
import type { Artist, Booking } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAdminAuth } from '@/firebase/auth/use-admin-auth';
import { cn } from '@/lib/utils';
import { Bar as BarRechart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Pie, Cell } from 'recharts';
import { BarChart as BarChartComponent, PieChart as PieChartComponent } from 'recharts';
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


function DashboardCard({ title, value, description, icon: Icon, href, className }: { title: string, value: string, description: string, icon: React.ElementType, href?: string, className?: string }) {
    const CardContentWrapper = ({children}: {children: React.ReactNode}) => {
        const content = (
             <Card className={cn("hover:bg-muted/50 transition-colors", className)}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{value}</div>
                    <p className="text-xs text-muted-foreground">{description}</p>
                </CardContent>
            </Card>
        );
        return href ? <Link href={href}>{content}</Link> : <>{content}</>;
    }

    return <CardContentWrapper>{null}</CardContentWrapper>;
}

export default function AdminPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAdminAuth();
    const [approvedArtists, setApprovedArtists] = React.useState<Artist[]>([]);
    const [bookings, setBookings] = React.useState<Booking[]>([]);
    const [pendingBookingCount, setPendingBookingCount] = React.useState(0);
    const [financials, setFinancials] = React.useState({
        totalRevenue: 0,
        platformFee: 0,
        netProfit: 0
    });

    React.useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/admin/login');
        } else if (isAuthenticated) {
            const unsubscribeArtists = listenToCollection<Artist>('artists', setApprovedArtists);
            const unsubscribeBookings = listenToCollection<Booking>('bookings', (currentBookings) => {
                setBookings(currentBookings);
                const pendingCount = currentBookings.filter((b: Booking) => b.status === 'Pending Approval' || b.status === 'Needs Assignment').length;
                setPendingBookingCount(pendingCount);
            });

            return () => {
                unsubscribeArtists();
                unsubscribeBookings();
            }
        }
    }, [isLoading, isAuthenticated, router]);

     // Effect for calculating financials
    React.useEffect(() => {
        const calculateRevenue = async (filteredBookings: Booking[]) => {
            const { platformFeePercentage, platformRefundFee } = await getFinancialSettings();
            
            const completed = filteredBookings.filter(b => b.status === 'Completed');
            const totalRevenue = completed.reduce((sum, b) => sum + b.amount, 0);
            const platformFee = totalRevenue * (platformFeePercentage / 100);
            const refunds = platformRefundFee; // Mocked data for now
            const netProfit = platformFee - refunds; // Platform profit is the commission minus refunds

            return { totalRevenue, platformFee, netProfit };
        };
        
        if (bookings.length > 0) {
            calculateRevenue(bookings).then(setFinancials);
        }

    }, [bookings]);

    const getStatusVariant = (status: Booking['status']) => {
        switch (status) {
            case 'Completed': return 'default';
            case 'Confirmed': return 'default';
            case 'Pending Approval': return 'secondary';
            case 'Needs Assignment': return 'destructive';
            case 'Cancelled': return 'destructive';
            case 'Disputed': return 'destructive';
            default: return 'outline';
        }
    };
    
      // --- Chart Data Processing ---
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

    const serviceData = bookings.reduce((acc, booking) => {
        booking.items.forEach(item => {
            const serviceType = item.servicePackage.service;
            const existing = acc.find(item => item.name === serviceType);
            if (existing) {
                existing.value += 1;
            } else {
                acc.push({ name: serviceType, value: 1 });
            }
        });
        return acc;
    }, [] as {name: string, value: number}[]);
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    if (isLoading || !isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-full">
                <p>Loading dashboard...</p>
            </div>
        );
    }

    return (
        <>
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1>
            </div>
            <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
                 <DashboardCard
                    title="Total Revenue"
                    value={`₹${financials.totalRevenue.toLocaleString()}`}
                    description="Based on completed bookings"
                    icon={IndianRupee}
                    href="/admin/transactions"
                />
                 <DashboardCard
                    title="Total Bookings"
                    value={`+${bookings.length}`}
                    description="All-time bookings"
                    icon={Briefcase}
                    href="/admin/bookings"
                />
                <DashboardCard
                    title="Net Profit"
                    value={`₹${financials.netProfit.toLocaleString()}`}
                    description="Total platform fees minus refunds"
                    icon={Star}
                    className="text-green-600"
                />
                <DashboardCard
                    title="Pending Bookings"
                    value={`${pendingBookingCount}`}
                    description="Require assignment or approval"
                    icon={Bell}
                    href="/admin/bookings?filter=pending"
                    className={pendingBookingCount > 0 ? "text-destructive" : ""}
                />
            </div>
            <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
                 <Card className="xl:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><BarChart className="w-5 h-5 text-primary"/>Bookings & Revenue</CardTitle>
                        <CardDescription>Monthly trends for bookings and revenue.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-80">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChartComponent data={bookingsChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false}/>
                                <YAxis yAxisId="left" stroke="#8884d8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip />
                                <Legend />
                                <BarRechart yAxisId="left" dataKey="bookings" fill="hsl(var(--primary))" name="Bookings" radius={[4, 4, 0, 0]} />
                                <BarRechart yAxisId="right" dataKey="revenue" fill="hsl(var(--accent))" name="Revenue (₹)" radius={[4, 4, 0, 0]} />
                            </BarChartComponent>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><PieChart className="w-5 h-5 text-primary"/>Service Popularity</CardTitle>
                        <CardDescription>Breakdown of bookings by service type.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChartComponent>
                                <Pie data={serviceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
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
            <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
                <Card className="xl:col-span-1">
                    <CardHeader>
                        <CardTitle>Recent Bookings</CardTitle>
                        <CardDescription>A list of the most recent bookings on the platform.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Artist</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bookings.slice(0, 5).map((booking) => {
                                    const assignedArtists = approvedArtists.filter(a => booking.artistIds && booking.artistIds.includes(a.id));
                                    return (
                                        <TableRow key={booking.id}>
                                            <TableCell>{booking.customerName}</TableCell>
                                            <TableCell>
                                                {assignedArtists.length > 0 ? (
                                                     <div className="flex flex-col gap-1">
                                                        {assignedArtists.map(a => (
                                                            <div key={a.id} className="flex items-center gap-2">
                                                                <Avatar className="h-6 w-6">
                                                                    <AvatarImage src={a.profilePicture} alt={a.name}/>
                                                                    <AvatarFallback>{a.name.charAt(0)}</AvatarFallback>
                                                                </Avatar>
                                                                <span>{a.name}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : <span className="text-muted-foreground">N/A</span>}
                                            </TableCell>
                                            <TableCell>{getSafeDate(booking.eventDate).toLocaleDateString()}</TableCell>
                                            <TableCell>₹{booking.amount}</TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusVariant(booking.status)}>
                                                    {booking.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Card className="xl:col-span-1">
                     <CardHeader className="flex flex-row items-center">
                        <div className="grid gap-2">
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>
                            Jump to key management sections.
                        </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <Button asChild variant="outline"><Link href="/admin/bookings">Manage Bookings</Link></Button>
                        <Button asChild variant="outline"><Link href="/admin/artists">Manage Artists</Link></Button>
                        <Button asChild variant="outline"><Link href="/admin/payouts">Process Payouts</Link></Button>
                        <Button asChild variant="outline"><Link href="/admin/settings">Go to Settings</Link></Button>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
