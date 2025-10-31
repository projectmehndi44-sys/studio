'use client';

import * as React from 'react';
import { useArtistPortal } from '../layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IndianRupee, Download, MoreHorizontal, FileText } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { listenToCollection } from '@/lib/services';
import type { PayoutHistory } from '@/lib/types';
import { Tabs, TabsContent, TabsList } from '@/components/ui/tabs';
import { exportPayoutToPdf, generateGstInvoiceForPlatformFee } from '@/lib/export';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';


export default function ArtistPayoutsPage() {
    const { artist } = useArtistPortal();
    const [payoutHistory, setPayoutHistory] = React.useState<PayoutHistory[]>([]);

    React.useEffect(() => {
        if (!artist) return;
        const unsub = listenToCollection<PayoutHistory>('payoutHistory', (history) => {
            setPayoutHistory(history.filter(h => h.artistId === artist.id));
        });
        return () => unsub();
    }, [artist]);
    
    if (!artist) {
        return <div>Loading...</div>
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><IndianRupee className="w-6 h-6 text-primary"/>Payout History</CardTitle>
                    <CardDescription>A record of all payouts you have received from the platform.</CardDescription>
                </CardHeader>
                <CardContent>
                     {payoutHistory.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Payment Date</TableHead>
                                    <TableHead>Total Bookings</TableHead>
                                    <TableHead>Payout (from Online)</TableHead>
                                    <TableHead>Commission (from Offline)</TableHead>
                                    <TableHead>Net Amount Paid</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payoutHistory.map(history => (
                                    <TableRow key={history.id}>
                                        <TableCell>{new Date(history.paymentDate).toLocaleDateString()}</TableCell>
                                        <TableCell>{history.totalBookings}</TableCell>
                                        <TableCell>₹{history.payoutDue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                                        <TableCell>- ₹{history.commissionOwed.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                                        <TableCell className="font-bold">₹{history.netPayout.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
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
                                You have not received any payouts yet. Completed jobs will appear here after the admin processes them.
                            </AlertDescription>
                        </Alert>
                     )}
                </CardContent>
            </Card>
        </div>
    );
}
