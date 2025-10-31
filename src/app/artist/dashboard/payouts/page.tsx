
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import type { Booking, PayoutHistory } from '@/lib/types';
import { useArtistPortal } from '../layout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listenToCollection, getFinancialSettings } from '@/lib/services';
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

export default function ArtistPayoutsPage() {
    const { artist, artistBookings } = useArtistPortal();
    const [payouts, setPayouts] = React.useState<Booking[]>([]);
    const [payoutHistory, setPayoutHistory] = React.useState<PayoutHistory[]>([]);
    const [pendingAmount, setPendingAmount] = React.useState(0);
    const [platformFeePercentage, setPlatformFeePercentage] = React.useState(0.1);

    React.useEffect(() => {
        getFinancialSettings().then(settings => {
             if (settings) {
                setPlatformFeePercentage(settings.platformFeePercentage / 100);
             }
        });
    }, []);

    React.useEffect(() => {
        if (!artist?.id) return;
        
        const unsub = listenToCollection<PayoutHistory>('payoutHistory', (allHistory) => {
            const artistHistory = allHistory
                .filter(p => p.artistId === artist.id)
                .sort((a,b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
            setPayoutHistory(artistHistory);
        });

        return () => unsub();
    }, [artist?.id]);

    React.useEffect(() => {
        if (!artist) return;
        // Bookings that are completed but not yet paid out
        const pendingPayouts = artistBookings.filter(b => b.status === 'Completed' && !b.paidOut);
        setPayouts(pendingPayouts);
        
        const totalPendingGross = pendingPayouts.reduce((sum, b) => {
            const bookingShare = b.amount / (b.artistIds.length || 1);
            if (b.paymentMethod === 'offline') return sum;
            return sum + bookingShare;
        }, 0);
        
        const taxableAmount = totalPendingGross / 1.18;
        const platformFee = taxableAmount * platformFeePercentage;
        setPendingAmount(taxableAmount - platformFee);

    }, [artistBookings, artist, platformFeePercentage]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Your Payouts</CardTitle>
                <CardDescription>
                    Track your earnings, see pending payments, and view your payout history. Payouts are processed by admin on a weekly basis for all completed bookings.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <Tabs defaultValue="pending">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="pending">Pending Payouts</TabsTrigger>
                        <TabsTrigger value="history">Payout History</TabsTrigger>
                    </TabsList>
                    <TabsContent value="pending" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Pending Payouts</CardTitle>
                                <CardDescription>These are your completed bookings awaiting payout from the admin.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {payouts.length > 0 ? (
                                    <>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Customer</TableHead>
                                                    <TableHead>Service Date</TableHead>
                                                    <TableHead>Gross Amount</TableHead>
                                                    <TableHead>Payment Method</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {payouts.map(booking => (
                                                    <TableRow key={booking.id}>
                                                        <TableCell>{booking.customerName}</TableCell>
                                                        <TableCell>{getSafeDate(booking.eventDate).toLocaleDateString()}</TableCell>
                                                        <TableCell>₹{booking.amount.toLocaleString()}</TableCell>
                                                        <TableCell><Badge variant={booking.paymentMethod === 'online' ? 'default' : 'secondary'}>{booking.paymentMethod === 'online' ? 'Paid Online' : 'Pay at Venue'}</Badge></TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                        <div className="mt-4 text-right font-bold text-lg text-primary">
                                            Total Pending Payout (from Online Payments): ₹{pendingAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                        </div>
                                         <Alert variant="default" className="mt-4">
                                            <Terminal className="h-4 w-4" />
                                            <AlertTitle>How Payouts Work</AlertTitle>
                                            <AlertDescription>
                                               Your "Pending Payout" amount is calculated based on bookings paid online. For "Pay at Venue" bookings, you collect cash directly from the customer, and the platform's commission will be automatically deducted from your total payout by the admin.
                                            </AlertDescription>
                                        </Alert>
                                    </>
                                ) : (
                                    <Alert>
                                        <Terminal className="h-4 w-4" />
                                        <AlertTitle>All Clear!</AlertTitle>
                                        <AlertDescription>
                                            You have no pending payouts. Complete more bookings to see them here.
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="history" className="mt-4">
                       <Card>
                            <CardHeader>
                                <CardTitle>Payout History</CardTitle>
                                <CardDescription>A record of all payouts you have received from the platform.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                 {payoutHistory.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Payment Date</TableHead>
                                                <TableHead>Total Bookings</TableHead>
                                                <TableHead>Net Amount Paid</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {payoutHistory.map(payout => (
                                                <TableRow key={payout.id}>
                                                    <TableCell>{new Date(payout.paymentDate).toLocaleDateString()}</TableCell>
                                                    <TableCell>{payout.totalBookings}</TableCell>
                                                    <TableCell>₹{payout.netPayout.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                                                    <TableCell><Badge>Paid</Badge></TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                 ) : (
                                     <Alert>
                                        <Terminal className="h-4 w-4" />
                                        <AlertTitle>No History</AlertTitle>
                                        <AlertDescription>
                                            You have not received any payouts yet.
                                        </AlertDescription>
                                    </Alert>
                                 )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
