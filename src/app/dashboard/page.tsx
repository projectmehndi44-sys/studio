
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
  getYear
} from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { PhoneAuthGate } from '@/components/auth/phone-auth-gate';
import { isStaffAdmin } from '@/lib/staff';
import { AdminPinDialog } from '@/components/admin/admin-pin-dialog';

type DateFilter = 'today' | 'yesterday' | 'month' | 'last7' | 'all';

export default function DashboardPage() {
  const router = useRouter();
  const db = useFirestore();
  const { user, isUserLoading: isAuthLoading } = useUser();
  const [viewingSale, setViewingSale] = useState<PurchaseRecord | null>(null);
  const [isPrinterSelectionOpen, setIsPrinterSelectionOpen] = useState(false);
  const [printType, setPrintType] = useState<'normal' | 'thermal'>('normal');
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  
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
    if (!user || !isAdmin || !isAuthorized) return null;
    return query(collection(db, 'purchases'), orderBy('timestamp', 'desc'), limit(1000));
  }, [db, user, isAdmin, isAuthorized]);

  const cashQuery = useMemoFirebase(() => {
    if (!user || !isAdmin || !isAuthorized) return null;
    return query(collection(db, 'cashTransactions'), orderBy('timestamp', 'desc'), limit(500));
  }, [db, user, isAdmin, isAuthorized]);

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
        (s.staffName || '').toLowerCase().includes(q)
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
  }, [rawSales, rawCash, dateFilter, searchQuery, selectedMonth, selectedYear]);

  const getFormattedDateTime = (timestamp: any) => {
    if (!timestamp) return '--';
    if (timestamp.seconds) return format(new Date(timestamp.seconds * 1000), 'dd/MM/yyyy HH:mm');
    return format(new Date(timestamp), 'dd/MM/yyyy HH:mm');
  };

  if (isAuthLoading) return <div className="h-screen flex items-center justify-center">Analyzing Ledger...</div>;
  if (!user) return <PhoneAuthGate />;

  if (!isAdmin) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-8 bg-slate-50">
        <ShieldAlert className="h-12 w-12 text-primary mb-4" />
        <h1 className="text-2xl font-black uppercase text-secondary">Ledger Restricted</h1>
        <Link href="/"><Button className="mt-6 rounded-2xl h-14 px-8 bg-secondary text-white">Back to Terminal</Button></Link>
      </div>
    );
  }

  // Final PIN authorization check
  if (!isAuthorized) {
    return (
      <AdminPinDialog 
        isOpen={true} 
        onClose={() => router.push('/')} 
        onSuccess={() => setIsAuthorized(true)} 
        requiredFor="Access Business Ledger & Revenue Data" 
      />
    );
  }

  const { filteredSales, filteredCash, stats } = processedData;

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8 font-body">
      {/* UNIFIED PRINT RECEIPT */}
      <div className={cn(
        "hidden print-only p-4 bg-white text-slate-900 font-receipt min-h-screen text-[10pt] leading-normal",
        printType === 'thermal' ? 'print-thermal' : 'print-normal'
      )}>
        <div className="text-center border-b border-slate-900 pb-2 mb-2">
          <p className="text-[10pt] font-bold uppercase tracking-tight">KRISHNA'S</p>
          <h2 className="text-[12pt] font-black uppercase tracking-tight">SUPER 9+</h2>
          <p className="text-[8pt] font-bold mt-1">{shopAddress}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-2 text-[8pt]">
          <div className="space-y-0.5">
            <p className="font-bold">Bill ID: #{viewingSale?.id?.slice(-8) || 'ARCHIVE'}</p>
            <p className="font-bold">DateTime: {getFormattedDateTime(viewingSale?.timestamp)}</p>
          </div>
          <div className="space-y-0.5 text-right">
            <p className="font-bold">Cust: {viewingSale?.customerName || 'Walk-in'}</p>
            <p className="font-bold">Staff: {viewingSale?.staffName || 'System'}</p>
            <p className="font-bold">Mode: {viewingSale?.paymentMode || 'Cash'}</p>
          </div>
        </div>
        <table className="w-full text-[8pt] border-collapse mb-2 leading-normal">
          <thead>
            <tr className="border-y border-slate-900">
              <th className="text-left py-2 font-bold uppercase">Item</th>
              <th className="text-right py-2 font-bold uppercase">Price</th>
              <th className="text-center py-2 font-bold uppercase">Qty</th>
              <th className="text-right py-2 font-bold uppercase">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {viewingSale?.items.map((item, idx) => (
              <tr key={idx}>
                <td className="py-2">{item.name}</td>
                <td className="py-2 text-right">₹{item.price.toFixed(0)}</td>
                <td className="py-2 text-center">{item.quantity}</td>
                <td className="py-2 text-right">₹{(item.price * item.quantity).toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="space-y-1 text-right border-t border-slate-900 pt-2">
          <div className="flex justify-between items-center text-[10pt] font-bold uppercase">
            <span>Grand Total</span>
            <span>₹{viewingSale?.totalAmount.toFixed(0)}</span>
          </div>
        </div>
        <div className="mt-4 text-center space-y-1">
          <p className="text-[7pt] font-bold uppercase tracking-widest text-slate-400">
            Computer Generated Invoice • No Exchange without Bill
          </p>
          <p className="text-[9pt] font-bold">Thank you for shopping at Krishna's Super 9+!</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8 print:hidden">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <Link href="/">
              <Button variant="outline" size="icon" className="h-11 w-11 rounded-2xl bg-white border-none shadow-sm"><ArrowLeft className="h-5 w-5 text-secondary" /></Button>
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.2em]">KRISHNA'S</span>
              <span className="text-lg font-black tracking-tight uppercase text-secondary">SUPER 9+</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200">
               {(['today', 'yesterday', 'last7', 'month', 'all'] as const).map((filter) => (
                 <Button
                   key={filter}
                   variant={dateFilter === filter ? 'secondary' : 'ghost'}
                   onClick={() => setDateFilter(filter)}
                   className={cn("h-9 px-4 rounded-xl font-bold uppercase text-[10px]", dateFilter === filter && "bg-secondary text-white shadow-md")}
                 >
                   {filter}
                 </Button>
               ))}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <Card className="bg-white border-none shadow-sm rounded-[24px]">
                 <CardContent className="p-6">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filtered Revenue</p>
                   <h3 className="text-3xl font-bold mt-1 text-slate-900 tracking-tight">₹{stats.sales.toLocaleString()}</h3>
                 </CardContent>
               </Card>
               <Card className="bg-white border-none shadow-sm rounded-[24px]">
                 <CardContent className="p-6">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Invoices</p>
                   <h3 className="text-3xl font-bold mt-1 text-slate-900 tracking-tight">{stats.transactions}</h3>
                 </CardContent>
               </Card>
               <Card className="bg-secondary text-white border-none shadow-xl rounded-[24px]">
                 <CardContent className="p-6">
                   <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Net Cash Handled</p>
                   <h3 className="text-3xl font-bold mt-1 tracking-tight">₹{stats.cashInHand.toLocaleString()}</h3>
                 </CardContent>
               </Card>
            </div>

            <Card className="bg-white border-none shadow-sm rounded-[32px] overflow-hidden">
              <CardHeader className="p-8 border-b bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div><CardTitle className="text-lg font-bold text-secondary uppercase tracking-tight">Invoice Explorer</CardTitle></div>
                <div className="relative w-full md:w-[320px]">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input placeholder="Search ID, Customer..." className="h-11 pl-11 bg-white border-slate-100 rounded-xl font-bold text-xs" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="border-none">
                      <TableHead className="font-bold text-[10px] uppercase h-14 pl-8">Timestamp</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase h-14">Bill ID</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase h-14 text-right">Amount</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase h-14 text-right pr-8">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.map((sale) => (
                      <TableRow key={sale.id} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                        <TableCell className="pl-8">
                          <p className="font-bold text-slate-900 text-sm">{getFormattedDateTime(sale.timestamp)}</p>
                        </TableCell>
                        <TableCell><code className="text-[10px] font-bold text-secondary bg-secondary/5 px-2 py-1 rounded-lg uppercase">#{sale.id?.slice(-8)}</code></TableCell>
                        <TableCell className="text-right">
                          <p className="font-black text-slate-900 text-base">₹{sale.totalAmount.toLocaleString()}</p>
                          <p className="text-[9px] font-bold text-emerald-500 uppercase">{sale.paymentMode}</p>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <Button variant="ghost" size="sm" onClick={() => setViewingSale(sale)} className="h-9 font-bold text-[10px] uppercase gap-2 hover:bg-secondary hover:text-white transition-all rounded-xl">
                            <Eye className="h-4 w-4" /> View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-white border-none shadow-sm rounded-[24px] overflow-hidden">
              <CardHeader className="p-6 border-b"><CardTitle className="text-xs font-bold text-secondary uppercase">Manual Logs</CardTitle></CardHeader>
              <CardContent className="p-0 max-h-[500px] overflow-y-auto">
                {filteredCash.map((cf) => (
                  <div key={cf.id} className="p-4 flex items-center justify-between border-b border-slate-50">
                    <div className="flex items-center gap-3">
                       <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", cf.type === 'IN' ? "bg-emerald-50 text-emerald-500" : "bg-primary/5 text-primary")}>
                         {cf.type === 'IN' ? <PlusCircle className="h-4 w-4" /> : <MinusCircle className="h-4 w-4" />}
                       </div>
                       <div>
                         <p className="font-bold text-sm text-slate-900">₹{cf.amount}</p>
                         <p className="text-[8px] font-bold text-slate-400 uppercase">{cf.reason}</p>
                       </div>
                    </div>
                    <p className="text-[8px] font-bold text-slate-300">{format(new Date(cf.timestamp?.seconds * 1000 || Date.now()), 'HH:mm')}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={!!viewingSale} onOpenChange={(open) => !open && setViewingSale(null)}>
        <DialogContent className="sm:max-w-md rounded-[32px] p-8 border-none shadow-2xl overflow-hidden print:hidden text-[9pt]">
          <div className="absolute top-0 left-0 w-full h-2 bg-secondary" />
          <DialogHeader className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-secondary/5 rounded-3xl flex items-center justify-center"><ShoppingBag className="h-8 w-8 text-secondary" /></div>
            <DialogTitle className="text-center text-xl font-bold uppercase tracking-tight text-secondary">Receipt Archive</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-4">
            <div className="bg-slate-50 rounded-[24px] p-6 space-y-3 font-receipt border border-slate-200 leading-normal">
              <div className="flex flex-col border-b border-slate-100 pb-2 space-y-2">
                 <div className="flex justify-between items-center text-[8pt] font-bold">
                    <span className="text-slate-400 uppercase">Customer</span>
                    <span className="text-secondary">{viewingSale?.customerName || 'Walk-in'}</span>
                 </div>
                 <div className="flex justify-between items-center text-[8pt] font-bold">
                    <span className="text-slate-400 uppercase">DateTime</span>
                    <span className="text-secondary">{getFormattedDateTime(viewingSale?.timestamp)}</span>
                 </div>
              </div>
              <div className="py-3 border-b border-slate-100">
                <table className="w-full text-[8pt] leading-normal">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left font-bold py-2 uppercase">Item</th>
                      <th className="text-right font-bold py-2 uppercase">Price</th>
                      <th className="text-center font-bold py-2 uppercase">Qty</th>
                      <th className="text-right font-bold py-2 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingSale?.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2">{item.name}</td>
                        <td className="py-2 text-right">₹{item.price.toFixed(0)}</td>
                        <td className="py-2 text-center">{item.quantity}</td>
                        <td className="py-2 text-right">₹{(item.price * item.quantity).toFixed(0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between items-end pt-4">
                <div className="flex flex-col">
                   <span className="text-[8pt] font-bold text-slate-400 uppercase tracking-widest mb-1">Final Amount</span>
                   <span className="text-3xl font-black text-slate-900 tracking-tighter leading-none">₹{viewingSale?.totalAmount.toFixed(0)}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
               <Button onClick={() => setIsPrinterSelectionOpen(true)} variant="outline" className="h-14 rounded-2xl bg-white font-bold uppercase text-[10px] gap-2"><Printer className="h-4 w-4" /> Print</Button>
               <Button variant="outline" className="h-14 rounded-2xl bg-white font-bold uppercase text-[10px] gap-2"><Download className="h-4 w-4" /> PDF</Button>
            </div>
          </div>
          <DialogFooter><Button className="w-full h-14 rounded-2xl font-bold text-sm bg-secondary text-white" onClick={() => setViewingSale(null)}>CLOSE ARCHIVE</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPrinterSelectionOpen} onOpenChange={setIsPrinterSelectionOpen}>
        <DialogContent className="sm:max-w-md rounded-[32px] p-10 border-none shadow-2xl">
          <DialogHeader><DialogTitle className="text-2xl font-black uppercase text-secondary">Output Device</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-6">
            <button onClick={() => { setPrintType('normal'); setIsPrinterSelectionOpen(false); setTimeout(() => window.print(), 100); }} className="flex flex-col items-center justify-center h-40 bg-slate-50 rounded-[32px] hover:bg-secondary/5 group transition-all border-2 border-transparent hover:border-secondary/10">
              <div className="h-14 w-14 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4"><Printer className="h-6 w-6 text-slate-400 group-hover:text-secondary" /></div>
              <span className="font-bold text-[10px] uppercase tracking-widest">Normal (A4)</span>
            </button>
            <button onClick={() => { setPrintType('thermal'); setIsPrinterSelectionOpen(false); setTimeout(() => window.print(), 100); }} className="flex flex-col items-center justify-center h-40 bg-slate-50 rounded-[32px] hover:bg-primary/5 group transition-all border-2 border-transparent hover:border-primary/10">
              <div className="h-14 w-14 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4"><Printer className="h-6 w-6 text-slate-400 group-hover:text-primary" /></div>
              <span className="font-bold text-[10px] uppercase tracking-widest">Thermal (58/80mm)</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
