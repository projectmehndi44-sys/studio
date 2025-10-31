
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Briefcase, Calendar, Check, Clock, IndianRupee, MapPin, ShieldCheck, Star } from 'lucide-react';
import { useAccount } from './layout';
import Link from 'next/link';
import { format } from 'date-fns';
import { getSafeDate } from '@/lib/utils';
import { Booking } from '@/lib/types';

export default function AccountDashboardPage() {
    const { customer, bookings, artists, upcomingBookings, pastBookings } = useAccount();

    const nextBooking = upcomingBookings.length > 0 ? upcomingBookings[0] : null;
    const lastCompletedBooking = pastBookings.find(b => b.status === 'Completed' && !b.reviewSubmitted);

    const stats = [
        { name: 'Upcoming Bookings', value: upcomingBookings.length, icon: <Clock className="w-6 h-6 text-blue-500" /> },
        { name: 'Completed Bookings', value: pastBookings.filter(b => b.status === 'Completed').length, icon: <Check className="w-6 h-6 text-green-500" /> },
        { name: 'Total Spent', value: `₹${bookings.filter(b => b.status === 'Completed').reduce((sum, b) => sum + b.amount, 0).toLocaleString()}`, icon: <IndianRupee className="w-6 h-6 text-primary" /> },
        { name: 'Reviews Submitted', value: bookings.filter(b => b.reviewSubmitted).length, icon: <Star className="w-6 h-6 text-amber-500" /> },
    ];
    
     const getStatusVariant = (status: Booking['status']) => {
        switch (status) {
            case 'Completed': return 'default';
            case 'Confirmed': return 'secondary';
            case 'Pending Approval': return 'outline';
            case 'Needs Assignment': return 'outline';
            case 'Cancelled': return 'destructive';
            case 'Disputed': return 'destructive';
            default: return 'outline';
        }
    };

    if (!customer) {
        return <div>Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl md:text-3xl">Welcome back, {customer.name}!</CardTitle>
                    <CardDescription>Here’s a quick look at your UtsavLook account.</CardDescription>
                </CardHeader>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map(stat => (
                    <Card key={stat.name}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
                            {stat.icon}
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {nextBooking && (
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-xl">Your Next Booking</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Service</TableHead>
                                    <TableHead>Artist(s)</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell>{nextBooking.items.map(i => i.servicePackage.name).join(', ')}</TableCell>
                                    <TableCell>
                                        {artists.filter(a => nextBooking.artistIds?.includes(a.id)).map(a => a.name).join(', ') || <span className="text-muted-foreground">To be assigned</span>}
                                    </TableCell>
                                    <TableCell>{format(getSafeDate(nextBooking.eventDate), "PPP")}</TableCell>
                                    <TableCell>{nextBooking.locality}</TableCell>
                                    <TableCell><Badge variant={getStatusVariant(nextBooking.status)}>{nextBooking.status}</Badge></TableCell>
                                </TableRow>
                                {nextBooking.status === 'Confirmed' && nextBooking.completionCode && (
                                     <TableRow key={`code-${nextBooking.id}`} className="bg-muted/50">
                                         <TableCell colSpan={5} className="p-0">
                                             <Alert variant="default" className="border-0 border-l-4 border-primary rounded-none">
                                                <ShieldCheck className="h-4 w-4 text-primary" />
                                                <AlertTitle className="font-semibold">Your Service Completion Code</AlertTitle>
                                                <AlertDescription>
                                                    Share this code with your artist only after your service is fully completed: <strong className="text-lg tracking-widest ml-2">{nextBooking.completionCode}</strong>
                                                </AlertDescription>
                                            </Alert>
                                         </TableCell>
                                     </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                     <CardFooter className="justify-end">
                        <Button asChild variant="outline">
                            <Link href="/account/bookings">View All Bookings</Link>
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {lastCompletedBooking && (
                <Card>
                     <CardHeader>
                        <CardTitle className="text-xl">How was your last service?</CardTitle>
                        <CardDescription>Review your experience for "{lastCompletedBooking.items.map(i => i.servicePackage.name).join(', ')}" to help other customers.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{lastCompletedBooking.items.map(i => i.servicePackage.name).join(', ')}</p>
                            <p className="text-sm text-muted-foreground">on {format(getSafeDate(lastCompletedBooking.eventDate), "PPP")}</p>
                        </div>
                        <Button asChild>
                           <Link href="/account/bookings">Rate & Review</Link>
                        </Button>
                    </CardContent>
                </Card>
            )}

            {!nextBooking && !lastCompletedBooking && (
                 <Card className="text-center py-12">
                    <CardHeader>
                        <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
                        <CardTitle>No Bookings Yet</CardTitle>
                        <CardDescription>You haven't made any bookings yet. Let's find your perfect look!</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href="/">Browse Services</Link>
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
