

'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { IndianRupee, MoreHorizontal, Download, FileText, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Booking, Artist, Payout, PayoutHistory } from '@/lib/types';
import { listenToCollection, updateBooking, getFinancialSettings, getArtists } from '@/lib/services';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { exportPayoutToPdf, generateGstInvoiceForPlatformFee } from '@/lib/export';
import { useAdminAuth } from '@/firebase/auth/use-admin-auth';
import { addDoc, collection } from 'firebase/firestore';
import { getDb } from '@/lib/services';
import { callFirebaseFunction } from '@/lib/firebase';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


export default function PayoutManagementPage() {
    const { toast } = useToast();
    const { hasPermission } = useAdminAuth();
    const [artists, setArtists] = React.useState<Artist[]>([]);
    const [bookings, setBookings] = React.useState<Booking[]>([]);
    const [payouts, setPayouts] = React.useState<Payout[]>([]);
    const [payoutHistory, setPayoutHistory] = React.useState<PayoutHistory[]>([]);
    const [platformFeePercentage, setPlatformFeePercentage] = React.useState(0.1);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);


    React.useEffect(() => {
        getFinancialSettings().then(settings => {
            setPlatformFeePercentage(settings.platformFeePercentage / 100);
        });

        getArtists().then(setArtists);

        const unsubscribeBookings = listenToCollection<Booking>('bookings', setBookings);
        const unsubscribeHistory = listenToCollection<PayoutHistory>('payoutHistory', setPayoutHistory);

        return () => {
            unsubscribeBookings();
            unsubscribeHistory();
        };
    }, []);

    const calculatePayouts = React.useCallback(() => {
        if (artists.length === 0 || bookings.length === 0) {
            setPayouts([]);
            return;
        };

        const payoutMap: Record<string, Payout> = {};

        const bookingsToPay = bookings.filter(b => b.status === 'Completed' && !b.paidOut);

        bookingsToPay.forEach(booking => {
            if (!booking.artistIds) return;
            booking.artistIds.forEach(artistId => {
                if (!artistId) return;

                const artist = artists.find(a => a.id === artistId);
                if (!artist) return;

                if (!payoutMap[artistId]) {
                    payoutMap[artistId] = {
                        artistId: artistId,
                        artistName: artist.name,
                        totalBookings: 0,
                        grossRevenue: 0,
                        platformFees: 0,
                        gst: 0,
                        netPayout: 0,
                        bookingIds: [],
                        commissionOwed: 0,
                        payoutDue: 0,
                    };
                }

                const payout = payoutMap[artistId];
                payout.totalBookings += 1;
                payout.bookingIds.push(booking.id);
                
                const bookingAmount = booking.amount / (booking.artistIds.length); 
                
                if (booking.paymentMethod === 'offline') {
                    const commissionableValue = bookingAmount / 1.18; 
                    payout.commissionOwed += commissionableValue * platformFeePercentage;
                } else {
                    const taxableAmount = bookingAmount / 1.18;
                    const platformFee = taxableAmount * platformFeePercentage;
                    payout.payoutDue += taxableAmount - platformFee;
                    payout.grossRevenue += bookingAmount;
                }
            });
        });

        Object.values(payoutMap).forEach(payout => {
           payout.netPayout = payout.payoutDue - payout.commissionOwed;
           payout.platformFees = (payout.grossRevenue / 1.18) * platformFeePercentage;
           payout.gst = payout.grossRevenue - (payout.grossRevenue / 1.18);
        });

        setPayouts(Object.values(payoutMap));

    }, [bookings, artists, platformFeePercentage]);

    React.useEffect(() => {
        calculatePayouts();
    }, [calculatePayouts]);
    
    const handleMarkAsPaid = async (payout: Payout) => {
        const db = getDb();
        const newHistoryRecord: Omit<PayoutHistory, 'id'> = {
            paymentDate: new Date().toISOString(),
            ...payout
        };

        const bookingUpdatePromises = payout.bookingIds.map(bookingId => 
            updateBooking(bookingId, { paidOut: true })
        );
        await Promise.all(bookingUpdatePromises);
        
        await addDoc(collection(db, "payoutHistory"), newHistoryRecord);
        
        toast({
            title: "Payout Marked as Paid",
            description: `Payment of ₹${payout.netPayout.toLocaleString(undefined, {maximumFractionDigits: 2})} to ${payout.artistName} has been recorded.`
        });
    }

     const handleDeleteAllPayouts = async () => {
        try {
            await callFirebaseFunction('deleteAllPayoutHistory', {});
            toast({
                title: "Payout History Cleared",
                description: "All payout history has been permanently deleted.",
                variant: "destructive"
            });
        } catch (error: any) {
            toast({
                title: "Deletion Failed",
                description: error.message || "You do not have permission to perform this action.",
                variant: "destructive"
            });
        } finally {
            setIsDeleteAlertOpen(false);
        }
    };

    const PayoutRow = ({ payout }: { payout: Payout | PayoutHistory }) => (
         <TableRow>
            <TableCell className="font-medium">{'paymentDate' in payout ? new Date(payout.paymentDate).toLocaleDateString() : payout.artistName}</TableCell>
            <TableCell>{'paymentDate' in payout ? payout.artistName : payout.totalBookings}</TableCell>
            <TableCell>₹{payout.payoutDue.toLocaleString(undefined, {maximumFractionDigits: 2})}</TableCell>
            <TableCell className="text-red-600">- ₹{payout.commissionOwed.toLocaleString(undefined, {maximumFractionDigits: 2})}</TableCell>
            <TableCell className="font-bold text-green-600">₹{payout.netPayout.toLocaleString(undefined, {maximumFractionDigits: 2})}</TableCell>
            <TableCell className="text-right space-x-2">
                {!('paymentDate' in payout) && (
                    <Button onClick={() => handleMarkAsPaid(payout as Payout)} disabled={!hasPermission('payouts', 'edit')}>Mark as Paid</Button>
                )}
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
    );

    return (
        <>
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Artist Payouts</h1>
                 {hasPermission('payouts', 'edit') && (
                    <Button variant="destructive" onClick={() => setIsDeleteAlertOpen(true)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear Payout History
                    </Button>
                )}
            </div>
             <Card className="flex-1">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <IndianRupee className="w-6 h-6 text-primary"/> Payout Management
                    </CardTitle>
                    <CardDescription>
                        Calculate and manage artist payouts. The system automatically handles commission from both online and offline (Pay at Venue) bookings.
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
                                            <TableHead>Payout Due (from Online)</TableHead>
                                            <TableHead>Commission Owed (from Offline)</TableHead>
                                            <TableHead className="font-bold text-primary">Net Payout</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {payouts.map(payout => (
                                           <PayoutRow key={payout.artistId} payout={payout}/>
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
                                                        <TableHead>Artist</TableHead>
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
                                                            <TableCell className="font-medium">{history.artistName}</TableCell>
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
             <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will permanently delete all payout history records from the database. This cannot be undone. Are you sure you want to proceed?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAllPayouts} className="bg-destructive hover:bg-destructive/80">
                            Yes, Delete All Payout History
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
