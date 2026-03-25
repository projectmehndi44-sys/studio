"use client";

import { useMemo, useState } from 'react';
import { 
  TrendingUp, 
  ArrowLeft,
  Download,
  Banknote,
  PlusCircle,
  MinusCircle,
  History,
  ShoppingBag,
  Eye,
  Printer,
  FileDown,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { PurchaseRecord, CashTransaction } from '@/lib/types';
import { format } from 'date-fns';
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

export default function DashboardPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useUser();
  const [viewingSale, setViewingSale] = useState<PurchaseRecord | null>(null);

  const salesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, 'purchases'), orderBy('timestamp', 'desc'), limit(50));
  }, [db, user]);

  const cashQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, 'cashTransactions'), orderBy('timestamp', 'desc'), limit(20));
  }, [db, user]);

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

  const handlePrintAction = (type: 'thermal' | 'normal' | 'pdf') => {
    if (type === 'pdf') {
      toast({ title: "Generating PDF", description: "Saving digital invoice..." });
    } else {
      toast({ 
        title: type === 'thermal' ? "Thermal Printing" : "Desktop Printing", 
        description: `Formatting for ${type} output...` 
      });
    }
    // Browser print dialog handles layout via @media print in globals.css
    window.print();
  };

  if (isSalesLoading || isCashLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center font-black animate-pulse text-slate-400">
          SYNCING BUSINESS LEDGER...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-body">
      {/* PROFESSIONAL PRINT-ONLY RECEIPT (HISTORICAL) */}
      <div className="hidden print-only p-8 bg-white text-slate-900 min-h-screen">
        <div className="text-center space-y-2 border-b-2 border-slate-900 pb-6 mb-6">
          <h2 className="text-3xl font-black uppercase tracking-tighter">Super 9+ Supermarket</h2>
          <p className="text-sm font-bold">Historical Digital Receipt</p>
          <p className="text-xs font-medium">Main Market, New Delhi • GSTIN: 07AABCU1234F1Z5</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div className="space-y-1">
            <p className="font-bold">Bill ID: <span className="font-medium">#{viewingSale?.id || Date.now()}</span></p>
            <p className="font-bold">Date: <span className="font-medium">
              {viewingSale?.timestamp?.seconds ? format(new Date(viewingSale.timestamp.seconds * 1000), 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy')}
            </span></p>
            <p className="font-bold">Time: <span className="font-medium">
              {viewingSale?.timestamp?.seconds ? format(new Date(viewingSale.timestamp.seconds * 1000), 'HH:mm:ss') : format(new Date(), 'HH:mm:ss')}
            </span></p>
          </div>
          <div className="space-y-1 text-right">
            <p className="font-bold">Customer: <span className="font-medium">{viewingSale?.customerId || 'Walk-in Guest'}</span></p>
            <p className="font-bold">Mode: <span className="font-medium">{viewingSale?.paymentMode || 'Cash'}</span></p>
            <p className="font-bold">Status: <span className="font-medium">Duplicate Copy</span></p>
          </div>
        </div>

        <table className="w-full text-sm border-collapse mb-8">
          <thead>
            <tr className="border-y-2 border-slate-900">
              <th className="text-left py-3 font-black uppercase text-xs">Item Description</th>
              <th className="text-center py-3 font-black uppercase text-xs">Qty</th>
              <th className="text-right py-3 font-black uppercase text-xs">Rate</th>
              <th className="text-right py-3 font-black uppercase text-xs">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {viewingSale?.items.map((item, idx) => (
              <tr key={idx}>
                <td className="py-3 font-bold">{item.name}</td>
                <td className="py-3 text-center font-bold">{item.quantity}</td>
                <td className="py-3 text-right font-bold">₹{item.price}</td>
                <td className="py-3 text-right font-bold">₹{item.price * item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="space-y-2 text-right border-t-2 border-slate-900 pt-6">
          <div className="flex justify-between items-center text-sm font-bold">
            <span>Subtotal</span>
            <span>₹{viewingSale?.subtotalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-sm font-bold">
            <span>Discount</span>
            <span>-₹{viewingSale?.discountAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-100">
            <span className="text-lg font-black uppercase tracking-tight">Grand Total</span>
            <span className="text-3xl font-black">₹{viewingSale?.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-16 text-center space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Duplicate Copy • Generated from Cloud Archive
          </p>
          <p className="text-sm font-bold">Thank you for shopping at Super 9+!</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-10 print:hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <Link href="/">
              <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm hover:scale-110 active:scale-90 transition-all">
                <ArrowLeft className="h-6 w-6 text-slate-900" />
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter">BUSINESS LEDGER</h1>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Real-time Performance Reports</p>
            </div>
          </div>
          <Button variant="outline" className="gap-2 bg-white rounded-2xl border-none shadow-sm font-black text-xs uppercase py-6 px-6">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="bg-white border-none shadow-xl rounded-[32px] overflow-hidden">
            <div className="h-2 bg-primary w-full" />
            <CardContent className="pt-8">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenue from Sales</p>
              <h3 className="text-4xl font-black mt-2 text-slate-900 tracking-tight">₹{stats.sales.toLocaleString()}</h3>
              <div className="flex items-center gap-2 text-emerald-500 text-xs font-black mt-4">
                <TrendingUp className="h-4 w-4" /> LIVE SYNC
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-none shadow-xl rounded-[32px] overflow-hidden">
             <div className="h-2 bg-accent w-full" />
            <CardContent className="pt-8">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Cash in Drawer</p>
              <h3 className="text-4xl font-black mt-2 text-accent tracking-tight">₹{stats.cashInHand.toLocaleString()}</h3>
              <p className="text-xs font-bold text-slate-300 mt-4 uppercase tracking-tighter">Adjusted for manual flow</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-none shadow-xl rounded-[32px]">
            <CardContent className="pt-8">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manual Adjustment</p>
              <h3 className={cn("text-4xl font-black mt-2 tracking-tight", stats.netCashFlow >= 0 ? "text-emerald-500" : "text-destructive")}>
                {stats.netCashFlow >= 0 ? '+' : ''}₹{stats.netCashFlow.toLocaleString()}
              </h3>
              <p className="text-xs font-bold text-slate-300 mt-4 uppercase tracking-tighter">In/Out Entries</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-none shadow-xl rounded-[32px]">
            <CardContent className="pt-8">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Activity Count</p>
              <h3 className="text-4xl font-black mt-2 text-slate-900 tracking-tight">{stats.transactions}</h3>
              <p className="text-xs font-bold text-slate-300 mt-4 uppercase tracking-tighter">Syncing Recent Entries</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <Card className="bg-white border-none shadow-2xl rounded-[40px] overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                <CardTitle className="text-2xl font-black text-slate-900 uppercase tracking-tight">Sales activity</CardTitle>
              </div>
              <CardDescription className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Synced customer receipts</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50">
                {sales.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">
                    No sales recorded
                  </div>
                ) : (
                  sales.map((sale) => (
                    <div key={sale.id} className="p-6 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="bg-slate-100 h-12 w-12 rounded-2xl flex items-center justify-center font-black text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          {sale.paymentMode?.[0] || '₹'}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 tracking-tight">₹{sale.totalAmount}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {sale.timestamp?.seconds ? format(new Date(sale.timestamp.seconds * 1000), 'HH:mm • dd MMM') : 'Processing...'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-black text-[10px] rounded-lg uppercase">
                          {sale.paymentMode}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setViewingSale(sale)}
                          className="rounded-xl hover:bg-primary/10 hover:text-primary"
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

          <Card className="bg-white border-none shadow-2xl rounded-[40px] overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-accent" />
                <CardTitle className="text-2xl font-black text-slate-900 uppercase tracking-tight">Manual adjustments</CardTitle>
              </div>
              <CardDescription className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Non-receipt cash flow (In/Out)</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50">
                {cashFlows.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">
                    No manual flow recorded
                  </div>
                ) : (
                  cashFlows.map((cf) => (
                    <div key={cf.id} className="p-6 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "h-12 w-12 rounded-2xl flex items-center justify-center",
                          cf.type === 'IN' ? "bg-emerald-50 text-emerald-500" : "bg-destructive/5 text-destructive"
                        )}>
                          {cf.type === 'IN' ? <PlusCircle className="h-6 w-6" /> : <MinusCircle className="h-6 w-6" />}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 tracking-tight">
                            {cf.type === 'IN' ? '+' : '-'}₹{cf.amount}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {cf.reason}
                          </p>
                        </div>
                      </div>
                      <p className="text-[10px] font-black text-slate-300 uppercase">
                        {cf.timestamp?.seconds ? format(new Date(cf.timestamp.seconds * 1000), 'HH:mm • dd MMM') : 'Recent'}
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
        <DialogContent className="sm:max-w-md rounded-[40px] p-10 border-none shadow-2xl overflow-hidden print:hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
          <DialogHeader className="space-y-4">
            <div className="mx-auto w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center">
              <ShoppingBag className="h-12 w-12 text-primary" />
            </div>
            <DialogTitle className="text-center text-3xl font-black uppercase tracking-tight">Sale Record</DialogTitle>
            <DialogDescription className="text-center font-bold text-slate-400 uppercase text-[10px] tracking-widest">
              Review and re-print historical receipt
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-4">
            <div className="bg-slate-50 rounded-3xl p-6 space-y-3">
              <div className="flex justify-between items-center text-xs font-black uppercase text-slate-400">
                <span>Items: {viewingSale?.items.length}</span>
                <span>{viewingSale?.paymentMode}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-3xl font-black text-slate-900 tracking-tight">₹{viewingSale?.totalAmount}</span>
                <span className="text-[10px] font-bold text-slate-400">
                  {viewingSale?.timestamp?.seconds ? format(new Date(viewingSale.timestamp.seconds * 1000), 'HH:mm • dd MMM') : ''}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <Button 
                variant="outline" 
                className="h-16 rounded-2xl bg-slate-50 border-none font-black uppercase text-xs gap-3 hover:bg-slate-100"
                onClick={() => handlePrintAction('normal')}
              >
                <Printer className="h-5 w-5 text-primary" /> Normal Desktop Print
              </Button>
              <Button 
                variant="outline" 
                className="h-16 rounded-2xl bg-slate-50 border-none font-black uppercase text-xs gap-3 hover:bg-slate-100"
                onClick={() => handlePrintAction('thermal')}
              >
                <Printer className="h-5 w-5 text-accent" /> Thermal Printer (58/80mm)
              </Button>
              <Button 
                variant="outline" 
                className="h-16 rounded-2xl bg-slate-50 border-none font-black uppercase text-xs gap-3 hover:bg-slate-100"
                onClick={() => handlePrintAction('pdf')}
              >
                <FileDown className="h-5 w-5 text-slate-400" /> Save as PDF
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button 
              className="w-full h-16 rounded-2xl font-black text-lg shadow-xl shadow-primary/20"
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
