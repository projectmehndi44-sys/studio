

'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import type { Booking, PayoutHistory } from '@/types';
import { useArtistPortal } from '../layout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


export default function ArtistPayoutsPage() {
    const { artist, artistBookings } = useArtistPortal();
    const [payouts, setPayouts] = React.useState<Booking[]>([]);
    const [payoutHistory, setPayoutHistory] = React.useState<PayoutHistory[]>([]);
    const [pendingAmount, setPendingAmount] = React.useState(0);
    const platformFeePercentage = parseFloat(localStorage.getItem('platformFeePercentage') || '10') / 100;

    const calculatePayouts = React.useCallback(() => {
        if (!artist) return;
        // Bookings that are completed but not yet paid out
        const pendingPayouts = artistBookings.filter(b => b.status === 'Completed' && !b.paidOut);
        setPayouts(pendingPayouts);
        
        const totalPendingGross = pendingPayouts.reduce((sum, b) => sum + b.amount, 0);
        
        const taxableAmount = totalPendingGross / 1.18;
        const platformFee = taxableAmount * platformFeePercentage;
        setPendingAmount(taxableAmount - platformFee);


        // Fetch this artist's payout history from localStorage
        const allPayoutHistory: PayoutHistory[] = JSON.parse(localStorage.getItem('payoutHistory') || '[]');
        const artistHistory = allPayoutHistory.filter(p => p.artistId === artist?.id);
        setPayoutHistory(artistHistory.sort((a,b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()));

    }, [artistBookings, artist, platformFeePercentage]);

    React.useEffect(() => {
        calculatePayouts();
        window.addEventListener('storage', calculatePayouts);
        return () => window.removeEventListener('storage', calculatePayouts);
    }, [calculatePayouts]);

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
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {payouts.map(booking => (
                                                    <TableRow key={booking.id}>
                                                        <TableCell>{booking.customerName}</TableCell>
                                                        <TableCell>{new Date(booking.date).toLocaleDateString()}</TableCell>
                                                        <TableCell>₹{booking.amount.toLocaleString()}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                        <div className="mt-4 text-right font-bold text-lg text-primary">
                                            Total Pending Payout: ₹{pendingAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                        </div>
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
