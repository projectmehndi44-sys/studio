
"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { 
  ShoppingBag, 
  LayoutDashboard, 
  Menu,
  LogOut,
  PackageSearch,
  Banknote,
  PlusCircle,
  MinusCircle,
  CheckCircle2,
  Printer,
  Download,
  Settings,
  ChevronRight,
  ScanLine,
  Monitor,
  Battery,
  Wifi,
  Zap,
  FastForward,
  AlertTriangle,
  Clock
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
  updateDocumentNonBlocking
} from '@/firebase';
import { collection, serverTimestamp, doc } from 'firebase/firestore';
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
import { BarcodeScanner } from '@/components/pos/barcode-scanner';
import { SystemSettingsDialog } from '@/components/settings/system-settings-dialog';
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
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isPrinterSelectionOpen, setIsPrinterSelectionOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [printType, setPrintType] = useState<'normal' | 'thermal'>('normal');
  const [lastSale, setLastSale] = useState<PurchaseRecord | null>(null);
  const [activeMainTab, setActiveMainTab] = useState('products');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [launcherActive, setLauncherActive] = useState(false);

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
  const isLauncherEnabled = !!shopSettings?.launcherMode;

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

  // Auto-Focus Engine
  useEffect(() => {
    if (!isUserLoading && user && (!isLauncherEnabled || launcherActive)) {
      searchInputRef.current?.focus();
    }
  }, [isUserLoading, user, launcherActive, isLauncherEnabled, isSuccessDialogOpen, isCashDialogOpen, isScannerOpen]);

  const toggleFullscreen = async (enable: boolean) => {
    try {
      if (enable && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else if (!enable && document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (e) { console.warn(e); }
  };

  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try { setCartItems(JSON.parse(savedCart)); } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  const cartTotalPrice = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleProductSelect = useCallback((product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
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
      toast({ title: "Added", description: `${product.name} (Scan OK)` });
    } else {
      toast({ variant: "destructive", title: "Unknown Barcode", description: barcode });
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCartItems(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  };

  const updatePrice = (id: string, newPrice: number) => {
    setCartItems(prev => prev.map(item => item.id === id ? { ...item, price: newPrice, isCustomPrice: true } : item));
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
      subtotalAmount: data.total,
      discountAmount: 0,
      paymentMode: data.paymentMode || 'Cash',
      isOfflineSale: false,
      customerId: data.customerPhone || null,
      customerName: data.customerName || null
    };

    addDocumentNonBlocking(collection(db, 'purchases'), { ...saleData, timestamp: serverTimestamp() });

    // Logical Inventory Sync
    cartItems.forEach(item => {
      const sourceProduct = productsData?.find(p => p.id === item.id);
      if (sourceProduct && typeof sourceProduct.stock === 'number') {
        updateDocumentNonBlocking(doc(db, 'products', item.id), {
          stock: sourceProduct.stock - item.quantity,
          updatedAt: new Date().toISOString()
        });
      }
    });

    setLastSale(saleData);
    setCartItems([]);
    setIsSuccessDialogOpen(true);
  };

  const handleFastPay = () => {
    if (cartItems.length === 0) return;
    handleCheckout({ total: cartTotalPrice, paymentMode: 'Cash', customerName: 'Walk-in (Exact Cash)' });
  };

  const handleAddNewProduct = (name: string, isSilent?: boolean) => {
    const newId = `prod-${Date.now()}`;
    const newProd: Product = {
      id: newId,
      name,
      price: 0,
      costPrice: 0,
      barcode: '',
      category: 'General',
      isPopular: false,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    
    addDocumentNonBlocking(collection(db, 'products'), newProd);
    handleProductSelect(newProd);
    if (!isSilent) toast({ title: "Quick Enrolled", description: `Added ${name} to master.` });
  };

  const getFormattedDateTime = (ts: any) => {
    const d = ts?.seconds ? new Date(ts.seconds * 1000) : (ts instanceof Date ? ts : new Date());
    return format(d, 'dd/MM/yyyy HH:mm');
  };

  if (isUserLoading) return <div className="h-screen flex items-center justify-center bg-white"><p className="text-slate-400 font-bold animate-pulse text-[10px] tracking-[0.2em]">BOOTING TERMINAL...</p></div>;
  if (!user) return <PhoneAuthGate />;

  // System Launcher Mode
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
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Active Staff</p>
              <p className="text-4xl font-black tracking-tighter truncate">{staffName}</p>
            </div>
            <div className={cn("bg-white/5 backdrop-blur-xl p-8 rounded-[40px] border border-white/10 text-left space-y-2", lowStockCount > 0 && "border-primary/50")}>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{lowStockCount > 0 ? 'Stock Alerts' : 'System Status'}</p>
              <p className={cn("text-4xl font-black tracking-tighter", lowStockCount > 0 && "text-primary")}>{lowStockCount > 0 ? `${lowStockCount} Low` : 'Active'}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[40px] border border-white/10 text-left space-y-2">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Session Status</p>
              <p className="text-4xl font-black tracking-tighter">SECURED</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <button onClick={() => { setLauncherActive(true); toggleFullscreen(true); }} className="group bg-primary p-10 rounded-[48px] flex flex-col items-center justify-center gap-4 transition-all hover:scale-105 shadow-2xl">
              <ShoppingBag className="h-12 w-12 text-white" /><span className="font-black uppercase text-xs">Terminal</span>
            </button>
            <Link href="/dashboard" className="bg-white/5 p-10 rounded-[48px] flex flex-col items-center justify-center gap-4 hover:bg-white/10 border border-white/10">
              <LayoutDashboard className="h-12 w-12 text-white" /><span className="font-black uppercase text-xs">Ledger</span>
            </Link>
            <Link href="/inventory" className="bg-white/5 p-10 rounded-[48px] flex flex-col items-center justify-center gap-4 hover:bg-white/10 border border-white/10">
              <PackageSearch className="h-12 w-12 text-white" /><span className="font-black uppercase text-xs">Inventory</span>
            </Link>
            <button onClick={() => setLauncherActive(false)} className="bg-white/5 p-10 rounded-[48px] flex flex-col items-center justify-center gap-4 hover:bg-white/10 border border-white/10">
              <LogOut className="h-12 w-12 text-white" /><span className="font-black uppercase text-xs">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50/50 overflow-hidden font-body">
      <Toaster />
      
      {/* HIGH-FIDELITY PRINT ENGINE */}
      <div className={cn(
        "hidden print-only p-4 bg-white text-slate-900 min-h-screen font-receipt text-[10pt] leading-normal",
        printType === 'thermal' ? 'print-thermal' : 'print-normal'
      )}>
        <div className="text-center border-b border-slate-900 pb-2 mb-2">
          <p className="text-[10pt] font-bold uppercase tracking-tight">KRISHNA'S</p>
          <h2 className="text-[12pt] font-black uppercase tracking-tight">SUPER 9+</h2>
          <p className="text-[8pt] font-bold mt-1">{shopAddress}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-2 text-[8pt]">
          <div className="space-y-0.5">
            <p className="font-bold">Bill ID: #{lastSale?.id?.slice(-8) || 'ARCHIVE'}</p>
            <p className="font-bold">DateTime: {getFormattedDateTime(lastSale?.timestamp)}</p>
          </div>
          <div className="space-y-0.5 text-right">
            <p className="font-bold">Cust: {lastSale?.customerName || 'Walk-in'}</p>
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
          <div className="flex justify-between items-center text-[10pt] font-bold uppercase">
            <span>Grand Total</span>
            <span>₹{lastSale?.totalAmount.toFixed(0)}</span>
          </div>
        </div>
        <div className="mt-4 text-center space-y-1">
          <p className="text-[7pt] font-bold uppercase tracking-widest text-slate-400">
            Computer Generated Invoice • No Exchange without Bill
          </p>
          <p className="text-[9pt] font-bold">Thank you for shopping at Krishna's Super 9+!</p>
        </div>
      </div>

      <header className="h-16 border-b border-slate-100 bg-white flex items-center justify-between px-8 shrink-0 z-10 print:hidden">
        <div className="flex items-center gap-6">
           {isLauncherEnabled && (
             <button onClick={() => { setLauncherActive(false); toggleFullscreen(false); }} className="h-10 w-10 rounded-xl bg-slate-50 text-secondary flex items-center justify-center">
               <Monitor className="h-5 w-5" />
             </button>
           )}
           <div className="flex items-center gap-2">
             <span className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.1em]">KRISHNA'S</span>
             <span className="text-lg font-black tracking-tight uppercase text-secondary">SUPER 9+</span>
           </div>
           <div className="h-4 w-px bg-slate-200 mx-2" />
           <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Billing Desk</h2>
           
           {/* REAL-TIME TOP TOTAL DISPLAY */}
           {cartItems.length > 0 && (
             <div className="ml-4 flex items-center gap-3 bg-primary/5 px-5 py-2.5 rounded-2xl animate-in fade-in zoom-in duration-300 border border-primary/10">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Bill</span>
               <span className="text-2xl font-black text-primary tracking-tighter">₹{cartTotalPrice.toLocaleString()}</span>
             </div>
           )}
        </div>
        <div className="flex items-center gap-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsSettingsOpen(true)}
            className="h-10 px-4 rounded-xl font-bold text-[10px] uppercase text-slate-500 gap-2"
          >
            <Settings className="h-4 w-4" /> System
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-50">
                <Menu className="h-5 w-5 text-slate-600" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[340px] p-8 border-none shadow-2xl rounded-l-[40px]">
              <SheetHeader><SheetTitle className="text-left font-black uppercase text-2xl text-secondary">Menu</SheetTitle></SheetHeader>
              <nav className="flex flex-col gap-3 pt-8">
                <Link href="/" className="flex items-center justify-between p-4 bg-secondary/5 text-secondary rounded-2xl font-bold uppercase text-xs">
                  <ShoppingBag className="h-5 w-5 mr-3" /> Billing Desk <ChevronRight className="h-4 w-4" />
                </Link>
                {isAdmin && (
                  <>
                    <Link href="/inventory" className="flex items-center justify-between p-4 hover:bg-slate-50 text-slate-600 rounded-2xl font-bold uppercase text-xs">
                      <PackageSearch className="h-5 w-5 mr-3" /> Stock Master <ChevronRight className="h-4 w-4" />
                    </Link>
                    <Link href="/dashboard" className="flex items-center justify-between p-4 hover:bg-slate-50 text-slate-600 rounded-2xl font-bold uppercase text-xs">
                      <LayoutDashboard className="h-5 w-5 mr-3" /> Business Ledger <ChevronRight className="h-4 w-4" />
                    </Link>
                  </>
                )}
                <Button onClick={() => auth.signOut()} variant="destructive" className="w-full h-14 font-bold rounded-2xl gap-3 text-xs uppercase mt-8 shadow-lg">
                  <LogOut className="h-5 w-5" /> EXIT TERMINAL
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className={cn("flex-1 overflow-hidden print:hidden", !isMobile ? "grid grid-cols-[1fr_420px] h-full" : "flex flex-col")}>
        {!isMobile ? (
          <>
            <div className="flex flex-col h-full p-8 overflow-hidden gap-8 bg-white/40 border-r border-slate-100">
              <div className="flex items-center gap-4">
                <ProductSearch 
                  inputRef={searchInputRef} 
                  products={productsData || []} 
                  onProductSelect={handleProductSelect} 
                  onScanClick={() => setIsScannerOpen(true)} 
                  onAddNewProduct={handleAddNewProduct} 
                />
                <Button 
                  disabled={cartItems.length === 0} 
                  onClick={handleFastPay} 
                  className="h-14 px-8 rounded-2xl font-black text-xs uppercase bg-emerald-500 text-white shadow-xl gap-2 shrink-0 hover:bg-emerald-600 transition-all"
                >
                  <FastForward className="h-5 w-5" /> EXACT CASH
                </Button>
              </div>
              <div className="h-[180px] shrink-0">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-4 w-4 text-primary fill-primary" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary">Quick Tap Items</h3>
                </div>
                <QuickTapGrid products={productsData || []} onProductSelect={handleProductSelect} />
              </div>
              <div className="flex-1 overflow-hidden">
                <CartList items={cartItems} onUpdateQuantity={updateQuantity} onUpdatePrice={updatePrice} onRemoveItem={removeItem} />
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow-[-20px_0_40px_rgba(0,0,0,0.02)]">
              <CheckoutPanel items={cartItems} onComplete={handleCheckout} />
            </div>
          </>
        ) : (
          <div className="flex flex-col h-full overflow-hidden p-4 gap-4">
            <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-2 bg-slate-100 rounded-2xl p-1 mb-4 h-14">
                <TabsTrigger value="products" className="font-bold text-[10px] uppercase">Catalog</TabsTrigger>
                <TabsTrigger value="checkout" className="font-bold text-[10px] uppercase" disabled={cartItems.length === 0}>Bill ({cartItems.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="products" className="flex-1 overflow-hidden flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <ProductSearch inputRef={searchInputRef} products={productsData || []} onProductSelect={handleProductSelect} onScanClick={() => setIsScannerOpen(true)} onAddNewProduct={handleAddNewProduct} />
                  <Button disabled={cartItems.length === 0} onClick={handleFastPay} className="h-14 w-14 p-0 rounded-2xl bg-emerald-500 text-white shadow-lg shrink-0"><FastForward className="h-6 w-6" /></Button>
                </div>
                <QuickTapGrid products={productsData || []} onProductSelect={handleProductSelect} />
                <CartList items={cartItems} onUpdateQuantity={updateQuantity} onUpdatePrice={updatePrice} onRemoveItem={removeItem} />
              </TabsContent>
              <TabsContent value="checkout" className="flex-1 overflow-hidden">
                <CheckoutPanel items={cartItems} onComplete={handleCheckout} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>

      <SystemSettingsDialog 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        isAdmin={isAdmin}
      />

      {/* SUCCESS DIALOG */}
      <Dialog open={isSuccessDialogOpen} onOpenChange={(val) => { setIsSuccessDialogOpen(val); }}>
        <DialogContent className="sm:max-w-md rounded-[40px] p-10 border-none shadow-2xl overflow-hidden print:hidden text-[9pt]">
          <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500" />
          <DialogHeader className="space-y-4">
            <div className="mx-auto w-20 h-20 bg-emerald-50 rounded-[32px] flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            </div>
            <DialogTitle className="text-center text-2xl font-black uppercase text-secondary">Bill Finalized</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="bg-slate-50 rounded-[28px] p-6 space-y-3 font-receipt border border-slate-200 leading-normal">
              <div className="flex flex-col border-b border-slate-100 pb-2 space-y-2">
                 <div className="flex justify-between items-center text-[8pt] font-bold">
                    <span className="text-slate-400 uppercase">Customer</span>
                    <span className="text-secondary">{lastSale?.customerName || 'Walk-in'}</span>
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
                  <span className="text-[8pt] font-bold text-emerald-500 uppercase">{lastSale?.staffName || staffName}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-14 rounded-2xl font-bold uppercase text-[10px] gap-2" onClick={() => setIsPrinterSelectionOpen(true)}>
                <Printer className="h-4 w-4" /> Print
              </Button>
              <Button variant="outline" className="h-14 rounded-2xl font-bold uppercase text-[10px] gap-2">
                <Download className="h-4 w-4" /> Digital PDF
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button className="w-full h-16 rounded-2xl font-black text-sm shadow-xl bg-primary text-white uppercase tracking-widest" onClick={() => { setIsSuccessDialogOpen(false); }}>
              NEXT CUSTOMER (ESC)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PRINTER SELECTION */}
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

      <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
        <DialogContent className="sm:max-w-md rounded-[40px] p-10 border-none shadow-2xl overflow-hidden print:hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
          <DialogHeader className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/5 rounded-[24px] flex items-center justify-center"><ScanLine className="h-8 w-8 text-primary" /></div>
            <DialogTitle className="text-center text-xl font-black uppercase text-secondary">Super Scanner</DialogTitle>
          </DialogHeader>
          <div className="py-4"><BarcodeScanner isOpen={isScannerOpen} onScanSuccess={handleBarcodeScan} /></div>
          <DialogFooter><Button variant="secondary" className="w-full h-14 rounded-2xl font-black text-xs uppercase" onClick={() => setIsScannerOpen(false)}>Close Scanner</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
