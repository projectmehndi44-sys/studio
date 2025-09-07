
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Bell, Briefcase, DollarSign, Star } from "lucide-react";
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
import { artists as initialArtists, allBookings as initialBookings } from '@/lib/data';
import type { Artist, Booking } from '@/types';


export default function AdminPage() {
    const router = useRouter();
    const [approvedArtists, setApprovedArtists] = React.useState<Artist[]>([]);
    const [bookings, setBookings] = React.useState<Booking[]>([]);
    const [pendingBookingCount, setPendingBookingCount] = React.useState(0);
    const [financials, setFinancials] = React.useState({
        totalRevenue: 0,
        platformFee: 0,
        netProfit: 0
    });

    const fetchAdminData = React.useCallback(() => {
        // Fetch approved artists
        const storedArtists = localStorage.getItem('artists');
        const localArtists = storedArtists ? JSON.parse(storedArtists) : [];
        const allApproved = [...initialArtists.filter(a => !localArtists.some((la: Artist) => la.id === a.id)), ...localArtists];
        setApprovedArtists(allApproved);
        
        // Fetch and count pending bookings
        const storedBookings = localStorage.getItem('bookings');
        const currentBookings: Booking[] = storedBookings ? JSON.parse(storedBookings).map((b: any) => ({...b, date: new Date(b.date)})) : initialBookings;
        setBookings(currentBookings);
        const pendingCount = currentBookings.filter((b: Booking) => b.status === 'Pending Approval' || b.status === 'Needs Assignment').length;
        setPendingBookingCount(pendingCount);

    }, []);

    React.useEffect(() => {
        fetchAdminData();
        // Listen for storage changes to update lists
        window.addEventListener('storage', fetchAdminData);
        return () => window.removeEventListener('storage', fetchAdminData);
    }, [fetchAdminData]);

     // Effect for calculating financials
    React.useEffect(() => {
        const calculateRevenue = (filteredBookings: Booking[]) => {
            const platformFeePercentage = parseFloat(localStorage.getItem('platformFeePercentage') || '10') / 100;
            const refundFee = parseFloat(localStorage.getItem('platformRefundFee') || '500');

            const completed = filteredBookings.filter(b => b.status === 'Completed');
            const totalRevenue = completed.reduce((sum, b) => sum + b.amount, 0);
            const platformFee = totalRevenue * platformFeePercentage;
            const refunds = refundFee; // Mocked data for now
            const netProfit = platformFee - refunds; // Platform profit is the commission minus refunds

            return { totalRevenue, platformFee, netProfit };
        };

        setFinancials(calculateRevenue(bookings));

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

    return (
        <>
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1>
            </div>
            <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{financials.totalRevenue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Based on completed bookings</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{bookings.length}</div>
                        <p className="text-xs text-muted-foreground">All-time bookings</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                        <Star className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">₹{financials.netProfit.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Total platform fees minus refunds</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Bookings</CardTitle>
                        <Bell className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingBookingCount}</div>
                        <p className="text-xs text-muted-foreground">Require assignment or approval</p>
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
                                    const assignedArtists = approvedArtists.filter(a => booking.artistIds.includes(a.id));
                                    return (
                                        <TableRow key={booking.id}>
                                            <TableCell>{booking.customerName}</TableCell>
                                            <TableCell>{assignedArtists.length > 0 ? assignedArtists.map(a => a.name).join(', ') : <span className="text-muted-foreground">N/A</span>}</TableCell>
                                            <TableCell>{new Date(booking.date).toLocaleDateString()}</TableCell>
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
