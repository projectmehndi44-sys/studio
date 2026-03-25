"use client";

import { useMemo, useState } from 'react';
import { 
  TrendingUp, 
  ArrowLeft,
  Download,
  PlusCircle,
  MinusCircle,
  History,
  ShoppingBag,
  Eye,
  Printer,
  FileDown,
  Calendar,
  Filter
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
  DialogDescription,
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
        <div className="text-center font-black animate-pulse text-slate-400 text-2xl uppercase tracking-widest">
          Syncing Cloud Ledger...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-body">
      {/* PRINT-ONLY RECEIPT */}
      <div className="hidden print-only p-12 bg-white text-slate-900 font-receipt">
        <div className="text-center space-y-2 border-b-2 border-slate-900 pb-8 mb-8">
           <p className="text-[10px] font-black tracking-[0.4em] text-slate-500">KRISHNA'S</p>
          <h2 className="text-5xl font-black uppercase tracking-tighter">Super 9+ Supermarket</h2>
          <p className="text-lg font-bold">Historical Digital Copy</p>
          <p className="text-sm font-medium">Main Market, New Delhi • GSTIN: 07AABCU1234F1Z5</p>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-10 text-lg">
          <div className="space-y-2">
            <p className="font-bold">Bill ID: #{viewingSale?.id || 'ARCHIVE'}</p>
            <p className="font-bold">Date: {viewingSale?.timestamp?.seconds ? format(new Date(viewingSale.timestamp.seconds * 1000), 'dd/MM/yyyy') : '--'}</p>
          </div>
          <div className="space-y-2 text-right">
            <p className="font-bold">Cust: {viewingSale?.customerId || 'Walk-in'}</p>
            <p className="font-bold">Mode: {viewingSale?.paymentMode || 'Cash'}</p>
          </div>
        </div>

        <table className="w-full text-lg border-collapse mb-10">
          <thead>
            <tr className="border-y-2 border-slate-900">
              <th className="text-left py-4 font-black uppercase">Item</th>
              <th className="text-center py-4 font-black uppercase">Qty</th>
              <th className="text-right py-4 font-black uppercase">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {viewingSale?.items.map((item, idx) => (
              <tr key={idx}>
                <td className="py-4 font-bold">{item.name}</td>
                <td className="py-4 text-center font-bold">{item.quantity}</td>
                <td className="py-4 text-right font-bold">₹{item.price * item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="space-y-3 text-right border-t-2 border-slate-900 pt-8">
          <div className="flex justify-between items-center pt-4">
            <span className="text-2xl font-black uppercase tracking-tight">Grand Total</span>
            <span className="text-5xl font-black">₹{viewingSale?.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-20 text-center">
          <p className="text-sm font-bold">Thank you for shopping at Krishna's Super 9+!</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-12 print:hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-8">
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-16 w-16 rounded-[24px] bg-white shadow-xl hover:scale-110 active:scale-90 transition-all">
                <ArrowLeft className="h-8 w-8 text-secondary" />
              </Button>
            </Link>
            <div className="flex flex-col">
              <p className="text-xs font-black text-secondary tracking-[0.4em] leading-none mb-2">KRISHNA'S</p>
              <h1 className="text-5xl font-black text-primary tracking-tighter uppercase leading-none">Super9<span className="text-secondary">+</span> Ledger</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-white p-2 rounded-[32px] shadow-xl">
             {(['today', 'yesterday', 'month', 'all'] as const).map((filter) => (
               <Button
                 key={filter}
                 variant={dateFilter === filter ? 'default' : 'ghost'}
                 onClick={() => setDateFilter(filter)}
                 className={cn(
                   "h-14 px-8 rounded-[24px] font-black uppercase text-xs tracking-widest transition-all",
                   dateFilter === filter ? "bg-secondary shadow-lg shadow-secondary/20" : "text-slate-400"
                 )}
               >
                 {filter}
               </Button>
             ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <Card className="bg-white border-none shadow-2xl rounded-[48px] overflow-hidden group hover:scale-[1.02] transition-transform">
            <div className="h-3 bg-primary w-full" />
            <CardContent className="pt-10 p-10">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Sales</p>
              <h3 className="text-5xl font-black mt-3 text-slate-900 tracking-tighter">₹{stats.sales.toLocaleString()}</h3>
              <div className="flex items-center gap-2 text-emerald-500 text-xs font-black mt-6">
                <TrendingUp className="h-5 w-5" /> SYNCED
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-none shadow-2xl rounded-[48px] overflow-hidden group hover:scale-[1.02] transition-transform">
             <div className="h-3 bg-secondary w-full" />
            <CardContent className="pt-10 p-10">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Cash in Drawer</p>
              <h3 className="text-5xl font-black mt-3 text-secondary tracking-tighter">₹{stats.cashInHand.toLocaleString()}</h3>
              <p className="text-xs font-bold text-slate-300 mt-6 uppercase tracking-widest">Adjusted for In/Out</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-none shadow-2xl rounded-[48px] group hover:scale-[1.02] transition-transform">
            <CardContent className="pt-10 p-10">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Manual Flow</p>
              <h3 className={cn("text-5xl font-black mt-3 tracking-tighter", stats.netCashFlow >= 0 ? "text-emerald-500" : "text-destructive")}>
                {stats.netCashFlow >= 0 ? '+' : ''}₹{stats.netCashFlow.toLocaleString()}
              </h3>
              <p className="text-xs font-bold text-slate-300 mt-6 uppercase tracking-widest">Drawer Adjustments</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-none shadow-2xl rounded-[48px] group hover:scale-[1.02] transition-transform">
            <CardContent className="pt-10 p-10">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Order Count</p>
              <h3 className="text-5xl font-black mt-3 text-slate-900 tracking-tighter">{sales.length}</h3>
              <p className="text-xs font-bold text-slate-300 mt-6 uppercase tracking-widest">Transactions Period</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <Card className="bg-white border-none shadow-2xl rounded-[56px] overflow-hidden">
            <CardHeader className="p-10 pb-6">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-4 rounded-[20px]">
                  <ShoppingBag className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-black text-slate-900 uppercase tracking-tight">Recent Sales</CardTitle>
                  <CardDescription className="font-bold text-slate-400 uppercase text-xs tracking-[0.2em] mt-1">Transaction History</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50">
                {sales.length === 0 ? (
                  <div className="p-16 text-center text-slate-400 font-bold uppercase text-sm tracking-widest">
                    No sales for this period
                  </div>
                ) : (
                  sales.map((sale) => (
                    <div key={sale.id} className="p-8 hover:bg-slate-50/80 transition-all flex items-center justify-between group">
                      <div className="flex items-center gap-6">
                        <div className="bg-white shadow-md h-16 w-16 rounded-[24px] flex items-center justify-center font-black text-slate-400 group-hover:bg-primary group-hover:text-white transition-all text-xl">
                          {sale.paymentMode?.[0] || '₹'}
                        </div>
                        <div>
                          <p className="font-black text-2xl text-slate-900 tracking-tighter">₹{sale.totalAmount.toLocaleString()}</p>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {sale.timestamp?.seconds ? format(new Date(sale.timestamp.seconds * 1000), 'HH:mm • dd MMM') : 'Syncing...'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-black text-xs rounded-xl uppercase h-10 px-4">
                          {sale.paymentMode}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setViewingSale(sale)}
                          className="h-14 w-14 rounded-2xl hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          <Eye className="h-6 w-6" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-none shadow-2xl rounded-[56px] overflow-hidden">
            <CardHeader className="p-10 pb-6">
              <div className="flex items-center gap-4">
                <div className="bg-secondary/10 p-4 rounded-[20px]">
                  <History className="h-8 w-8 text-secondary" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-black text-slate-900 uppercase tracking-tight">Manual Flow</CardTitle>
                  <CardDescription className="font-bold text-slate-400 uppercase text-xs tracking-[0.2em] mt-1">Drawer Adjustments</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50">
                {cashFlows.length === 0 ? (
                  <div className="p-16 text-center text-slate-400 font-bold uppercase text-sm tracking-widest">
                    No adjustments recorded
                  </div>
                ) : (
                  cashFlows.map((cf) => (
                    <div key={cf.id} className="p-8 hover:bg-slate-50/80 transition-all flex items-center justify-between group">
                      <div className="flex items-center gap-6">
                        <div className={cn(
                          "h-16 w-16 rounded-[24px] flex items-center justify-center shadow-sm",
                          cf.type === 'IN' ? "bg-emerald-50 text-emerald-500" : "bg-destructive/5 text-destructive"
                        )}>
                          {cf.type === 'IN' ? <PlusCircle className="h-8 w-8" /> : <MinusCircle className="h-8 w-8" />}
                        </div>
                        <div>
                          <p className="font-black text-2xl text-slate-900 tracking-tighter">
                            {cf.type === 'IN' ? '+' : '-'}₹{cf.amount.toLocaleString()}
                          </p>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {cf.reason}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs font-black text-slate-300 uppercase tracking-widest">
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
        <DialogContent className="sm:max-w-md rounded-[48px] p-12 border-none shadow-2xl overflow-hidden print:hidden">
          <div className="absolute top-0 left-0 w-full h-3 bg-primary" />
          <DialogHeader className="space-y-6">
            <div className="mx-auto w-24 h-24 bg-primary/10 rounded-[32px] flex items-center justify-center">
              <ShoppingBag className="h-14 w-14 text-primary" />
            </div>
            <DialogTitle className="text-center text-4xl font-black uppercase tracking-tight">Bill Record</DialogTitle>
          </DialogHeader>

          <div className="py-8 space-y-6">
            <div className="bg-slate-50 rounded-[32px] p-8 space-y-4">
              <div className="flex justify-between items-center text-xs font-black uppercase text-slate-400 tracking-widest">
                <span>Items: {viewingSale?.items.length}</span>
                <span>{viewingSale?.paymentMode}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-5xl font-black text-slate-900 tracking-tighter">₹{viewingSale?.totalAmount.toLocaleString()}</span>
                <span className="text-sm font-bold text-slate-400">
                  {viewingSale?.timestamp?.seconds ? format(new Date(viewingSale.timestamp.seconds * 1000), 'HH:mm • dd MMM') : ''}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <Button 
                variant="outline" 
                className="h-20 rounded-3xl bg-slate-50 border-none font-black uppercase text-sm gap-4 hover:bg-slate-100"
                onClick={handlePrintAction}
              >
                <Printer className="h-7 w-7 text-primary" /> Normal Desktop Print
              </Button>
              <Button 
                variant="outline" 
                className="h-20 rounded-3xl bg-slate-50 border-none font-black uppercase text-sm gap-4 hover:bg-slate-100"
                onClick={handlePrintAction}
              >
                <Printer className="h-7 w-7 text-secondary" /> Thermal Printer (58/80mm)
              </Button>
              <Button 
                variant="outline" 
                className="h-20 rounded-3xl bg-slate-50 border-none font-black uppercase text-sm gap-4 hover:bg-slate-100"
                onClick={handlePrintAction}
              >
                <FileDown className="h-7 w-7 text-slate-400" /> Save as Digital Copy
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button 
              className="w-full h-20 rounded-3xl font-black text-xl shadow-xl shadow-primary/20 bg-secondary"
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