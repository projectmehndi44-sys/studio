
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Shield, ArrowLeft, IndianRupee, MoreHorizontal } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import type { Booking, Artist, Payout, PayoutHistory } from '@/types';
import { artists as initialArtists } from '@/lib/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';


const allBookings: Booking[] = [
    { id: 'book_01', artistIds: ['1'], customerName: 'Priya Patel', customerContact: '9876543210', serviceAddress: '123, Rose Villa, Bandra West, Mumbai', date: new Date('2024-07-20'), service: 'Bridal Mehndi', amount: 5000, status: 'Completed', paidOut: false },
    { id: 'book_02', artistIds: ['2'], customerName: 'Anjali Sharma', customerContact: '9876543211', serviceAddress: '456, Sunshine Apts, Saket, New Delhi', date: new Date('2024-07-25'), service: 'Party Makeup', amount: 3000, status: 'Completed', paidOut: false },
    { id: 'book_03', artistIds: ['3'], customerName: 'Sneha Reddy', customerContact: '9876543212', serviceAddress: '789, Tech Park, Koramangala, Bangalore', date: new Date('2024-08-05'), service: 'Mehndi & Makeup', amount: 8000, status: 'Pending Approval', paidOut: false },
    { id: 'book_04', artistIds: ['1'], customerName: 'Meera Iyer', customerContact: '9876543213', serviceAddress: '321, Lakeview, Powai, Mumbai', date: new Date('2024-08-10'), service: 'Engagement Makeup', amount: 4500, status: 'Confirmed', paidOut: false },
    { id: 'book_05', artistIds: [], customerName: 'Rohan Gupta', customerContact: '9876543214', serviceAddress: '654, MG Road, Pune', date: new Date('2024-08-12'), service: 'Mehndi Package', amount: 1800, status: 'Needs Assignment', paidOut: false },
    { id: 'book_06', artistIds: ['4'], customerName: 'Kavita Singh', customerContact: '9876543215', serviceAddress: '987, Cyber City, Gurgaon', date: new Date('2024-08-15'), service: 'Minimalist Mehndi', amount: 2200, status: 'Completed', paidOut: false },
    { id: 'book_07', artistIds: ['5'], customerName: 'Divya Kumar', customerContact: '9876543216', serviceAddress: '111, Jubilee Hills, Hyderabad', date: new Date('2024-07-28'), service: 'Bridal Makeup', amount: 9000, status: 'Completed', paidOut: true },
];


export default function PayoutManagementPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [artists] = React.useState<Artist[]>(initialArtists);
    const [bookings, setBookings] = React.useState<Booking[]>([]);
    const [payouts, setPayouts] = React.useState<Payout[]>([]);
    const [payoutHistory, setPayoutHistory] = React.useState<PayoutHistory[]>([]);


    const calculatePayouts = React.useCallback(() => {
        const payoutMap: Record<string, Payout> = {};

        // Only consider completed and not-yet-paid-out bookings for payout calculation
        const bookingsToPay = bookings.filter(b => b.status === 'Completed' && !b.paidOut);

        bookingsToPay.forEach(booking => {
            booking.artistIds.forEach(artistId => {
                if (!artistId) return;

                if (!payoutMap[artistId]) {
                    const artist = artists.find(a => a.id === artistId);
                    payoutMap[artistId] = {
                        artistId: artistId,
                        artistName: artist?.name || 'Unknown Artist',
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

        // Calculate fees and net payout
        Object.values(payoutMap).forEach(payout => {
            payout.platformFees = payout.grossRevenue * 0.10;
            payout.gst = payout.grossRevenue * 0.18;
            payout.netPayout = payout.grossRevenue - payout.platformFees - payout.gst;
        });

        setPayouts(Object.values(payoutMap));

    }, [bookings, artists]);

     React.useEffect(() => {
        const isAdminAuthenticated = localStorage.getItem('isAdminAuthenticated');
        if (isAdminAuthenticated !== 'true') {
            router.push('/admin/login');
        }

        const storedBookings = localStorage.getItem('bookings');
        const currentBookings = storedBookings ? JSON.parse(storedBookings).map((b: any) => ({...b, date: new Date(b.date)})) : allBookings;
        setBookings(currentBookings);
        
        const storedPayoutHistory = localStorage.getItem('payoutHistory');
        setPayoutHistory(storedPayoutHistory ? JSON.parse(storedPayoutHistory) : []);
        
    }, [router]);

    React.useEffect(() => {
        calculatePayouts();
    }, [bookings, calculatePayouts]);
    
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

        toast({
            title: "Payout Marked as Paid",
            description: `Payment of ₹${payout.netPayout.toLocaleString()} to ${payout.artistName} has been recorded.`
        });
    }

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6 justify-between">
                <h1 className="flex items-center gap-2 text-xl font-bold text-primary">
                    <Shield className="w-6 h-6" />
                    Admin Portal
                </h1>
                <Link href="/admin/settings">
                     <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4"/> Back to Settings</Button>
                </Link>
            </header>
            <main className="flex-1 p-4 sm:px-6 sm:py-0 md:gap-8">
                <Card className="max-w-7xl mx-auto my-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <IndianRupee className="w-6 h-6 text-primary"/> Artist Payout Management
                        </CardTitle>
                        <CardDescription>
                            Calculate and manage payouts for artists based on their completed bookings.
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
                                                <TableHead>Platform Fees (10%)</TableHead>
                                                <TableHead>GST (18%)</TableHead>
                                                <TableHead className="font-bold text-primary">Net Payout</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {payouts.map(payout => (
                                                <TableRow key={payout.artistId}>
                                                    <TableCell className="font-medium">{payout.artistName}</TableCell>
                                                    <TableCell>{payout.totalBookings}</TableCell>
                                                    <TableCell>₹{payout.grossRevenue.toLocaleString()}</TableCell>
                                                    <TableCell>₹{payout.platformFees.toLocaleString()}</TableCell>
                                                    <TableCell>₹{payout.gst.toLocaleString()}</TableCell>
                                                    <TableCell className="font-bold text-green-600">₹{payout.netPayout.toLocaleString()}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button onClick={() => handleMarkAsPaid(payout)}>Mark as Paid</Button>
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
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {payoutHistory.map(history => (
                                                 <TableRow key={history.id}>
                                                    <TableCell>{new Date(history.paymentDate).toLocaleString()}</TableCell>
                                                    <TableCell className="font-medium">{history.artistName}</TableCell>
                                                    <TableCell>{history.totalBookings}</TableCell>
                                                    <TableCell>₹{history.netPayout.toLocaleString()}</TableCell>
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
            </main>
        </div>
        </>
    );
}
