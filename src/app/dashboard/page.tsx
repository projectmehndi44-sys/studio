"use client";

import { useMemo, useState } from 'react';
import { 
  TrendingUp, 
  ArrowLeft,
  PlusCircle,
  MinusCircle,
  History,
  ShoppingBag,
  Eye,
  Printer,
  FileDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, where, Timestamp } from 'firebase/firestore';
import { PurchaseRecord, CashTransaction } from '@/lib/types';
import { format, startOfToday, startOfMonth, startOfYesterday, subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type DateFilter = 'today' | 'yesterday' | 'month' | 'last7' | 'all';

export default function DashboardPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useUser();
  const [viewingSale, setViewingSale] = useState<PurchaseRecord | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');

  const getFilterDate = (filter: DateFilter) => {
    switch (filter) {
      case 'today': return startOfToday();
      case 'yesterday': return startOfYesterday();
      case 'month': return startOfMonth(new Date());
      case 'last7': return subDays(new Date(), 7);
      default: return null;
    }
  };

  const salesQuery = useMemoFirebase(() => {
    if (!user) return null;
    const filterDate = getFilterDate(dateFilter);
    if (filterDate) {
      return query(
        collection(db, 'purchases'), 
        where('timestamp', '>=', Timestamp.fromDate(filterDate)),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
    }
    return query(collection(db, 'purchases'), orderBy('timestamp', 'desc'), limit(100));
  }, [db, user, dateFilter]);

  const cashQuery = useMemoFirebase(() => {
    if (!user) return null;
    const filterDate = getFilterDate(dateFilter);
    if (filterDate) {
      return query(
        collection(db, 'cashTransactions'), 
        where('timestamp', '>=', Timestamp.fromDate(filterDate)),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
    }
    return query(collection(db, 'cashTransactions'), orderBy('timestamp', 'desc'), limit(50));
  }, [db, user, dateFilter]);

  const { data: salesData, isLoading: isSalesLoading } = useCollection<PurchaseRecord>(salesQuery);
  const { data: cashData, isLoading: isCashLoading } = useCollection<CashTransaction>(cashQuery);

  const sales = salesData ?? [];
  const cashFlows = cashData ?? [];

  const stats = useMemo(() => {
    const totalSales = sales.reduce((acc, sale) => acc + (sale.totalAmount || 0), 0);
    const totalIn = cashFlows.filter(c => c.type === 'IN').reduce((acc, c) => acc + c.amount, 0);
    const totalOut = cashFlows.filter(c => c.type === 'OUT').reduce((acc, c) => acc + c.amount, 0);
    
    return {
      sales: totalSales,
      cashInHand: totalSales + totalIn - totalOut,
      netCashFlow: totalIn - totalOut,
      transactions: sales.length + cashFlows.length
    };
  }, [sales, cashFlows]);

  const handlePrintAction = () => {
    window.print();
  };

  if (isSalesLoading || isCashLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center font-bold animate-pulse text-slate-400 text-sm uppercase tracking-widest">
          Syncing Ledger...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-body">
      {/* PRINT-ONLY RECEIPT */}
      <div className="hidden print-only p-8 bg-white text-slate-900 font-receipt">
        <div className="text-center space-y-1 border-b border-slate-900 pb-4 mb-4">
           <p className="text-[10px] font-bold tracking-[0.3em] text-slate-500">KRISHNA'S</p>
          <h2 className="text-3xl font-bold uppercase tracking-tight">Super 9+ Supermarket</h2>
          <p className="text-xs font-medium">Main Market, New Delhi • GSTIN: 07AABCU1234F1Z5</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div className="space-y-1">
            <p className="font-bold">Bill ID: #{viewingSale?.id?.slice(-8) || 'ARCHIVE'}</p>
            <p className="font-bold">Date: {viewingSale?.timestamp?.seconds ? format(new Date(viewingSale.timestamp.seconds * 1000), 'dd/MM/yyyy') : '--'}</p>
          </div>
          <div className="space-y-1 text-right">
            <p className="font-bold">Cust: {viewingSale?.customerId || 'Walk-in'}</p>
            <p className="font-bold">Mode: {viewingSale?.paymentMode || 'Cash'}</p>
          </div>
        </div>

        <table className="w-full text-xs border-collapse mb-6">
          <thead>
            <tr className="border-y border-slate-900">
              <th className="text-left py-2 font-bold uppercase">Item</th>
              <th className="text-center py-2 font-bold uppercase">Qty</th>
              <th className="text-right py-2 font-bold uppercase">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {viewingSale?.items.map((item, idx) => (
              <tr key={idx}>
                <td className="py-2">{item.name}</td>
                <td className="py-2 text-center">{item.quantity}</td>
                <td className="py-2 text-right">₹{item.price * item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="space-y-1 text-right border-t border-slate-900 pt-4">
          <div className="flex justify-between items-center pt-2">
            <span className="text-sm font-bold uppercase">Grand Total</span>
            <span className="text-2xl font-bold">₹{viewingSale?.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-xs font-bold">Thank you for shopping at Krishna's Super 9+!</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-8 print:hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-white shadow-sm hover:scale-105 active:scale-95 transition-all">
                <ArrowLeft className="h-5 w-5 text-secondary" />
              </Button>
            </Link>
            <div className="flex flex-col">
              <p className="text-[9px] font-bold text-secondary tracking-[0.2em] leading-none mb-1">KRISHNA'S</p>
              <h1 className="text-2xl font-bold text-primary tracking-tight uppercase leading-none">Super9<span className="text-secondary">+</span> Ledger</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border">
             {(['today', 'yesterday', 'month', 'all'] as const).map((filter) => (
               <Button
                 key={filter}
                 variant={dateFilter === filter ? 'default' : 'ghost'}
                 onClick={() => setDateFilter(filter)}
                 className={cn(
                   "h-9 px-4 rounded-lg font-bold uppercase text-[10px] tracking-wider transition-all",
                   dateFilter === filter ? "bg-secondary text-white shadow-sm" : "text-slate-400"
                 )}
               >
                 {filter}
               </Button>
             ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white border-none shadow-sm rounded-2xl overflow-hidden group">
            <div className="h-1.5 bg-primary w-full" />
            <CardContent className="pt-6 p-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Sales</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-900 tracking-tight">₹{stats.sales.toLocaleString()}</h3>
              <div className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-bold mt-4 uppercase">
                <TrendingUp className="h-3.5 w-3.5" /> Synced
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-none shadow-sm rounded-2xl overflow-hidden group">
             <div className="h-1.5 bg-secondary w-full" />
            <CardContent className="pt-6 p-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cash in Hand</p>
              <h3 className="text-2xl font-bold mt-1 text-secondary tracking-tight">₹{stats.cashInHand.toLocaleString()}</h3>
              <p className="text-[10px] font-medium text-slate-300 mt-4 uppercase">Adjusted Net</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-none shadow-sm rounded-2xl">
            <CardContent className="pt-6 p-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Register Flow</p>
              <h3 className={cn("text-2xl font-bold mt-1 tracking-tight", stats.netCashFlow >= 0 ? "text-emerald-500" : "text-destructive")}>
                {stats.netCashFlow >= 0 ? '+' : ''}₹{stats.netCashFlow.toLocaleString()}
              </h3>
              <p className="text-[10px] font-medium text-slate-300 mt-4 uppercase">Manual Adj.</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-none shadow-sm rounded-2xl">
            <CardContent className="pt-6 p-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Order Count</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-900 tracking-tight">{sales.length}</h3>
              <p className="text-[10px] font-medium text-slate-300 mt-4 uppercase">Transactions</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-white border-none shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="bg-primary/5 p-2.5 rounded-xl">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900 uppercase tracking-tight">Sale History</CardTitle>
                  <CardDescription className="font-bold text-slate-400 uppercase text-[9px] tracking-widest">Recent Transactions</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50">
                {sales.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 font-medium uppercase text-xs tracking-widest">
                    No sales recorded
                  </div>
                ) : (
                  sales.map((sale) => (
                    <div key={sale.id} className="p-5 hover:bg-slate-50 transition-all flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="bg-white border shadow-sm h-11 w-11 rounded-xl flex items-center justify-center font-bold text-slate-400 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all text-sm">
                          {sale.paymentMode?.[0] || '₹'}
                        </div>
                        <div>
                          <p className="font-bold text-base text-slate-900 tracking-tight">₹{sale.totalAmount.toLocaleString()}</p>
                          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">
                            {sale.timestamp?.seconds ? format(new Date(sale.timestamp.seconds * 1000), 'HH:mm • dd MMM') : 'Syncing...'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-bold text-[9px] rounded-lg uppercase h-7 px-2">
                          {sale.paymentMode}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setViewingSale(sale)}
                          className="h-9 w-9 rounded-lg hover:bg-primary/5 hover:text-primary transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-none shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="bg-secondary/5 p-2.5 rounded-xl">
                  <History className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900 uppercase tracking-tight">Manual Log</CardTitle>
                  <CardDescription className="font-bold text-slate-400 uppercase text-[9px] tracking-widest">Drawer Adjustments</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50">
                {cashFlows.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 font-medium uppercase text-xs tracking-widest">
                    No log recorded
                  </div>
                ) : (
                  cashFlows.map((cf) => (
                    <div key={cf.id} className="p-5 hover:bg-slate-50 transition-all flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "h-11 w-11 rounded-xl flex items-center justify-center border",
                          cf.type === 'IN' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-destructive/5 text-destructive border-destructive/10"
                        )}>
                          {cf.type === 'IN' ? <PlusCircle className="h-5 w-5" /> : <MinusCircle className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-base text-slate-900 tracking-tight">
                            {cf.type === 'IN' ? '+' : '-'}₹{cf.amount.toLocaleString()}
                          </p>
                          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">
                            {cf.reason}
                          </p>
                        </div>
                      </div>
                      <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                        {cf.timestamp?.seconds ? format(new Date(cf.timestamp.seconds * 1000), 'HH:mm') : 'Now'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* VIEW & PRINT DIALOG */}
      <Dialog open={!!viewingSale} onOpenChange={(open) => !open && setViewingSale(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl p-8 border-none shadow-2xl overflow-hidden print:hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
          <DialogHeader className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center">
              <ShoppingBag className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-center text-xl font-bold uppercase tracking-tight">Transaction View</DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="bg-slate-50 rounded-xl p-6 space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase text-slate-400 tracking-widest">
                <span>Items: {viewingSale?.items.length}</span>
                <span>{viewingSale?.paymentMode}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-3xl font-bold text-slate-900 tracking-tight">₹{viewingSale?.totalAmount.toLocaleString()}</span>
                <span className="text-[10px] font-medium text-slate-400 uppercase">
                  {viewingSale?.timestamp?.seconds ? format(new Date(viewingSale.timestamp.seconds * 1000), 'HH:mm • dd MMM') : ''}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <Button 
                variant="outline" 
                className="h-12 rounded-xl bg-slate-50 border-none font-bold uppercase text-[10px] gap-3 hover:bg-slate-100"
                onClick={handlePrintAction}
              >
                <Printer className="h-4 w-4 text-primary" /> Standard Print (A4)
              </Button>
              <Button 
                variant="outline" 
                className="h-12 rounded-xl bg-slate-50 border-none font-bold uppercase text-[10px] gap-3 hover:bg-slate-100"
                onClick={handlePrintAction}
              >
                <Printer className="h-4 w-4 text-secondary" /> Thermal Slip (BT/USB)
              </Button>
              <Button 
                variant="outline" 
                className="h-12 rounded-xl bg-slate-50 border-none font-bold uppercase text-[10px] gap-3 hover:bg-slate-100"
                onClick={handlePrintAction}
              >
                <FileDown className="h-4 w-4 text-slate-400" /> Save PDF Copy
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button 
              className="w-full h-12 rounded-xl font-bold text-sm bg-secondary"
              onClick={() => setViewingSale(null)}
            >
              CLOSE PREVIEW
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}