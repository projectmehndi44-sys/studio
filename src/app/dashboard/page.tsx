
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
  Calendar as CalendarIcon,
  ChevronDown,
  FileText,
  BarChart3,
  ShieldAlert
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useCollection, useFirestore, useUser, useMemoFirebase, useDoc } from '@/firebase';
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
  isSameDay,
  getMonth,
  getYear,
  startOfYear,
  endOfMonth,
  endOfYear
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
import { isStaffAdmin } from '@/lib/staff';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DateFilter = 'today' | 'yesterday' | 'month' | 'last7' | 'year' | 'all';

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const YEARS = Array.from({ length: 5 }, (_, i) => (getYear(new Date()) - i).toString());

export default function DashboardPage() {
  const db = useFirestore();
  const { user, isUserLoading: isAuthLoading } = useUser();
  const [viewingSale, setViewingSale] = useState<PurchaseRecord | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Reporting state
  const [selectedMonth, setSelectedMonth] = useState<string>(getMonth(new Date()).toString());
  const [selectedYear, setSelectedYear] = useState<string>(getYear(new Date()).toString());

  const isAdmin = useMemo(() => isStaffAdmin(user?.phoneNumber || null), [user]);

  const settingsRef = useMemoFirebase(() => {
    if (!user || !isAdmin) return null;
    return doc(db, 'settings', 'config');
  }, [db, user, isAdmin]);
  
  const { data: shopSettings } = useDoc(settingsRef);
  const shopAddress = shopSettings?.address || "Hoolungooree, Mariani";

  const salesQuery = useMemoFirebase(() => {
    if (!user || !isAdmin) return null;
    return query(collection(db, 'purchases'), orderBy('timestamp', 'desc'), limit(5000));
  }, [db, user, isAdmin]);

  const cashQuery = useMemoFirebase(() => {
    if (!user || !isAdmin) return null;
    return query(collection(db, 'cashTransactions'), orderBy('timestamp', 'desc'), limit(1000));
  }, [db, user, isAdmin]);

  const { data: rawSales, isLoading: isSalesLoading } = useCollection<PurchaseRecord>(salesQuery);
  const { data: rawCash, isLoading: isCashLoading } = useCollection<CashTransaction>(cashQuery);

  const processedData = useMemo(() => {
    const sales = rawSales ?? [];
    const cash = rawCash ?? [];

    const filterByDate = (items: any[]) => {
      return items.filter(item => {
        if (!item.timestamp?.seconds) return true;
        const itemDate = new Date(item.timestamp.seconds * 1000);

        switch (dateFilter) {
          case 'today': return isAfter(itemDate, startOfToday()) || isSameDay(itemDate, startOfToday());
          case 'yesterday': return isAfter(itemDate, startOfYesterday()) && isBefore(itemDate, endOfYesterday());
          case 'last7': return isAfter(itemDate, subDays(new Date(), 7));
          case 'month': 
            return getMonth(itemDate) === parseInt(selectedMonth) && getYear(itemDate) === parseInt(selectedYear);
          case 'year':
            return getYear(itemDate) === parseInt(selectedYear);
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
        (s.customerName || '').toLowerCase().includes(q) || 
        (s.customerId || '').toLowerCase().includes(q) ||
        (s.staffName || '').toLowerCase().includes(q)
      );
    });

    const filteredCash = filterByDate(cash);

    const totalSales = filteredSales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
    const totalIn = filteredCash.filter(c => c.type === 'IN').reduce((acc, c) => acc + c.amount, 0);
    const totalOut = filteredCash.filter(c => c.type === 'OUT').reduce((acc, c) => acc + c.amount, 0);

    const paymentModes = filteredSales.reduce((acc: any, s) => {
      const mode = s.paymentMode || 'Cash';
      acc[mode] = (acc[mode] || 0) + s.totalAmount;
      return acc;
    }, {});

    return {
      filteredSales,
      filteredCash,
      stats: {
        sales: totalSales,
        cashInHand: totalSales + totalIn - totalOut,
        transactions: filteredSales.length,
        paymentModes
      }
    };
  }, [rawSales, rawCash, dateFilter, searchQuery, selectedMonth, selectedYear]);

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

  const handlePrintAction = () => {
    window.print();
  };

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

  if (!isAdmin) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 p-8 text-center">
        <div className="max-w-md space-y-6 animate-in fade-in zoom-in-95 duration-500">
          <div className="mx-auto w-24 h-24 bg-primary/5 rounded-[40px] flex items-center justify-center">
            <ShieldAlert className="h-12 w-12 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black uppercase tracking-tight text-secondary">Access Restricted</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Authorized Entry Only
            </p>
          </div>
          <p className="text-sm font-medium text-slate-500 leading-relaxed px-4">
            The Business Ledger is locked to Admin and Owner accounts only. Please return to the Billing Desk to continue operations.
          </p>
          <Link href="/">
            <Button className="h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-[0.2em] bg-secondary text-white shadow-xl">
              Back to Billing Desk
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { filteredSales, filteredCash, stats } = processedData;

  const getFormattedDateTime = (timestamp: any) => {
    if (!timestamp) return '--';
    if (timestamp.seconds) return format(new Date(timestamp.seconds * 1000), 'dd/MM/yyyy HH:mm');
    return format(new Date(timestamp), 'dd/MM/yyyy HH:mm');
  };

  const getReportPeriodLabel = () => {
    if (dateFilter === 'month') return `${MONTHS[parseInt(selectedMonth)]} ${selectedYear}`;
    if (dateFilter === 'year') return `Year ${selectedYear}`;
    return dateFilter.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8 font-body">
      {/* HIGH-FIDELITY PRINT RECEIPT (LEDGER ARCHIVE) */}
      <div className="hidden print-only p-4 bg-white text-slate-900 font-receipt min-h-screen text-[10pt] leading-tight">
        {isReportOpen ? (
          <div className="space-y-4">
             <div className="text-center border-b-2 border-slate-900 pb-2 mb-4">
                <p className="text-[12pt] font-bold uppercase">BUSINESS AUDIT REPORT</p>
                <h1 className="text-[14pt] font-black uppercase">KRISHNA'S SUPER 9+</h1>
                <p className="text-[10pt] font-bold mt-1">Period: {getReportPeriodLabel()}</p>
             </div>
             
             <div className="grid grid-cols-2 gap-4 border-b border-slate-900 pb-2">
                <div>
                   <p className="font-bold">TOTAL REVENUE</p>
                   <p className="text-[14pt] font-black">₹{stats.sales.toLocaleString()}</p>
                </div>
                <div className="text-right">
                   <p className="font-bold">TOTAL BILLS</p>
                   <p className="text-[14pt] font-black">{stats.transactions}</p>
                </div>
             </div>

             <div className="py-2">
                <p className="font-black border-b border-slate-400 mb-1">PAYMENT SETTLEMENT BREAKDOWN</p>
                {Object.entries(stats.paymentModes).map(([mode, amount]: any) => (
                   <div key={mode} className="flex justify-between items-center py-0.5">
                      <span className="font-bold uppercase">{mode}</span>
                      <span className="font-bold">₹{amount.toLocaleString()}</span>
                   </div>
                ))}
             </div>

             <div className="py-2 border-t border-slate-900">
                <p className="font-black mb-1">AUDIT TIMESTAMP: {format(new Date(), 'dd/MM/yyyy HH:mm:ss')}</p>
                <p className="text-[8pt]">This is a computer-generated summary of cloud transactions for Krishna's Super 9+.</p>
             </div>
          </div>
        ) : (
          <>
            <div className="text-center space-y-0 border-b border-slate-900 pb-1 mb-1">
              <p className="text-[10pt] font-bold uppercase tracking-tight">KRISHNA'S</p>
              <h2 className="text-[10pt] font-black uppercase tracking-tight leading-none">SUPER 9+</h2>
              <p className="text-[8pt] font-bold mt-0.5">{shopAddress}</p>
              {shopSettings?.gstin && <p className="text-[8pt] font-bold">GSTIN: {shopSettings?.gstin}</p>}
            </div>

            <div className="grid grid-cols-2 gap-1 mb-1 text-[8pt] leading-none">
              <div className="space-y-0">
                <p className="font-bold">Bill ID: #{viewingSale?.id?.slice(-8) || 'ARCHIVE'}</p>
                <p className="font-bold">DateTime: {getFormattedDateTime(viewingSale?.timestamp)}</p>
              </div>
              <div className="space-y-0 text-right">
                <p className="font-bold">Cust: {viewingSale?.customerName || 'Walk-in'}</p>
                <p className="font-bold">Mob: {viewingSale?.customerId || 'N/A'}</p>
                <p className="font-bold">Staff: {viewingSale?.staffName || 'System'}</p>
              </div>
            </div>

            <table className="w-full text-[8pt] border-collapse mb-1">
              <thead>
                <tr className="border-y border-slate-900">
                  <th className="text-left py-0.5 font-bold uppercase">Item</th>
                  <th className="text-right py-0.5 font-bold uppercase">Price</th>
                  <th className="text-center py-0.5 font-bold uppercase">Qty</th>
                  <th className="text-right py-0.5 font-bold uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {viewingSale?.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-0.5">{item.name}</td>
                    <td className="py-0.5 text-right">₹{item.price.toFixed(0)}</td>
                    <td className="py-0.5 text-center">{item.quantity}</td>
                    <td className="py-0.5 text-right">₹{(item.price * item.quantity).toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="space-y-0 text-right border-t border-slate-900 pt-1">
              <div className="flex justify-between items-center pt-0.5 border-t border-slate-400">
                <span className="text-[9pt] font-bold uppercase">Grand Total</span>
                <span className="text-[10pt] font-bold">₹{viewingSale?.totalAmount.toFixed(0)}</span>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="max-w-7xl mx-auto space-y-8 print:hidden">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <Link href="/">
              <Button variant="outline" size="icon" className="h-11 w-11 rounded-2xl bg-white border-none shadow-sm hover:scale-105 active:scale-95 transition-all">
                <ArrowLeft className="h-5 w-5 text-secondary" />
              </Button>
            </Link>
            <div className="flex items-center gap-2 border-r pr-8 border-slate-200">
              <span className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.2em]">KRISHNA'S</span>
              <span className="text-lg font-black tracking-tight uppercase text-secondary">SUPER 9+</span>
            </div>
            <div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Business Ledger</h2>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200">
               {(['today', 'yesterday', 'last7', 'month', 'year', 'all'] as const).map((filter) => (
                 <Button
                   key={filter}
                   variant={dateFilter === filter ? 'secondary' : 'ghost'}
                   onClick={() => setDateFilter(filter)}
                   className={cn(
                     "h-9 px-4 rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all",
                     dateFilter === filter ? "bg-secondary text-white shadow-md" : "text-slate-400"
                   )}
                 >
                   {filter}
                 </Button>
               ))}
            </div>
            
            {(dateFilter === 'month' || dateFilter === 'year') && (
              <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-right-2">
                {dateFilter === 'month' && (
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="h-9 w-32 border-none bg-slate-50 font-bold text-[10px] uppercase rounded-xl">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {MONTHS.map((m, i) => (
                        <SelectItem key={m} value={i.toString()} className="text-[10px] font-bold uppercase">{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="h-9 w-24 border-none bg-slate-50 font-bold text-[10px] uppercase rounded-xl">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {YEARS.map(y => (
                      <SelectItem key={y} value={y} className="text-[10px] font-bold uppercase">{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button 
              onClick={() => setIsReportOpen(true)}
              className="h-11 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-primary hover:bg-primary/95 text-white shadow-lg shadow-primary/10 gap-2"
            >
              <FileText className="h-4 w-4" /> Generate Audit
            </Button>
          </div>
        </header>

        {isSalesLoading || isCashLoading ? (
          <div className="h-60 flex items-center justify-center">
            <div className="text-center font-bold animate-pulse text-slate-400 text-xs uppercase tracking-[0.2em]">
              Analyzing Ledger...
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
                        <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-emerald-100 text-emerald-600">
                          {getReportPeriodLabel()}
                        </Badge>
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
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Invoices</p>
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
                      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Net Cash Handled</p>
                      <h3 className="text-3xl font-bold mt-1 tracking-tight">₹{stats.cashInHand.toLocaleString()}</h3>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-white border-none shadow-sm rounded-[24px] overflow-hidden">
                    <CardHeader className="p-6 pb-0">
                      <CardTitle className="text-sm font-bold text-secondary uppercase tracking-tight">Weekly Volatility</CardTitle>
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

                  <Card className="bg-white border-none shadow-sm rounded-[24px] overflow-hidden">
                    <CardHeader className="p-6 pb-0">
                      <CardTitle className="text-sm font-bold text-secondary uppercase tracking-tight">Payment Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 pt-4 space-y-4">
                       {Object.entries(stats.paymentModes).map(([mode, amount]: any) => {
                         const percent = (amount / stats.sales) * 100;
                         return (
                           <div key={mode} className="space-y-1">
                             <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                                <span className="text-slate-500">{mode}</span>
                                <span className="text-secondary">₹{amount.toLocaleString()}</span>
                             </div>
                             <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                               <div 
                                 className={cn(
                                   "h-full rounded-full transition-all duration-1000",
                                   mode === 'Cash' ? 'bg-emerald-500' : mode === 'UPI' ? 'bg-blue-500' : 'bg-orange-500'
                                 )} 
                                 style={{ width: `${percent}%` }} 
                               />
                             </div>
                           </div>
                         );
                       })}
                       {Object.keys(stats.paymentModes).length === 0 && (
                         <div className="h-[140px] flex items-center justify-center text-slate-300 font-bold uppercase text-[10px] tracking-[0.2em]">
                           No data available
                         </div>
                       )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="space-y-6">
                 <Card className="bg-white border-none shadow-sm rounded-[24px] overflow-hidden">
                   <CardHeader className="p-6 border-b">
                     <div className="flex items-center gap-3">
                       <div className="bg-secondary/5 p-2.5 rounded-xl">
                         <History className="h-5 w-5 text-secondary" />
                       </div>
                       <div>
                         <CardTitle className="text-xs font-bold text-secondary uppercase tracking-tight">Manual Logs</CardTitle>
                       </div>
                     </div>
                   </CardHeader>
                   <CardContent className="p-0">
                     <div className="divide-y divide-slate-50 max-h-[460px] overflow-y-auto custom-scrollbar">
                       {filteredCash.length === 0 ? (
                         <div className="p-12 text-center text-slate-300 font-bold uppercase text-[10px] tracking-widest">
                           No logs
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
                  <CardTitle className="text-lg font-bold text-secondary uppercase tracking-tight">Invoice Explorer</CardTitle>
                </div>
                <div className="flex items-center gap-3">
                   <div className="relative w-full md:w-[320px]">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                     <Input 
                       placeholder="Search ID, Customer or Staff..." 
                       className="h-11 pl-11 bg-white border-slate-100 rounded-xl font-bold text-xs"
                       value={searchQuery}
                       onChange={(e) => setSearchQuery(e.target.value)}
                     />
                   </div>
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
                           No matching invoices
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
                             <p className="font-bold text-slate-900 text-sm">{sale.customerName || 'Walk-in'}</p>
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
        <DialogContent className="sm:max-w-md rounded-[32px] p-8 border-none shadow-2xl overflow-hidden print:hidden text-[9pt]">
          <div className="absolute top-0 left-0 w-full h-2 bg-secondary" />
          <DialogHeader className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-secondary/5 rounded-3xl flex items-center justify-center">
              <ShoppingBag className="h-8 w-8 text-secondary" />
            </div>
            <DialogTitle className="text-center text-xl font-bold uppercase tracking-tight text-secondary">Receipt Archive</DialogTitle>
          </DialogHeader>

          <div className="py-2 space-y-4">
            <div className="bg-slate-50 rounded-[24px] p-6 space-y-2 font-receipt border border-slate-200 leading-tight">
              <div className="flex flex-col border-b border-slate-100 pb-1 space-y-0.5">
                 <div className="flex justify-between items-center text-[8pt] font-bold">
                    <span className="text-slate-400 uppercase">Customer</span>
                    <span className="text-secondary">{viewingSale?.customerName || 'Walk-in'}</span>
                 </div>
                 <div className="flex justify-between items-center text-[8pt] font-bold">
                    <span className="text-slate-400 uppercase">Identity</span>
                    <span className="text-secondary">{viewingSale?.customerId || 'No Mobile'}</span>
                 </div>
                 <div className="flex justify-between items-center text-[8pt] font-bold">
                    <span className="text-slate-400 uppercase">DateTime</span>
                    <span className="text-secondary">{getFormattedDateTime(viewingSale?.timestamp)}</span>
                 </div>
              </div>

              <div className="py-2 border-b border-slate-100">
                <table className="w-full text-[8pt]">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left font-bold py-1 uppercase">Item</th>
                      <th className="text-right font-bold py-1 uppercase">Price</th>
                      <th className="text-center font-bold py-1 uppercase">Qty</th>
                      <th className="text-right font-bold py-1 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingSale?.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-0.5">{item.name}</td>
                        <td className="py-0.5 text-right">₹{item.price.toFixed(0)}</td>
                        <td className="py-0.5 text-center">{item.quantity}</td>
                        <td className="py-0.5 text-right">₹{(item.price * item.quantity).toFixed(0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-end pt-2">
                <div className="flex flex-col">
                   <span className="text-[8pt] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Final Amount</span>
                   <span className="text-3xl font-black text-slate-900 tracking-tighter">₹{viewingSale?.totalAmount.toFixed(0)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[7pt] font-bold text-slate-400 uppercase block tracking-widest">Served By</span>
                  <span className="text-[8pt] font-bold text-secondary uppercase">
                    {viewingSale?.staffName || 'System'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
               <Button onClick={handlePrintAction} variant="outline" className="h-14 rounded-2xl bg-white border-slate-100 font-bold uppercase text-[10px] gap-2">
                 <Printer className="h-4 w-4" /> Print
               </Button>
               <Button onClick={handlePrintAction} variant="outline" className="h-14 rounded-2xl bg-white border-slate-100 font-bold uppercase text-[10px] gap-2">
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

      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="sm:max-w-xl rounded-[40px] p-10 border-none shadow-2xl overflow-hidden print:hidden">
          <div className="absolute top-0 left-0 w-full h-3 bg-primary" />
          <DialogHeader className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/5 rounded-[24px] flex items-center justify-center">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-center text-2xl font-black uppercase tracking-tight text-secondary">Audit Report Summary</DialogTitle>
          </DialogHeader>

          <div className="py-6 space-y-8">
            <div className="grid grid-cols-2 gap-6">
               <div className="bg-slate-50 p-6 rounded-[28px] border border-slate-100">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Period Total</p>
                  <p className="text-3xl font-black text-secondary tracking-tighter">₹{stats.sales.toLocaleString()}</p>
               </div>
               <div className="bg-slate-50 p-6 rounded-[28px] border border-slate-100">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Invoices</p>
                  <p className="text-3xl font-black text-secondary tracking-tighter">{stats.transactions}</p>
               </div>
            </div>

            <div className="space-y-4">
               <h4 className="text-[10px] font-black uppercase text-primary tracking-[0.2em] px-1">Settlement Breakdown</h4>
               <div className="space-y-3">
                 {Object.entries(stats.paymentModes).map(([mode, amount]: any) => (
                   <div key={mode} className="flex justify-between items-center bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                      <span className="font-bold text-xs uppercase text-slate-600">{mode}</span>
                      <span className="font-black text-secondary">₹{amount.toLocaleString()}</span>
                   </div>
                 ))}
                 {Object.keys(stats.paymentModes).length === 0 && (
                   <p className="text-center text-slate-400 font-bold uppercase text-[10px] py-4">No transactions found for this period.</p>
                 )}
               </div>
            </div>
          </div>

          <DialogFooter className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="h-14 rounded-2xl font-bold uppercase text-[10px] tracking-widest bg-white border-slate-100" onClick={() => setIsReportOpen(false)}>
              Cancel
            </Button>
            <Button className="h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-secondary text-white gap-2 shadow-xl" onClick={handlePrintAction}>
              <Printer className="h-4 w-4" /> Print Audit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
