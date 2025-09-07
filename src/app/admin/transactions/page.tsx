
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Download, FileSpreadsheet, Calendar as CalendarIcon, ListTree } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import type { Booking, Transaction, PayoutHistory } from '@/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { exportTransactionsToExcel, exportTransactionsToPdf } from '@/lib/export';

const allBookings: Booking[] = [
    { id: 'book_01', customerId: 'cust_101', artistIds: ['1'], customerName: 'Priya Patel', customerContact: "9876543210", eventType: 'Wedding', serviceAddress: "address", date: new Date('2024-07-20'), service: 'Bridal Mehndi', amount: 5000, status: 'Completed', paidOut: true, eventDate: new Date('2024-07-22'), state: 'Maharashtra', district: 'Mumbai', location: 'Bandra West' },
    { id: 'book_02', customerId: 'cust_102', artistIds: ['2'], customerName: 'Anjali Sharma', customerContact: "9876543211", eventType: 'Party', serviceAddress: "address", date: new Date('2024-07-25'), service: 'Party Makeup', amount: 3000, status: 'Completed', paidOut: false, eventDate: new Date('2024-07-25'), state: 'Delhi', district: 'South Delhi', location: 'Saket' },
    { id: 'book_03', customerId: 'cust_103', artistIds: ['3'], customerName: 'Sneha Reddy', customerContact: "9876543212", eventType: 'Wedding', serviceAddress: "address", date: new Date('2024-08-05'), service: 'Mehndi & Makeup', amount: 8000, status: 'Pending Approval', paidOut: false, eventDate: new Date('2024-08-07'), state: 'Karnataka', district: 'Bengaluru Urban', location: 'Koramangala' },
];

export default function TransactionsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [transactions, setTransactions] = React.useState<Transaction[]>([]);
    const [filteredTransactions, setFilteredTransactions] = React.useState<Transaction[]>([]);
    const [dateRange, setDateRange] = React.useState<{from: Date | undefined, to: Date | undefined}>({ from: undefined, to: undefined });

    React.useEffect(() => {
        const isAdminAuthenticated = localStorage.getItem('isAdminAuthenticated');
        if (isAdminAuthenticated !== 'true') {
            router.push('/admin/login');
        }

        const storedBookings = localStorage.getItem('bookings');
        const currentBookings: Booking[] = storedBookings ? JSON.parse(storedBookings).map((b: any) => ({...b, date: new Date(b.date)})) : allBookings;

        const storedPayoutHistory = localStorage.getItem('payoutHistory');
        const currentPayoutHistory: PayoutHistory[] = storedPayoutHistory ? JSON.parse(storedPayoutHistory).map((p:any) => ({...p, paymentDate: new Date(p.paymentDate)})) : [];

        const allTransactions: Transaction[] = [];

        // 1. Revenue from completed bookings
        currentBookings.filter(b => b.status === 'Completed').forEach(b => {
            allTransactions.push({
                id: `rev-${b.id}`,
                date: new Date(b.date),
                type: 'Revenue',
                description: `Booking #${b.id} for ${b.service}`,
                amount: b.amount,
                relatedId: b.id,
            });
        });

        // 2. Payouts to artists
        currentPayoutHistory.forEach(p => {
            allTransactions.push({
                id: `payout-${p.id}`,
                date: new Date(p.paymentDate),
                type: 'Payout',
                description: `Payout to ${p.artistName}`,
                amount: -p.netPayout,
                relatedId: p.id,
            });
        });

        allTransactions.sort((a,b) => b.date.getTime() - a.date.getTime());
        setTransactions(allTransactions);
        setFilteredTransactions(allTransactions);

    }, [router]);

    const handleTransactionFilter = (filterType: 'all' | 'month' | 'year' | 'custom') => {
        const now = new Date();
        let filtered = transactions;

        if (filterType === 'month') {
            const start = startOfMonth(now);
            const end = endOfMonth(now);
            filtered = transactions.filter(t => t.date >= start && t.date <= end);
        } else if (filterType === 'year') {
            const start = startOfYear(now);
            const end = endOfYear(now);
            filtered = transactions.filter(t => t.date >= start && t.date <= end);
        } else if (filterType === 'custom' && dateRange.from && dateRange.to) {
             filtered = transactions.filter(t => t.date >= dateRange.from! && t.date <= dateRange.to!);
        }

        setFilteredTransactions(filtered);
    }
    
    const handleDownloadTransactions = (format: 'pdf' | 'excel') => {
        if(filteredTransactions.length === 0){
             toast({
                title: "No transactions to export",
                variant: "destructive"
            });
            return;
        }

        if(format === 'pdf') {
            exportTransactionsToPdf(filteredTransactions);
        } else {
            exportTransactionsToExcel(filteredTransactions);
        }

        toast({
            title: "Download Started",
            description: `Downloading ${filteredTransactions.length} transaction(s) as a ${format.toUpperCase()} file.`,
        });
    }

    return (
        <>
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Transactions</h1>
            </div>
             <Card className="flex-1">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ListTree className="w-6 h-6 text-primary"/> Transaction History
                    </CardTitle>
                    <CardDescription>
                        A log of all financial activities on the platform.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap items-center gap-4 mb-4 p-4 border rounded-lg bg-muted/50">
                        <h3 className="font-semibold text-sm mr-4">Filter by:</h3>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleTransactionFilter('all')}>All</Button>
                            <Button variant="outline" size="sm" onClick={() => handleTransactionFilter('month')}>This Month</Button>
                            <Button variant="outline" size="sm" onClick={() => handleTransactionFilter('year')}>This Year</Button>
                        </div>
                            <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="w-[280px] justify-start text-left font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange.from ? (
                                        dateRange.to ? (
                                            <>
                                                {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                                            </>
                                        ) : (
                                            format(dateRange.from, "LLL dd, y")
                                        )
                                    ) : (
                                        <span>Pick a date range</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={dateRange.from}
                                    selected={dateRange}
                                    onSelect={(range) => { 
                                        setDateRange(range || {from: undefined, to: undefined}); 
                                        // Trigger filter only after selection
                                        if (range?.from && range.to) {
                                            const filtered = transactions.filter(t => t.date >= range.from! && t.date <= range.to!);
                                            setFilteredTransactions(filtered);
                                        }
                                    }}
                                    numberOfMonths={2}
                                />
                            </PopoverContent>
                        </Popover>
                        <div className="flex items-center gap-2 ml-auto">
                            <Button variant="outline" size="sm" onClick={() => handleDownloadTransactions('pdf')}>
                                <Download className="mr-2 h-4 w-4" /> PDF
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDownloadTransactions('excel')}>
                                    <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
                            </Button>
                        </div>
                    </div>
                        <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTransactions.map(t => (
                                <TableRow key={t.id}>
                                    <TableCell>{t.date.toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Badge variant={t.type === 'Revenue' ? 'default' : 'secondary'}>{t.type}</Badge>
                                    </TableCell>
                                    <TableCell>{t.description}</TableCell>
                                    <TableCell className={`text-right font-mono ${t.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {t.amount > 0 ? `+₹${t.amount.toLocaleString()}` : `-₹${Math.abs(t.amount).toLocaleString()}`}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredTransactions.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground">No transactions found for the selected period.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    );
}

