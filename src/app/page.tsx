"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { 
  ShoppingBag, 
  LayoutDashboard, 
  Menu,
  LogOut,
  PackageSearch,
  ShieldCheck,
  Banknote,
  PlusCircle,
  MinusCircle,
  CheckCircle2,
  Printer,
  Download,
  Settings,
  ChevronRight,
  Trash2,
  AlertTriangle,
  ScanLine,
  Monitor,
  Clock,
  Battery,
  Wifi,
  Package,
  ArrowRight,
  Zap
} from 'lucide-react';
import { Product, CartItem, PurchaseRecord } from '@/lib/types';
import { ProductSearch } from '@/components/pos/product-search';
import { CartList } from '@/components/pos/cart-list';
import { CheckoutPanel } from '@/components/pos/checkout-panel';
import { QuickTapGrid } from '@/components/pos/quick-tap-grid';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import Link from 'next/link';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { 
  useCollection, 
  useFirestore, 
  useUser, 
  useMemoFirebase, 
  addDocumentNonBlocking, 
  useAuth,
  useDoc,
  setDocumentNonBlocking,
  deleteDocumentNonBlocking,
  updateDocumentNonBlocking
} from '@/firebase';
import { collection, serverTimestamp, doc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AdminPinDialog } from '@/components/admin/admin-pin-dialog';
import { BarcodeScanner } from '@/components/pos/barcode-scanner';
import { format } from 'date-fns';
import { PhoneAuthGate } from '@/components/auth/phone-auth-gate';
import { getStaffName, isStaffAdmin } from '@/lib/staff';

const CART_STORAGE_KEY = 'super9_pos_current_cart';

export default function POSPage() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const db = useFirestore();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCashDialogOpen, setIsCashDialogOpen] = useState(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isPrinterSelectionOpen, setIsPrinterSelectionOpen] = useState(false);
  const [printType, setPrintType] = useState<'normal' | 'thermal'>('normal');
  const [lastSale, setLastSale] = useState<PurchaseRecord | null>(null);
  const [activeMainTab, setActiveMainTab] = useState('products');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [launcherActive, setLauncherActive] = useState(false);

  const [purgeOptions, setPurgeOptions] = useState({
    inventory: false,
    sales: false,
    cash: false
  });

  const searchInputRef = useRef<HTMLInputElement>(null);

  const staffName = getStaffName(user?.phoneNumber || null);
  const isAdmin = useMemo(() => isStaffAdmin(user?.phoneNumber || null), [user]);

  const settingsRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, 'settings', 'config');
  }, [db, user]);
  
  const { data: shopSettings } = useDoc(settingsRef);

  const shopName = shopSettings?.shopName || "KRISHNA'S SUPER 9+";
  const shopAddress = shopSettings?.address || "Hoolungooree, Mariani";
  const shopGSTIN = shopSettings?.gstin || "";
  const isLauncherEnabled = !!shopSettings?.launcherMode;

  const salesQuery = useMemoFirebase(() => collection(db, 'purchases'), [db]);
  const { data: salesData } = useCollection(salesQuery);
  const todaySales = useMemo(() => {
    if (!salesData) return 0;
    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);
    return salesData
      .filter(s => s.timestamp?.seconds && new Date(s.timestamp.seconds * 1000) >= startOfToday)
      .reduce((acc, s) => acc + (s.totalAmount || 0), 0);
  }, [salesData]);

  const productsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(db, 'products');
  }, [db, user]);

  const { data: productsData } = useCollection<Product>(productsQuery);

  const lowStockCount = useMemo(() => {
    if (!productsData) return 0;
    return productsData.filter(p => typeof p.stock === 'number' && p.stock < 10 && p.stock >= 0).length;
  }, [productsData]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = async (enable: boolean) => {
    try {
      if (enable) {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
      } else {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        }
      }
    } catch (e) {
      console.warn("Fullscreen toggle failed", e);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.altKey && e.code === 'Space') {
        e.preventDefault();
        setIsCashDialogOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to load saved cart", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  const cartTotalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const handleProductSelect = useCallback((product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setTimeout(() => searchInputRef.current?.focus(), 50);
  }, []);

  const handleBarcodeScan = (barcode: string) => {
    if (!productsData) return;
    
    const product = productsData.find(p => p.barcode === barcode);
    if (product) {
      handleProductSelect(product);
      // Removed setIsScannerOpen(false) for Continuous Scanning
      toast({
        title: "Added",
        description: `${product.name} (Scan OK)`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Unknown",
        description: `Code: ${barcode}`,
      });
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const updatePrice = (id: string, newPrice: number) => {
    setCartItems(prev => prev.map(item => 
      item.id === id ? { ...item, price: newPrice, isCustomPrice: true } : item
    ));
  };

  const removeItem = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const handleCheckout = async (data: any) => {
    const saleId = `sale-${Date.now()}`;
    const saleData: PurchaseRecord = {
      id: saleId,
      staffId: user?.uid || 'anonymous',
      staffName: staffName,
      timestamp: new Date(),
      items: cartItems.map(i => ({ id: i.id, name: i.name, quantity: i.quantity, price: i.price })),
      totalAmount: data.total,
      subtotalAmount: cartItems.reduce((acc, i) => acc + (i.price * i.quantity), 0),
      discountAmount: data.discount || 0,
      paymentMode: data.paymentMode || 'Cash',
      isOfflineSale: false,
      customerId: data.customerPhone || null,
      customerName: data.customerName || null
    };

    addDocumentNonBlocking(collection(db, 'purchases'), {
      ...saleData,
      timestamp: serverTimestamp()
    });

    cartItems.forEach(item => {
      const sourceProduct = productsData?.find(p => p.id === item.id);
      if (sourceProduct && typeof sourceProduct.stock === 'number') {
        const remainingStock = sourceProduct.stock - item.quantity;
        updateDocumentNonBlocking(doc(db, 'products', item.id), {
          stock: remainingStock,
          updatedAt: new Date().toISOString()
        });
      }
    });

    setLastSale(saleData);
    setCartItems([]);
    setActiveMainTab('products');
    setIsSuccessDialogOpen(true);
  };

  const handlePrintRequest = (type: 'normal' | 'thermal') => {
    setPrintType(type);
    setIsPrinterSelectionOpen(false);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleAddNewProduct = (name: string) => {
    if (!isAdmin) {
      toast({
        variant: "destructive",
        title: "Access Restricted",
        description: "Only Admin/Owner can add new items to catalog."
      });
      return;
    }

    const newId = `prod-${Date.now()}`;
    const newProd: Product = {
      id: newId,
      name,
      price: 0,
      costPrice: 0,
      barcode: '',
      category: 'General',
      isPopular: false
    };
    
    addDocumentNonBlocking(collection(db, 'products'), {
      ...newProd,
      isActive: true,
      createdAt: new Date().toISOString()
    });

    handleProductSelect(newProd);
  };

  const handleCashTransaction = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = parseFloat(formData.get('amount') as string);
    const type = formData.get('type') as 'IN' | 'OUT';
    const reason = formData.get('reason') as string;

    if (isNaN(amount) || amount <= 0) return;

    addDocumentNonBlocking(collection(db, 'cashTransactions'), {
      staffId: user?.uid || 'anonymous',
      staffName: staffName,
      timestamp: serverTimestamp(),
      amount,
      type,
      reason: reason || (type === 'IN' ? 'Drawer Float' : 'Misc Withdrawal'),
    });

    setIsCashDialogOpen(false);
    toast({
      title: `Cash ${type} Recorded`,
      description: `₹${amount} synced to ledger.`,
    });
  };

  const handleUpdateShopSettings = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      shopName: formData.get('shopName') as string,
      address: formData.get('address') as string,
      gstin: formData.get('gstin') as string,
      phone: formData.get('phone') as string,
    };

    setDocumentNonBlocking(doc(db, 'settings', 'config'), data, { merge: true });
    setIsSettingsOpen(false);
    toast({ title: "Profile Updated", description: "Shop details saved successfully." });
  };

  const handlePurgeData = async () => {
    if (!purgeOptions.inventory && !purgeOptions.sales && !purgeOptions.cash) {
      toast({ variant: "destructive", title: "Selection Required", description: "Select at least one database." });
      return;
    }
    setIsPinDialogOpen(true);
  };

  const onPurgeConfirmed = async () => {
    setIsPinDialogOpen(false);
    const collectionsToPurge = [];
    if (purgeOptions.inventory) collectionsToPurge.push('products');
    if (purgeOptions.sales) collectionsToPurge.push('purchases');
    if (purgeOptions.cash) collectionsToPurge.push('cashTransactions');
    
    for (const colName of collectionsToPurge) {
      const q = query(collection(db, colName));
      const snapshot = await getDocs(q);
      snapshot.forEach((d) => {
        deleteDocumentNonBlocking(doc(db, colName, d.id));
      });
    }
    
    setIsSettingsOpen(false);
    toast({ variant: "destructive", title: "Sync Complete", description: "Records wiped." });
    setPurgeOptions({ inventory: false, sales: false, cash: false });
  };

  if (isUserLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <p className="text-slate-400 font-bold animate-pulse uppercase tracking-[0.2em] text-[10px]">Booting Terminal...</p>
      </div>
    );
  }

  if (!user) {
    return <PhoneAuthGate />;
  }

  if (isLauncherEnabled && !launcherActive) {
    return (
      <div className="h-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-white relative overflow-hidden font-body">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926')] bg-cover opacity-10" />
        <div className="z-10 text-center space-y-12 max-w-4xl w-full animate-in fade-in zoom-in-95 duration-700">
          <div className="space-y-4">
            <h1 className="text-8xl font-black tracking-tighter uppercase leading-none">{format(currentTime, 'HH:mm')}</h1>
            <p className="text-2xl font-bold text-primary uppercase tracking-[0.3em]">{format(currentTime, 'EEEE, dd MMMM')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[40px] border border-white/10 text-left space-y-2">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Today's Revenue</p>
              <p className="text-4xl font-black tracking-tighter">₹{todaySales.toLocaleString()}</p>
            </div>
            <div className={cn(
              "bg-white/5 backdrop-blur-xl p-8 rounded-[40px] border border-white/10 text-left space-y-2",
              lowStockCount > 0 ? "border-primary/50" : ""
            )}>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                {lowStockCount > 0 ? 'Stock Alerts' : 'Active System'}
              </p>
              <p className={cn("text-4xl font-black tracking-tighter", lowStockCount > 0 ? "text-primary" : "")}>
                {lowStockCount > 0 ? `${lowStockCount} Low` : 'SUPER 9+'}
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[40px] border border-white/10 text-left space-y-2">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Staff Duty</p>
              <p className="text-4xl font-black tracking-tighter truncate">{staffName}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <button 
              onClick={() => { setLauncherActive(true); toggleFullscreen(true); }}
              className="group bg-primary p-10 rounded-[48px] flex flex-col items-center justify-center gap-4 transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-primary/20"
            >
              <ShoppingBag className="h-12 w-12 text-white" />
              <span className="font-black uppercase text-xs tracking-widest">Terminal</span>
            </button>
            {isAdmin && (
              <Link href="/dashboard" className="group bg-white/5 p-10 rounded-[48px] flex flex-col items-center justify-center gap-4 transition-all hover:bg-white/10 hover:scale-105 active:scale-95 border border-white/10">
                <LayoutDashboard className="h-12 w-12 text-white" />
                <span className="font-black uppercase text-xs tracking-widest">Ledger</span>
              </Link>
            )}
            {isAdmin && (
              <Link href="/inventory" className="group bg-white/5 p-10 rounded-[48px] flex flex-col items-center justify-center gap-4 transition-all hover:bg-white/10 hover:scale-105 active:scale-95 border border-white/10">
                <PackageSearch className="h-12 w-12 text-white" />
                <span className="font-black uppercase text-xs tracking-widest">Inventory</span>
              </Link>
            )}
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="group bg-white/5 p-10 rounded-[48px] flex flex-col items-center justify-center gap-4 transition-all hover:bg-white/10 hover:scale-105 active:scale-95 border border-white/10"
            >
              <Settings className="h-12 w-12 text-white" />
              <span className="font-black uppercase text-xs tracking-widest">System</span>
            </button>
          </div>

          <div className="pt-12 flex items-center justify-center gap-12 text-white/40">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4" /> <span className="text-[10px] font-bold uppercase">Connected</span>
            </div>
            <div className="flex items-center gap-2">
              <Battery className="h-4 w-4" /> <span className="text-[10px] font-bold uppercase">Normal</span>
            </div>
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4" /> <span className="text-[10px] font-bold uppercase">Launch Mode Enabled</span>
            </div>
          </div>
        </div>

        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogContent className="rounded-[48px] p-12 sm:max-w-md bg-slate-900 text-white border-white/10 shadow-3xl">
            <DialogHeader>
              <DialogTitle className="text-3xl font-black uppercase tracking-tight text-white">System Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-8 py-8">
               <div className="flex items-center justify-between bg-white/5 p-6 rounded-[32px] border border-white/10">
                  <div className="space-y-1">
                    <p className="font-black uppercase text-xs tracking-widest">Launch Mode</p>
                    <p className="text-[10px] font-bold text-slate-400">App acts as the operating system</p>
                  </div>
                  <Switch 
                    checked={isLauncherEnabled} 
                    onCheckedChange={(val) => setDocumentNonBlocking(doc(db, 'settings', 'config'), { launcherMode: val }, { merge: true })}
                  />
               </div>
               <Button onClick={() => auth.signOut()} variant="destructive" className="w-full h-16 rounded-[24px] font-black uppercase text-xs tracking-[0.2em]">Shutdown System</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  const getFormattedDateTime = (timestamp: any) => {
    if (!timestamp) return format(new Date(), 'dd/MM/yyyy HH:mm');
    if (timestamp.seconds) return format(new Date(timestamp.seconds * 1000), 'dd/MM/yyyy HH:mm');
    return format(new Date(timestamp), 'dd/MM/yyyy HH:mm');
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50/50 overflow-hidden text-slate-900 font-body">
      <Toaster />
      
      <div className={cn(
        "hidden print-only p-4 bg-white text-slate-900 min-h-screen font-receipt text-[10pt] leading-normal",
        printType === 'thermal' ? 'print-thermal' : 'print-normal'
      )}>
        <div className="text-center border-b border-slate-900 pb-2 mb-2">
          <p className="text-[10pt] font-bold uppercase tracking-tight">KRISHNA'S</p>
          <h2 className="text-[10pt] font-black uppercase tracking-tight">SUPER 9+</h2>
          <p className="text-[8pt] font-bold mt-1">{shopAddress}</p>
          {shopGSTIN && <p className="text-[8pt] font-bold">GSTIN: {shopGSTIN}</p>}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-2 text-[8pt] leading-normal">
          <div className="space-y-0.5">
            <p className="font-bold">Bill ID: #{lastSale?.id?.slice(-8) || Date.now().toString().slice(-8)}</p>
            <p className="font-bold">DateTime: {getFormattedDateTime(lastSale?.timestamp)}</p>
          </div>
          <div className="space-y-0.5 text-right">
            <p className="font-bold">Cust: {lastSale?.customerName || 'Walk-in'}</p>
            <p className="font-bold">Mob: {lastSale?.customerId || 'No Mobile'}</p>
            <p className="font-bold">Staff: {lastSale?.staffName || staffName}</p>
            <p className="font-bold">Mode: {lastSale?.paymentMode || 'Cash'}</p>
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
            {lastSale?.items.map((item, idx) => (
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
          <div className="flex justify-between items-center text-[8pt]">
            <span className="font-bold uppercase">Subtotal</span>
            <span>₹{lastSale?.subtotalAmount?.toFixed(0) || lastSale?.totalAmount?.toFixed(0)}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-400">
            <span className="text-[10pt] font-bold uppercase">Grand Total</span>
            <span className="text-[10pt] font-bold">₹{lastSale?.totalAmount.toFixed(0)}</span>
          </div>
        </div>

        <div className="mt-4 text-center space-y-1">
          <p className="text-[7pt] font-bold uppercase tracking-widest text-slate-400">
            Computer Generated Invoice • No Exchange without Bill
          </p>
          <p className="text-[9pt] font-bold">Thank you for shopping at Krishna's Super 9+!</p>
        </div>
      </div>

      <header className="h-16 border-b border-slate-100 bg-white flex items-center justify-between px-8 shrink-0 print:hidden z-10">
        <div className="flex items-center gap-6">
           {isLauncherEnabled && (
             <Button variant="ghost" onClick={() => { setLauncherActive(false); toggleFullscreen(false); }} className="h-10 w-10 p-0 rounded-xl bg-slate-50 text-secondary">
               <Monitor className="h-5 w-5" />
             </Button>
           )}
           <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.1em]">KRISHNA'S</span>
              <span className="text-lg font-black tracking-tight uppercase text-secondary">SUPER 9+</span>
           </div>
           <div className="h-4 w-px bg-slate-200 mx-2" />
           <div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Billing Desk</h2>
           </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-4 mr-4">
             <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-secondary">{format(currentTime, 'HH:mm')}</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{format(currentTime, 'EEE, dd MMM')}</p>
             </div>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsCashDialogOpen(true)}
            className="rounded-xl font-bold text-[10px] uppercase gap-2 bg-slate-50 text-slate-600 border-none hover:bg-slate-100 h-10 px-4"
          >
            <Banknote className="h-4 w-4" /> Cash Flow
          </Button>
          
          {isAdmin && (
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="h-10 px-4 rounded-xl font-bold text-[10px] uppercase tracking-wider text-slate-500 hover:text-secondary gap-2">
                <LayoutDashboard className="h-4 w-4" /> Ledger
              </Button>
            </Link>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-50 transition-all">
                <Menu className="h-5 w-5 text-slate-600" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[340px] p-8 space-y-8 border-none shadow-2xl rounded-l-[40px]">
              <SheetHeader>
                <SheetTitle className="text-left font-black uppercase tracking-tight text-2xl text-secondary">Terminal Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-3">
                <Link href="/" className="flex items-center justify-between p-4 bg-secondary/5 text-secondary rounded-2xl font-bold uppercase text-xs">
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="h-5 w-5" /> Billing Desk
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </Link>
                
                {isAdmin && (
                  <>
                    <Link href="/inventory" className="flex items-center justify-between p-4 hover:bg-slate-50 text-slate-600 rounded-2xl font-bold uppercase text-xs transition-all w-full text-left">
                      <div className="flex items-center gap-3">
                        <PackageSearch className="h-5 w-5" /> Stock Master
                      </div>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                    <button onClick={() => setIsSettingsOpen(true)} className="flex items-center justify-between p-4 hover:bg-slate-50 text-slate-600 rounded-2xl font-bold uppercase text-xs transition-all w-full text-left">
                      <div className="flex items-center gap-3">
                        <Settings className="h-5 w-5" /> Shop Profile
                      </div>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </>
                )}

                <div className="pt-8 mt-4 border-t border-slate-100">
                  <div className="mb-4 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Session</p>
                    <p className="text-xs font-black text-secondary uppercase">{staffName}</p>
                  </div>
                  <Button onClick={() => auth.signOut()} variant="destructive" className="w-full h-14 font-bold rounded-2xl gap-3 text-xs uppercase tracking-widest shadow-lg shadow-destructive/10">
                    <LogOut className="h-5 w-5" /> EXIT TERMINAL
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className={cn("flex-1 overflow-hidden print:hidden", !isMobile ? "grid grid-cols-[1fr_420px] h-full" : "flex flex-col")}>
        {!isMobile ? (
          <>
            <div className="flex flex-col h-full p-8 overflow-hidden gap-8 bg-white/40 border-r border-slate-100">
              <div className="grid grid-cols-1 gap-6">
                <ProductSearch 
                  inputRef={searchInputRef}
                  products={productsData || []} 
                  onProductSelect={handleProductSelect} 
                  onScanClick={() => setIsScannerOpen(true)} 
                  onAddNewProduct={handleAddNewProduct} 
                />
                <div className="h-[200px] shrink-0">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="h-4 w-4 text-primary fill-primary" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary">Quick Tap Sellers</h3>
                  </div>
                  <QuickTapGrid products={productsData || []} onProductSelect={handleProductSelect} />
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <CartList items={cartItems} onUpdateQuantity={updateQuantity} onUpdatePrice={updatePrice} onRemoveItem={removeItem} />
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow-[-20px_0_40px_rgba(0,0,0,0.02)] z-0">
              <CheckoutPanel items={cartItems} onComplete={handleCheckout} />
            </div>
          </>
        ) : (
          <div className="flex flex-col h-full overflow-hidden p-4 gap-4">
            <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-2 bg-slate-100 rounded-2xl p-1 mb-4 h-14">
                <TabsTrigger value="products" className="font-bold text-[10px] uppercase rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">Catalog</TabsTrigger>
                <TabsTrigger value="checkout" className="font-bold text-[10px] uppercase rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm" disabled={cartItems.length === 0}>
                  Bill ({cartTotalItems})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="products" className="flex-1 overflow-hidden mt-0 flex flex-col gap-4">
                <ProductSearch 
                  inputRef={searchInputRef}
                  products={productsData || []} 
                  onProductSelect={handleProductSelect} 
                  onScanClick={() => setIsScannerOpen(true)} 
                  onAddNewProduct={handleAddNewProduct} 
                />
                <QuickTapGrid products={productsData || []} onProductSelect={handleProductSelect} />
                <CartList items={cartItems} onUpdateQuantity={updateQuantity} onUpdatePrice={updatePrice} onRemoveItem={removeItem} />
              </TabsContent>
              
              <TabsContent value="checkout" className="flex-1 overflow-hidden mt-0">
                <CheckoutPanel items={cartItems} onComplete={handleCheckout} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>

      <Dialog open={isPrinterSelectionOpen} onOpenChange={setIsPrinterSelectionOpen}>
        <DialogContent className="sm:max-w-md rounded-[32px] p-10 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight text-secondary">Output Device</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-6">
            <button
              onClick={() => handlePrintRequest('normal')}
              className="flex flex-col items-center justify-center h-40 bg-slate-50 rounded-[32px] hover:bg-secondary/5 hover:text-secondary transition-all group border-2 border-transparent hover:border-secondary/10"
            >
              <div className="h-14 w-14 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Printer className="h-6 w-6 text-slate-400 group-hover:text-secondary" />
              </div>
              <span className="font-bold text-[10px] uppercase tracking-widest">Normal (A4/Desk)</span>
            </button>
            <button
              onClick={() => handlePrintRequest('thermal')}
              className="flex flex-col items-center justify-center h-40 bg-slate-50 rounded-[32px] hover:bg-primary/5 hover:text-primary transition-all group border-2 border-transparent hover:border-primary/10"
            >
              <div className="h-14 w-14 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Printer className="h-6 w-6 text-slate-400 group-hover:text-primary" />
              </div>
              <span className="font-bold text-[10px] uppercase tracking-widest">Thermal (58/80mm)</span>
            </button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsPrinterSelectionOpen(false)} className="font-bold h-12 w-full rounded-xl uppercase text-[10px] tracking-widest">Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
        <DialogContent className="sm:max-w-md rounded-[40px] p-10 border-none shadow-2xl overflow-hidden print:hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
          <DialogHeader className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/5 rounded-[24px] flex items-center justify-center">
              <ScanLine className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-center text-xl font-black uppercase tracking-tight text-secondary leading-none">Continuous Super Scanner</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <BarcodeScanner isOpen={isScannerOpen} onScanSuccess={handleBarcodeScan} />
          </div>

          <DialogFooter>
            <Button 
              variant="secondary"
              className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest"
              onClick={() => setIsScannerOpen(false)}
            >
              Finish Scanning
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-[40px] p-10 border-none shadow-2xl overflow-hidden print:hidden text-[9pt]">
          <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500" />
          <DialogHeader className="space-y-4">
            <div className="mx-auto w-20 h-20 bg-emerald-50 rounded-[32px] flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            </div>
            <DialogTitle className="text-center text-2xl font-black uppercase tracking-tight text-secondary leading-none">Bill Synced</DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="bg-slate-50 rounded-[28px] p-6 space-y-3 font-receipt border border-slate-200 leading-normal">
              <div className="flex flex-col border-b border-slate-100 pb-2 space-y-2">
                 <div className="flex justify-between items-center text-[8pt] font-bold">
                    <span className="text-slate-400 uppercase">Customer</span>
                    <span className="text-secondary">{lastSale?.customerName || 'Walk-in'}</span>
                 </div>
                 <div className="flex justify-between items-center text-[8pt] font-bold">
                    <span className="text-slate-400 uppercase">Identity</span>
                    <span className="text-secondary">{lastSale?.customerId || 'No Mobile'}</span>
                 </div>
                 <div className="flex justify-between items-center text-[8pt] font-bold">
                    <span className="text-slate-400 uppercase">DateTime</span>
                    <span className="text-secondary">{getFormattedDateTime(lastSale?.timestamp)}</span>
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
                    {lastSale?.items.map((item, idx) => (
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
                   <span className="text-3xl font-black text-slate-900 tracking-tighter leading-none">₹{lastSale?.totalAmount.toFixed(0)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[7pt] font-bold text-slate-400 uppercase block tracking-widest">Served By</span>
                  <span className="text-[8pt] font-bold text-emerald-500 uppercase">
                    {lastSale?.staffName || staffName}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
               <Button variant="outline" className="h-14 rounded-2xl bg-white border-slate-100 font-bold uppercase text-[10px] gap-2 hover:bg-secondary hover:text-white transition-all" onClick={() => setIsPrinterSelectionOpen(true)}>
                 <Printer className="h-4 w-4" /> Print
               </Button>
               <Button variant="outline" className="h-14 rounded-2xl bg-white border-slate-100 font-bold uppercase text-[10px] gap-2 hover:bg-secondary hover:text-white transition-all" onClick={() => {}}>
                 <Download className="h-4 w-4" /> PDF
               </Button>
            </div>
          </div>

          <DialogFooter>
            <Button 
              className="w-full h-16 rounded-2xl font-black text-sm shadow-xl bg-primary hover:bg-primary/95 text-white uppercase tracking-widest"
              onClick={() => {
                setIsSuccessDialogOpen(false);
                setTimeout(() => searchInputRef.current?.focus(), 100);
              }}
            >
              NEXT (ESC)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCashDialogOpen} onOpenChange={setIsCashDialogOpen}>
        <DialogContent className="rounded-[32px] p-10 sm:max-w-md print:hidden border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight text-secondary">Register Adjust</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCashTransaction} className="space-y-8 py-6">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <input type="radio" id="cash-in" name="type" value="IN" defaultChecked className="peer hidden" />
                  <label htmlFor="cash-in" className="flex flex-col items-center justify-center h-24 rounded-2xl bg-slate-50 border-2 border-transparent peer-checked:border-emerald-500 peer-checked:bg-emerald-50 transition-all cursor-pointer">
                    <PlusCircle className="h-7 w-7 text-emerald-500 mb-2" />
                    <span className="font-bold text-[10px] uppercase tracking-widest">Cash In</span>
                  </label>
                </div>
                <div className="relative">
                  <input type="radio" id="cash-out" name="type" value="OUT" className="peer hidden" />
                  <label htmlFor="cash-out" className="flex flex-col items-center justify-center h-24 rounded-2xl bg-slate-50 border-2 border-transparent peer-checked:border-primary peer-checked:bg-primary/5 transition-all cursor-pointer">
                    <MinusCircle className="h-7 w-7 text-primary mb-2" />
                    <span className="font-bold text-[10px] uppercase tracking-widest">Cash Out</span>
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Value (₹)</Label>
                <Input name="amount" type="number" required placeholder="0.00" className="h-16 text-4xl font-black bg-slate-50 border-none rounded-2xl px-6" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Reference</Label>
                <Input name="reason" placeholder="Vendor, Float etc." className="h-14 font-bold bg-slate-50 border-none rounded-2xl px-6 text-sm" />
              </div>
            </div>
            <DialogFooter className="gap-3">
              <Button type="submit" className="w-full rounded-2xl font-black h-14 text-xs uppercase bg-secondary text-white">Commit Adjust</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="rounded-[32px] p-10 sm:max-w-md border-none shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight text-secondary">Shop Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-8 py-6">
            <form onSubmit={handleUpdateShopSettings} className="space-y-6">
               <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Shop Identity</Label>
                    <Input name="shopName" defaultValue={shopName} required className="h-12 bg-slate-50 border-none rounded-xl font-bold text-sm" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Physical Address</Label>
                    <Input name="address" defaultValue={shopAddress} required className="h-12 bg-slate-50 border-none rounded-xl font-bold text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">GSTIN</Label>
                      <Input name="gstin" defaultValue={shopGSTIN} className="h-12 bg-slate-50 border-none rounded-xl font-bold text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Support No.</Label>
                      <Input name="phone" defaultValue={shopSettings?.phone || ''} className="h-12 bg-slate-50 border-none rounded-xl font-bold text-sm" />
                    </div>
                  </div>
               </div>
               
               <div className="flex items-center justify-between bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <div className="space-y-1">
                    <p className="font-bold text-xs uppercase text-secondary">Launcher Mode</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Act as Tablet OS Dashboard</p>
                  </div>
                  <Switch 
                    checked={isLauncherEnabled} 
                    onCheckedChange={(val) => setDocumentNonBlocking(doc(db, 'settings', 'config'), { launcherMode: val }, { merge: true })}
                  />
               </div>

               <Button type="submit" className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest bg-secondary text-white">SAVE PROFILE</Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <AdminPinDialog 
        isOpen={isPinDialogOpen} 
        onClose={() => setIsPinDialogOpen(false)} 
        onSuccess={onPurgeConfirmed}
        requiredFor="Authorize Database Purge"
      />
    </div>
  );
}
