'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Download, FileSpreadsheet, Calendar as CalendarIcon, ListTree } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import type { Booking, Transaction, PayoutHistory } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO, isValid } from 'date-fns';
import { exportTransactionsToExcel, exportTransactionsToPdf } from '@/lib/export';
import { fetchCompletedBookings, fetchPayoutHistory } from '@/lib/services';
import { Timestamp } from 'firebase/firestore';


function getSafeDate(date: any): Date {
    if (!date) return new Date();
    if (date instanceof Date && isValid(date)) return date;
    if (date instanceof Timestamp) return date.toDate();
    if (typeof date === 'string') {
        const parsed = parseISO(date);
        if (isValid(parsed)) return parsed;
    }
    if (typeof date === 'number') { // Handle seconds from epoch if that's what function returns
        return new Date(date * 1000);
    }
    // Handle the object format from Firebase Functions
    if (typeof date === 'object' && date.hasOwnProperty('_seconds')) {
        return new Date(date._seconds * 1000);
    }
    return new Date();
}

export default function TransactionsPage() {
    const { toast } = useToast();
    const [transactions, setTransactions] = React.useState<Transaction[]>([]);
    const [filteredTransactions, setFilteredTransactions] = React.useState<Transaction[]>([]);
    const [dateRange, setDateRange] = React.useState<{from: Date | undefined, to: Date | undefined}>({ from: undefined, to: undefined });
    const [isLoading, setIsLoading] = React.useState(true);

    const processTransactions = (bookings: Booking[], payouts: PayoutHistory[]) => {
        let allTransactions: Transaction[] = [];

        bookings.forEach(b => {
            allTransactions.push({
                id: `rev-${b.id}`,
                date: getSafeDate(b.eventDate),
                type: 'Revenue',
                description: `Booking #${b.id.substring(0,7)} for ${b.items.map(i => i.servicePackage.name).join(', ')}`,
                amount: b.amount,
                relatedId: b.id,
            });
        });

        payouts.forEach(p => {
            allTransactions.push({
                id: `payout-${p.id}`,
                date: getSafeDate(p.paymentDate),
                type: 'Payout',
                description: `Payout to ${p.artistName}`,
                amount: -p.netPayout,
                relatedId: p.id,
            });
        });
        
        allTransactions.sort((a,b) => getSafeDate(b.date).getTime() - getSafeDate(a.date).getTime());
        setTransactions(allTransactions);
        setFilteredTransactions(allTransactions);
    };

    React.useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const [bookingsData, payoutsData] = await Promise.all([
                    fetchCompletedBookings(),
                    fetchPayoutHistory(),
                ]);
                processTransactions(bookingsData, payoutsData);
            } catch (error) {
                console.error("Failed to fetch transaction data:", error);
                toast({
                    title: "Error",
                    description: "Could not load transaction data.",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [toast]);

    const handleTransactionFilter = (filterType: 'all' | 'month' | 'year' | 'custom') => {
        const now = new Date();
        let filtered = transactions;

        if (filterType === 'month') {
            const start = startOfMonth(now);
            const end = endOfMonth(now);
            filtered = transactions.filter(t => getSafeDate(t.date) >= start && getSafeDate(t.date) <= end);
        } else if (filterType === 'year') {
            const start = startOfYear(now);
            const end = endOfYear(now);
            filtered = transactions.filter(t => getSafeDate(t.date) >= start && getSafeDate(t.date) <= end);
        } else if (filterType === 'custom' && dateRange.from && dateRange.to) {
             filtered = transactions.filter(t => getSafeDate(t.date) >= dateRange.from! && getSafeDate(t.date) <= dateRange.to!);
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
                                            const filtered = transactions.filter(t => getSafeDate(t.date) >= range.from! && getSafeDate(t.date) <= range.to!);
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
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center">Loading transactions...</TableCell>
                                </TableRow>
                            ) : filteredTransactions.length > 0 ? filteredTransactions.map(t => (
                                <TableRow key={t.id}>
                                    <TableCell>{getSafeDate(t.date).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Badge variant={t.type === 'Revenue' ? 'default' : 'secondary'}>{t.type}</Badge>
                                    </TableCell>
                                    <TableCell>{t.description}</TableCell>
                                    <TableCell className={`text-right font-mono ${t.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {t.amount > 0 ? `+₹${t.amount.toLocaleString()}` : `-₹${Math.abs(t.amount).toLocaleString()}`}
                                    </TableCell>
                                </TableRow>
                            )) : (
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
