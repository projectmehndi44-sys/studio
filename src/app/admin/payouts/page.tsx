

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { IndianRupee, MoreHorizontal, Download, FileText } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Booking, Artist, Payout, PayoutHistory } from '@/types';
import { artists as initialArtists, allBookings as initialBookings } from '@/lib/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { exportPayoutToPdf, generateGstInvoiceForPlatformFee } from '@/lib/export';


export default function PayoutManagementPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [artists, setArtists] = React.useState<Artist[]>(initialArtists);
    const [bookings, setBookings] = React.useState<Booking[]>([]);
    const [payouts, setPayouts] = React.useState<Payout[]>([]);
    const [payoutHistory, setPayoutHistory] = React.useState<PayoutHistory[]>([]);


    const calculatePayouts = React.useCallback(() => {
        const platformFeePercentage = parseFloat(localStorage.getItem('platformFeePercentage') || '10') / 100;
        const payoutMap: Record<string, Payout> = {};

        // Only consider completed and not-yet-paid-out bookings for payout calculation
        const bookingsToPay = bookings.filter(b => b.status === 'Completed' && !b.paidOut);

        bookingsToPay.forEach(booking => {
            booking.artistIds.forEach(artistId => {
                if (!artistId) return;

                const artist = artists.find(a => a.id === artistId);
                if (!artist) return; // Skip if artist not found

                if (!payoutMap[artistId]) {
                    payoutMap[artistId] = {
                        artistId: artistId,
                        artistName: artist.name,
                        totalBookings: 0,
                        grossRevenue: 0,
                        platformFees: 0,
                        gst: 0,
                        netPayout: 0,
                        bookingIds: []
                    };
                }

                const payout = payoutMap[artistId];
                payout.totalBookings += 1;
                payout.grossRevenue += booking.amount;
                payout.bookingIds.push(booking.id);
            });
        });

        // Calculate fees and net payout based on new logic
        Object.values(payoutMap).forEach(payout => {
            const taxableAmount = payout.grossRevenue / 1.18;
            payout.gst = payout.grossRevenue - taxableAmount;
            payout.platformFees = taxableAmount * platformFeePercentage;
            payout.netPayout = taxableAmount - payout.platformFees;
        });

        setPayouts(Object.values(payoutMap));

    }, [bookings, artists]);

     const fetchData = React.useCallback(() => {
        const storedBookings = localStorage.getItem('bookings');
        const currentBookings = storedBookings ? JSON.parse(storedBookings).map((b: any) => ({...b, date: new Date(b.date)})) : initialBookings;
        setBookings(currentBookings);
        
        const storedPayoutHistory = localStorage.getItem('payoutHistory');
        setPayoutHistory(storedPayoutHistory ? JSON.parse(storedPayoutHistory) : []);
        
        const storedArtists = localStorage.getItem('artists');
        setArtists(storedArtists ? JSON.parse(storedArtists) : initialArtists);
    }, []);

    React.useEffect(() => {
        const isAdminAuthenticated = localStorage.getItem('isAdminAuthenticated');
        if (isAdminAuthenticated !== 'true') {
            router.push('/admin/login');
        }
        fetchData();
        window.addEventListener('storage', fetchData);

        return () => {
            window.removeEventListener('storage', fetchData);
        }
    }, [router, fetchData]);

    React.useEffect(() => {
        calculatePayouts();
    }, [bookings, artists, calculatePayouts]);
    
    const handleMarkAsPaid = (payout: Payout) => {
        // Create a new history record
        const newHistoryRecord: PayoutHistory = {
            id: `payout_${Date.now()}`,
            paymentDate: new Date().toISOString(),
            ...payout
        };

        // Update bookings to mark them as paidOut
        const updatedBookings = bookings.map(b => 
            payout.bookingIds.includes(b.id) ? { ...b, paidOut: true } : b
        );

        setBookings(updatedBookings);
        localStorage.setItem('bookings', JSON.stringify(updatedBookings));

        const updatedHistory = [newHistoryRecord, ...payoutHistory];
        setPayoutHistory(updatedHistory);
        localStorage.setItem('payoutHistory', JSON.stringify(updatedHistory));
        
        window.dispatchEvent(new Event('storage'));

        toast({
            title: "Payout Marked as Paid",
            description: `Payment of ₹${payout.netPayout.toLocaleString(undefined, {maximumFractionDigits: 2})} to ${payout.artistName} has been recorded.`
        });
    }

    return (
        <>
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Artist Payouts</h1>
            </div>
             <Card className="flex-1">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <IndianRupee className="w-6 h-6 text-primary"/> Payout Management
                    </CardTitle>
                    <CardDescription>
                        Calculate and manage payouts for artists based on their completed bookings. Base prices are inclusive of 18% GST.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="payouts">
                        <TabsList>
                            <TabsTrigger value="payouts">Pending Payouts</TabsTrigger>
                            <TabsTrigger value="history">Payout History</TabsTrigger>
                        </TabsList>
                        <TabsContent value="payouts" className="mt-4">
                            {payouts.length > 0 ? (
                                    <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Artist</TableHead>
                                            <TableHead>Completed Bookings</TableHead>
                                            <TableHead>Gross Revenue</TableHead>
                                            <TableHead>Platform Fees</TableHead>
                                            <TableHead className="font-bold text-primary">Net Payout</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {payouts.map(payout => (
                                            <TableRow key={payout.artistId}>
                                                <TableCell className="font-medium">{payout.artistName}</TableCell>
                                                <TableCell>{payout.totalBookings}</TableCell>
                                                <TableCell>₹{payout.grossRevenue.toLocaleString(undefined, {maximumFractionDigits: 2})}</TableCell>
                                                <TableCell>- ₹{payout.platformFees.toLocaleString(undefined, {maximumFractionDigits: 2})}</TableCell>
                                                <TableCell className="font-bold text-green-600">₹{payout.netPayout.toLocaleString(undefined, {maximumFractionDigits: 2})}</TableCell>
                                                <TableCell className="text-right space-x-2">
                                                    <Button onClick={() => handleMarkAsPaid(payout)}>Mark as Paid</Button>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button aria-haspopup="true" size="icon" variant="ghost">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                                <span className="sr-only">Toggle menu</span>
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onSelect={() => exportPayoutToPdf(payout)}>
                                                                <Download className="mr-2 h-4 w-4" />
                                                                Download PDF
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onSelect={() => generateGstInvoiceForPlatformFee(payout)}>
                                                                <FileText className="mr-2 h-4 w-4" />
                                                                Generate Commission Invoice
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <Alert>
                                    <Terminal className="h-4 w-4" />
                                    <AlertTitle>All Clear!</AlertTitle>
                                    <AlertDescription>
                                        There are no pending payouts to be made at this time.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </TabsContent>
                            <TabsContent value="history" className="mt-4">
                                {payoutHistory.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Payment Date</TableHead>
                                            <TableHead>Artist</TableHead>
                                            <TableHead>Bookings Paid</TableHead>
                                            <TableHead>Net Amount Paid</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {payoutHistory.map(history => (
                                                <TableRow key={history.id}>
                                                <TableCell>{new Date(history.paymentDate).toLocaleString()}</TableCell>
                                                <TableCell className="font-medium">{history.artistName}</TableCell>
                                                <TableCell>{history.totalBookings}</TableCell>
                                                <TableCell>₹{history.netPayout.toLocaleString(undefined, {maximumFractionDigits: 2})}</TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button aria-haspopup="true" size="icon" variant="ghost">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                                <span className="sr-only">Toggle menu</span>
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onSelect={() => exportPayoutToPdf(history)}>
                                                                <Download className="mr-2 h-4 w-4" />
                                                                Download Payout PDF
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onSelect={() => generateGstInvoiceForPlatformFee(history)}>
                                                                <FileText className="mr-2 h-4 w-4" />
                                                                Generate Commission Invoice
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                                </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                ) : (
                                <Alert>
                                    <Terminal className="h-4 w-4" />
                                    <AlertTitle>No History</AlertTitle>
                                    <AlertDescription>
                                        No payouts have been recorded yet.
                                    </AlertDescription>
                                </Alert>
                                )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </>
    );
}
