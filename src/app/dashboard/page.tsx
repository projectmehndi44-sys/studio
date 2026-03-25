
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
  Search,
  Download,
  Filter,
  Printer,
  ShieldCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useCollection, useFirestore, useUser, useMemoFirebase, useDoc, useAuth } from '@/firebase';
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import { PurchaseRecord, CashTransaction } from '@/lib/types';
import { 
  format, 
  startOfToday, 
  startOfMonth, 
  startOfYesterday, 
  subDays, 
  isAfter, 
  isBefore, 
  endOfYesterday,
  isSameDay
} from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis } from "recharts";
import { PhoneAuthGate } from '@/components/auth/phone-auth-gate';
import { getStaffName } from '@/lib/staff';

type DateFilter = 'today' | 'yesterday' | 'month' | 'last7' | 'all';

export default function DashboardPage() {
  const db = useFirestore();
  const { user, isUserLoading: isAuthLoading } = useUser();
  const [viewingSale, setViewingSale] = useState<PurchaseRecord | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [searchQuery, setSearchQuery] = useState('');

  const staffName = getStaffName(user?.phoneNumber || null);

  const settingsRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, 'settings', 'config');
  }, [db, user]);
  
  const { data: shopSettings } = useDoc(settingsRef);
  const shopAddress = shopSettings?.address || "Hoolungooree, Mariani";

  // Fetch a broad set of recent data to allow instant local filtering
  const salesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, 'purchases'), orderBy('timestamp', 'desc'), limit(1000));
  }, [db, user]);

  const cashQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, 'cashTransactions'), orderBy('timestamp', 'desc'), limit(500));
  }, [db, user]);

  const { data: rawSales, isLoading: isSalesLoading } = useCollection<PurchaseRecord>(salesQuery);
  const { data: rawCash, isLoading: isCashLoading } = useCollection<CashTransaction>(cashQuery);

  const processedData = useMemo(() => {
    const sales = rawSales ?? [];
    const cash = rawCash ?? [];

    const filterByDate = (items: any[]) => {
      const today = startOfToday();
      const yesterdayStart = startOfYesterday();
      const yesterdayEnd = endOfYesterday();
      const monthStart = startOfMonth(new Date());
      const sevenDaysAgo = subDays(new Date(), 7);

      return items.filter(item => {
        if (!item.timestamp?.seconds) return true;
        const itemDate = new Date(item.timestamp.seconds * 1000);

        switch (dateFilter) {
          case 'today': return isAfter(itemDate, today) || isSameDay(itemDate, today);
          case 'yesterday': return isAfter(itemDate, yesterdayStart) && isBefore(itemDate, yesterdayEnd);
          case 'month': return isAfter(itemDate, monthStart);
          case 'last7': return isAfter(itemDate, sevenDaysAgo);
          case 'all': return true;
          default: return true;
        }
      });
    };

    const filteredSales = filterByDate(sales).filter(s => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.id?.toLowerCase().includes(q) || 
        s.customerName?.toLowerCase().includes(q) || 
        s.customerId?.toLowerCase().includes(q) ||
        s.staffName?.toLowerCase().includes(q)
      );
    });

    const filteredCash = filterByDate(cash);

    const totalSales = filteredSales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
    const totalIn = filteredCash.filter(c => c.type === 'IN').reduce((acc, c) => acc + c.amount, 0);
    const totalOut = filteredCash.filter(c => c.type === 'OUT').reduce((acc, c) => acc + c.amount, 0);

    return {
      filteredSales,
      filteredCash,
      stats: {
        sales: totalSales,
        cashInHand: totalSales + totalIn - totalOut,
        transactions: filteredSales.length
      }
    };
  }, [rawSales, rawCash, dateFilter, searchQuery]);

  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), i);
      return {
        date: format(d, 'dd MMM'),
        amount: 0,
        fullDate: format(d, 'yyyy-MM-dd')
      };
    }).reverse();

    (rawSales ?? []).forEach(sale => {
      if (sale.timestamp?.seconds) {
        const dateStr = format(new Date(sale.timestamp.seconds * 1000), 'yyyy-MM-dd');
        const day = last7Days.find(d => d.fullDate === dateStr);
        if (day) day.amount += sale.totalAmount;
      }
    });

    return last7Days;
  }, [rawSales]);

  if (isAuthLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center font-bold animate-pulse text-slate-400 text-xs uppercase tracking-[0.2em]">
          Syncing Cloud Ledger...
        </div>
      </div>
    );
  }

  if (!user) {
    return <PhoneAuthGate />;
  }

  const { filteredSales, filteredCash, stats } = processedData;

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8 font-body">
      {/* PROFESSIONAL PRINT-ONLY RECEIPT */}
      <div className="hidden print-only p-8 bg-white text-slate-900 font-receipt">
        <div className="text-center space-y-1 border-b-2 border-slate-900 pb-4 mb-4">
          <p className="text-lg font-bold text-slate-600 uppercase">KRISHNA&apos;S</p>
          <h2 className="text-4xl font-black uppercase tracking-tight">SUPER 9+</h2>
          <p className="text-sm font-bold mt-2">{shopAddress}</p>
          {shopSettings?.gstin && <p className="text-[10px] font-bold">GSTIN: {shopSettings?.gstin}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div className="space-y-1">
            <p className="font-bold">Bill ID: #{viewingSale?.id?.slice(-8) || 'ARCHIVE'}</p>
            <p className="font-bold">Date: {viewingSale?.timestamp?.seconds ? format(new Date(viewingSale.timestamp.seconds * 1000), 'dd/MM/yyyy') : '--'}</p>
          </div>
          <div className="space-y-1 text-right">
            <p className="font-bold">Cust: {viewingSale?.customerId || viewingSale?.customerName || 'Walk-in'}</p>
            <p className="font-bold">Staff: {viewingSale?.staffName || 'Admin'}</p>
          </div>
        </div>

        <table className="w-full text-xs border-collapse mb-6">
          <thead>
            <tr className="border-y-2 border-slate-900">
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
                <td className="py-2 text-right">₹{(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="space-y-1 text-right border-t-2 border-slate-900 pt-4">
          <div className="flex justify-between items-center pt-2">
            <span className="text-sm font-bold uppercase">Grand Total</span>
            <span className="text-2xl font-bold">₹{viewingSale?.totalAmount.toFixed(2)}</span>
          </div>
        </div>
        
        <div className="mt-8 text-center space-y-2">
          <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">
            Computer Generated Invoice • No Exchange without Bill
          </p>
          <p className="text-xs font-bold">Thank you for shopping at Krishna&apos;s Super 9+!</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8 print:hidden">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <Link href="/">
              <Button variant="outline" size="icon" className="h-11 w-11 rounded-2xl bg-white border-none shadow-sm hover:scale-105 active:scale-95 transition-all">
                <ArrowLeft className="h-5 w-5 text-secondary" />
              </Button>
            </Link>
            <div className="flex flex-col border-r pr-8 border-slate-200">
              <p className="text-[8px] font-black text-slate-400 tracking-[0.4em] uppercase leading-none mb-1">KRISHNA&apos;S</p>
              <h1 className="text-lg font-black tracking-tight uppercase leading-none text-secondary">SUPER 9+</h1>
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Business Ledger</h2>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
             {(['today', 'yesterday', 'last7', 'month', 'all'] as const).map((filter) => (
               <Button
                 key={filter}
                 variant={dateFilter === filter ? 'secondary' : 'ghost'}
                 onClick={() => setDateFilter(filter)}
                 className={cn(
                   "h-9 px-5 rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all",
                   dateFilter === filter ? "bg-secondary text-white shadow-md" : "text-slate-400"
                 )}
               >
                 {filter}
               </Button>
             ))}
          </div>
        </header>

        {isSalesLoading || isCashLoading ? (
          <div className="h-60 flex items-center justify-center">
            <div className="text-center font-bold animate-pulse text-slate-400 text-xs uppercase tracking-[0.2em]">
              Analyzing Data...
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-white border-none shadow-sm rounded-[24px] overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="bg-emerald-50 p-2.5 rounded-xl">
                          <TrendingUp className="h-5 w-5 text-emerald-500" />
                        </div>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filtered Revenue</p>
                      <h3 className="text-3xl font-bold mt-1 text-slate-900 tracking-tight">₹{stats.sales.toLocaleString()}</h3>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-none shadow-sm rounded-[24px] overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="bg-primary/5 p-2.5 rounded-xl">
                          <ShoppingBag className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Settled Bills</p>
                      <h3 className="text-3xl font-bold mt-1 text-slate-900 tracking-tight">{stats.transactions}</h3>
                    </CardContent>
                  </Card>

                  <Card className="bg-secondary text-white border-none shadow-xl rounded-[24px] overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="bg-white/10 p-2.5 rounded-xl">
                          <History className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Net Cash Flow</p>
                      <h3 className="text-3xl font-bold mt-1 tracking-tight">₹{stats.cashInHand.toLocaleString()}</h3>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-white border-none shadow-sm rounded-[24px] overflow-hidden">
                  <CardHeader className="p-6 pb-0">
                    <CardTitle className="text-lg font-bold text-secondary uppercase tracking-tight">Week Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-2">
                    <div className="h-[200px] w-full">
                      <ChartContainer config={{ amount: { label: "Sales (₹)", color: "hsl(var(--primary))" } }}>
                        <BarChart data={chartData}>
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                          <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} barSize={40} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </BarChart>
                      </ChartContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                 <Card className="bg-white border-none shadow-sm rounded-[24px] overflow-hidden">
                   <CardHeader className="p-6 border-b">
                     <div className="flex items-center gap-3">
                       <div className="bg-secondary/5 p-2.5 rounded-xl">
                         <History className="h-5 w-5 text-secondary" />
                       </div>
                       <div>
                         <CardTitle className="text-sm font-bold text-secondary uppercase tracking-tight">Manual Logs</CardTitle>
                       </div>
                     </div>
                   </CardHeader>
                   <CardContent className="p-0">
                     <div className="divide-y divide-slate-50 max-h-[460px] overflow-y-auto custom-scrollbar">
                       {filteredCash.length === 0 ? (
                         <div className="p-12 text-center text-slate-300 font-bold uppercase text-[10px] tracking-widest">
                           No logs for this period
                         </div>
                       ) : (
                         filteredCash.map((cf) => (
                           <div key={cf.id} className="p-4 flex items-center justify-between group hover:bg-slate-50 transition-colors">
                             <div className="flex items-center gap-3">
                               <div className={cn(
                                 "h-9 w-9 rounded-xl flex items-center justify-center border",
                                 cf.type === 'IN' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-primary/5 text-primary border-primary/10"
                               )}>
                                 {cf.type === 'IN' ? <PlusCircle className="h-4 w-4" /> : <MinusCircle className="h-4 w-4" />}
                               </div>
                               <div>
                                 <p className="font-bold text-sm text-slate-900 tracking-tight">₹{cf.amount.toLocaleString()}</p>
                                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{cf.reason}</p>
                                 <p className="text-[7px] font-black text-primary uppercase tracking-[0.2em]">{cf.staffName || 'System'}</p>
                               </div>
                             </div>
                             <p className="text-[9px] font-bold text-slate-300 uppercase">
                               {cf.timestamp?.seconds ? format(new Date(cf.timestamp.seconds * 1000), 'HH:mm') : ''}
                             </p>
                           </div>
                         ))
                       )}
                     </div>
                   </CardContent>
                 </Card>
              </div>
            </div>

            <Card className="bg-white border-none shadow-sm rounded-[32px] overflow-hidden">
              <CardHeader className="p-8 border-b bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <CardTitle className="text-xl font-bold text-secondary uppercase tracking-tight">Bill Explorer</CardTitle>
                </div>
                <div className="flex items-center gap-3">
                   <div className="relative w-full md:w-[320px]">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                     <Input 
                       placeholder="Search ID, Name or Phone..." 
                       className="h-11 pl-11 bg-white border-slate-100 rounded-xl font-bold text-xs"
                       value={searchQuery}
                       onChange={(e) => setSearchQuery(e.target.value)}
                     />
                   </div>
                   <Button variant="outline" className="h-11 rounded-xl border-slate-100 font-bold uppercase text-[10px] tracking-wider gap-2">
                     <Download className="h-4 w-4" /> Export
                   </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                 <Table>
                   <TableHeader className="bg-slate-50/50">
                     <TableRow className="border-none">
                       <TableHead className="font-bold text-[10px] uppercase tracking-widest h-14 pl-8">Timestamp</TableHead>
                       <TableHead className="font-bold text-[10px] uppercase tracking-widest h-14">Bill ID</TableHead>
                       <TableHead className="font-bold text-[10px] uppercase tracking-widest h-14">Customer</TableHead>
                       <TableHead className="font-bold text-[10px] uppercase tracking-widest h-14">Staff</TableHead>
                       <TableHead className="font-bold text-[10px] uppercase tracking-widest h-14 text-right">Amount</TableHead>
                       <TableHead className="font-bold text-[10px] uppercase tracking-widest h-14 text-right pr-8">Actions</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {filteredSales.length === 0 ? (
                       <TableRow>
                         <TableCell colSpan={6} className="h-40 text-center text-slate-300 font-bold uppercase text-[10px] tracking-widest">
                           No matching bills found
                         </TableCell>
                       </TableRow>
                     ) : (
                       filteredSales.map((sale) => (
                         <TableRow key={sale.id} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                           <TableCell className="pl-8">
                             <p className="font-bold text-slate-900 text-sm">{sale.timestamp?.seconds ? format(new Date(sale.timestamp.seconds * 1000), 'dd MMM yyyy') : 'Now'}</p>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{sale.timestamp?.seconds ? format(new Date(sale.timestamp.seconds * 1000), 'HH:mm') : ''}</p>
                           </TableCell>
                           <TableCell>
                             <code className="text-[10px] font-bold text-secondary bg-secondary/5 px-2 py-1 rounded-lg uppercase tracking-wider">#{sale.id?.slice(-8)}</code>
                           </TableCell>
                           <TableCell>
                             <p className="font-bold text-slate-900 text-sm">{sale.customerName || 'Standard Walk-in'}</p>
                             <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-0.5">{sale.customerId || 'No Mobile'}</p>
                           </TableCell>
                           <TableCell>
                             <Badge variant="outline" className="rounded-lg font-bold text-[9px] border-slate-100 text-slate-500 uppercase">
                               {sale.staffName || 'System'}
                             </Badge>
                           </TableCell>
                           <TableCell className="text-right">
                             <p className="font-black text-slate-900 text-base">₹{sale.totalAmount.toLocaleString()}</p>
                             <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">{sale.paymentMode}</p>
                           </TableCell>
                           <TableCell className="text-right pr-8">
                             <Button 
                               variant="ghost" 
                               size="sm" 
                               onClick={() => setViewingSale(sale)}
                               className="h-9 font-bold text-[10px] uppercase tracking-wider gap-2 hover:bg-secondary hover:text-white transition-all rounded-xl"
                             >
                               <Eye className="h-4 w-4" /> View
                             </Button>
                           </TableCell>
                         </TableRow>
                       ))
                     )}
                   </TableBody>
                 </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Dialog open={!!viewingSale} onOpenChange={(open) => !open && setViewingSale(null)}>
        <DialogContent className="sm:max-w-md rounded-[32px] p-10 border-none shadow-2xl overflow-hidden print:hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-secondary" />
          <DialogHeader className="space-y-4">
            <div className="mx-auto w-20 h-20 bg-secondary/5 rounded-3xl flex items-center justify-center">
              <ShoppingBag className="h-10 w-10 text-secondary" />
            </div>
            <DialogTitle className="text-center text-2xl font-bold uppercase tracking-tight text-secondary">Receipt Archive</DialogTitle>
          </DialogHeader>

          <div className="py-6 space-y-6">
            <div className="bg-slate-50 rounded-[24px] p-8 space-y-4">
              <div className="flex justify-between items-end border-t border-slate-100 pt-4">
                <div className="flex flex-col">
                   <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Final Amount</span>
                   <span className="text-4xl font-black text-slate-900 tracking-tighter">₹{viewingSale?.totalAmount.toLocaleString()}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-widest">Served By</span>
                  <span className="text-xs font-bold text-secondary uppercase">
                    {viewingSale?.staffName || 'System'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
               <Button variant="outline" className="h-14 rounded-2xl bg-white border-slate-100 font-bold uppercase text-[10px] gap-2">
                 <Printer className="h-4 w-4" /> Print
               </Button>
               <Button variant="outline" className="h-14 rounded-2xl bg-white border-slate-100 font-bold uppercase text-[10px] gap-2">
                 <Download className="h-4 w-4" /> PDF
               </Button>
            </div>
          </div>

          <DialogFooter>
            <Button className="w-full h-14 rounded-2xl font-bold text-sm bg-secondary text-white" onClick={() => setViewingSale(null)}>
              CLOSE AUDIT
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
