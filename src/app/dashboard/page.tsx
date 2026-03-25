"use client";

import { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  ArrowLeft,
  DollarSign,
  Users,
  Clock,
  ExternalLink,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { PurchaseRecord } from '@/lib/types';
import { format } from 'date-fns';

export default function DashboardPage() {
  const db = useFirestore();
  const { user } = useUser();

  const salesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, 'purchases'), orderBy('timestamp', 'desc'), limit(50));
  }, [db, user]);

  const { data, isLoading } = useCollection<PurchaseRecord>(salesQuery);
  const sales = data ?? [];

  const stats = useMemo(() => {
    const totalRevenue = sales.reduce((acc, sale) => acc + (sale.totalAmount || 0), 0);
    const totalDiscount = sales.reduce((acc, sale) => acc + (sale.discountAmount || 0), 0);
    const totalCustomers = new Set(sales.map(s => s.customerId).filter(Boolean)).size;
    
    return {
      revenue: totalRevenue,
      discount: totalDiscount,
      customers: totalCustomers || sales.length,
      avgTicket: sales.length ? totalRevenue / sales.length : 0
    };
  }, [sales]);

  // Mock data for charts
  const HEATMAP_DATA = [
    { hour: '8 AM', sales: 12 },
    { hour: '10 AM', sales: 34 },
    { hour: '12 PM', sales: 56 },
    { hour: '2 PM', sales: 42 },
    { hour: '4 PM', sales: 88 },
    { hour: '6 PM', sales: 112 },
    { hour: '8 PM', sales: 95 },
    { hour: '10 PM', sales: 22 },
  ];

  const DEAD_STOCK = [
    { name: 'Imported Biscuits', days: 68, value: 4500 },
    { name: 'Specialty Detergent', days: 62, value: 2100 },
    { name: 'Organic Honey', days: 61, value: 1800 },
  ];

  if (isLoading) {
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
          <div className="flex gap-4">
            <Button variant="outline" className="gap-2 bg-white rounded-2xl border-none shadow-sm font-black text-xs uppercase py-6 px-6">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
            <Button className="bg-primary text-primary-foreground font-black text-xs uppercase rounded-2xl py-6 px-8 shadow-xl shadow-primary/20">
              Update Catalog
            </Button>
          </div>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="bg-white border-none shadow-xl rounded-[32px] overflow-hidden">
            <div className="h-2 bg-primary w-full" />
            <CardContent className="pt-8">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Sales</p>
              <h3 className="text-4xl font-black mt-2 text-slate-900 tracking-tight">₹{stats.revenue.toLocaleString()}</h3>
              <div className="flex items-center gap-2 text-emerald-500 text-xs font-black mt-4">
                <TrendingUp className="h-4 w-4" /> LIVE SYNC
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-none shadow-xl rounded-[32px] overflow-hidden">
             <div className="h-2 bg-accent w-full" />
            <CardContent className="pt-8">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Savings</p>
              <h3 className="text-4xl font-black mt-2 text-accent tracking-tight">₹{stats.discount.toLocaleString()}</h3>
              <p className="text-xs font-bold text-slate-300 mt-4 uppercase tracking-tighter">Coupons & Loyalty</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-none shadow-xl rounded-[32px]">
            <CardContent className="pt-8">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transactions</p>
              <h3 className="text-4xl font-black mt-2 text-slate-900 tracking-tight">{sales.length}</h3>
              <p className="text-xs font-bold text-slate-300 mt-4 uppercase tracking-tighter">Last 50 Entries</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-none shadow-xl rounded-[32px]">
            <CardContent className="pt-8">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Bill Value</p>
              <h3 className="text-4xl font-black mt-2 text-slate-900 tracking-tight">₹{Math.round(stats.avgTicket)}</h3>
              <p className="text-xs font-bold text-slate-300 mt-4 uppercase tracking-tighter">Per Customer</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Sales History */}
          <Card className="lg:col-span-2 bg-white border-none shadow-2xl rounded-[40px] overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-2xl font-black text-slate-900 uppercase tracking-tight">Sales Activity</CardTitle>
              <CardDescription className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Recent ledger entries synced from terminal</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50">
                {sales.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">
                    No transactions found
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
                      <div className="text-right">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-black text-[10px] rounded-lg">
                          {sale.paymentMode}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Business Insights */}
          <div className="space-y-10">
            <Card className="bg-white border-none shadow-2xl rounded-[40px] overflow-hidden">
              <CardHeader className="p-8">
                <CardTitle className="text-2xl font-black text-slate-900 uppercase tracking-tight">Dead Stock</CardTitle>
                <CardDescription className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Unsold items requiring action</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <div className="space-y-8">
                  {DEAD_STOCK.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between group">
                      <div className="space-y-1">
                        <p className="font-black text-slate-900 tracking-tight">{item.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Idle: {item.days} days</p>
                      </div>
                      <Button variant="outline" size="sm" className="rounded-xl font-black text-[10px] uppercase border-accent text-accent hover:bg-accent hover:text-white py-4 px-4">
                        Liquidate
                      </Button>
                    </div>
                  ))}
                </div>
                <Separator className="my-10 bg-slate-50" />
                <div className="bg-primary/5 p-6 rounded-[24px] border border-primary/10">
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">AI Strategy</p>
                  <p className="text-sm font-bold leading-relaxed text-slate-600">
                    Push <span className="text-primary font-black underline underline-offset-4 decoration-primary/30">Bulk Bundles</span> for Imported Biscuits to your regular dairy customers tonight.
                  </p>
                  <Button variant="link" size="sm" className="p-0 h-auto mt-6 text-primary font-black uppercase text-xs tracking-widest">
                    Run Automation <ExternalLink className="h-3 w-3 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
