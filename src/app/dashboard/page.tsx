
"use client";

import { useMemo } from 'react';
import { 
  TrendingUp, 
  ArrowLeft,
  Download,
  Banknote,
  PlusCircle,
  MinusCircle,
  History
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { PurchaseRecord, CashTransaction } from '@/lib/types';
import { format } from 'date-fns';

export default function DashboardPage() {
  const db = useFirestore();
  const { user } = useUser();

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
      <div className="max-w-7xl mx-auto space-y-10">
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

        {/* Top Stats */}
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
          {/* Sales Activity */}
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
                      <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-black text-[10px] rounded-lg uppercase">
                        {sale.paymentMode}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Cash Flow Ledger */}
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
    </div>
  );
}
