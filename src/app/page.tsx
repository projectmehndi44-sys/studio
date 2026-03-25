
"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
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
  Keyboard
} from 'lucide-react';
import { Product, CartItem, PurchaseRecord } from '@/lib/types';
import { ProductSearch } from '@/components/pos/product-search';
import { CartList } from '@/components/pos/cart-list';
import { CheckoutPanel } from '@/components/pos/checkout-panel';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import Link from 'next/link';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { 
  useCollection, 
  useFirestore, 
  useUser, 
  useMemoFirebase, 
  addDocumentNonBlocking, 
  initiateAnonymousSignIn, 
  useAuth,
  useDoc,
  setDocumentNonBlocking
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
import { format } from 'date-fns';

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
  const [lastSale, setLastSale] = useState<PurchaseRecord | null>(null);
  const [activeMainTab, setActiveMainTab] = useState('products');

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Shop Settings Hook - Gate behind user auth to avoid permission errors
  const settingsRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, 'settings', 'config');
  }, [db, user]);
  
  const { data: shopSettings } = useDoc(settingsRef);

  const shopName = shopSettings?.shopName || "Krishna's SUPER 9+";
  const shopAddress = shopSettings?.address || "Hoolungooree, Mariani";
  const shopGSTIN = shopSettings?.gstin || "";

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + F for Search Focus
      if (e.altKey && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // Ctrl + Enter for Confirm & Sync
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        if (cartItems.length > 0) {
          const total = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
          handleCheckout({ total, paymentMode: 'Cash' });
        }
      }
      // Alt + C for Cash Flow
      if (e.altKey && e.key === 'c') {
        e.preventDefault();
        setIsCashDialogOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cartItems]);

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

  const productsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(db, 'products');
  }, [db, user]);

  const { data: productsData } = useCollection<Product>(productsQuery);

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
    const saleData: PurchaseRecord = {
      staffId: user?.uid || 'anonymous',
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

    setLastSale(saleData);
    setCartItems([]);
    setActiveMainTab('products');
    setIsSuccessDialogOpen(true);
  };

  const handlePrintAction = () => {
    window.print();
  };

  const handleAddNewProduct = (name: string) => {
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

  if (isUserLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <p className="text-slate-400 font-bold animate-pulse uppercase tracking-[0.2em] text-[10px]">Booting Terminal...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl p-12 text-center space-y-8 animate-in zoom-in-95 duration-500">
          <div className="mx-auto w-20 h-20 bg-secondary/5 rounded-[32px] flex items-center justify-center">
            <ShieldCheck className="h-10 w-10 text-secondary" />
          </div>
          <div className="space-y-2">
            <p className="text-primary font-bold text-[10px] uppercase tracking-[0.3em]">Authorized Entry</p>
            <h1 className="text-5xl font-black tracking-tighter text-secondary leading-none uppercase">KRISHNA'S</h1>
            <h2 className="text-3xl font-black tracking-tighter text-primary leading-none uppercase">SUPER 9+</h2>
            <p className="text-slate-400 font-medium text-sm mt-4">Terminal v3.0</p>
          </div>
          <Button 
            onClick={() => initiateAnonymousSignIn(auth)}
            className="w-full h-16 text-lg font-bold rounded-2xl shadow-xl transition-all active:scale-95 bg-secondary hover:bg-secondary/95 text-white"
          >
            START SESSION
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50/50 overflow-hidden text-slate-900 font-body">
      <Toaster />
      
      {/* PROFESSIONAL PRINT-ONLY RECEIPT */}
      <div className="hidden print-only p-8 bg-white text-slate-900 min-h-screen font-receipt">
        <div className="text-center space-y-1 border-b-2 border-slate-900 pb-4 mb-4">
          <p className="text-lg font-bold text-slate-600 uppercase">KRISHNA&apos;S</p>
          <h2 className="text-4xl font-black uppercase tracking-tight">SUPER 9+</h2>
          <p className="text-sm font-bold mt-2">{shopAddress}</p>
          {shopGSTIN && <p className="text-[10px] font-bold">GSTIN: {shopGSTIN}</p>}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
          <div className="space-y-0.5">
            <p className="font-bold">Bill ID: #{Date.now().toString().slice(-8)}</p>
            <p className="font-bold">Date: {format(new Date(), 'dd/MM/yyyy')}</p>
            <p className="font-bold">Time: {format(new Date(), 'HH:mm')}</p>
          </div>
          <div className="space-y-0.5 text-right">
            <p className="font-bold">Cust: {lastSale?.customerName || lastSale?.customerId || 'Guest'}</p>
            <p className="font-bold">Mode: {lastSale?.paymentMode || 'Cash'}</p>
            <p className="font-bold">Staff: #{user.uid.slice(0, 5)}</p>
          </div>
        </div>

        <table className="w-full text-xs border-collapse mb-4">
          <thead>
            <tr className="border-y-2 border-slate-900">
              <th className="text-left py-2 font-bold uppercase">Item</th>
              <th className="text-center py-2 font-bold uppercase">Qty</th>
              <th className="text-right py-2 font-bold uppercase">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lastSale?.items.map((item, idx) => (
              <tr key={idx}>
                <td className="py-2">{item.name}</td>
                <td className="py-2 text-center">{item.quantity}</td>
                <td className="py-2 text-right">₹{(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="space-y-1 text-right border-t-2 border-slate-900 pt-4">
          <div className="flex justify-between items-center text-xs">
            <span>Subtotal</span>
            <span>₹{lastSale?.subtotalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-slate-400">
            <span className="text-sm font-bold uppercase">Grand Total</span>
            <span className="text-xl font-bold">₹{lastSale?.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-8 text-center space-y-2">
          <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">
            Computer Generated Invoice • No Exchange without Bill
          </p>
          <p className="text-xs font-bold">Thank you for shopping at Krishna&apos;s Super 9+!</p>
        </div>
      </div>

      <header className="h-16 border-b border-slate-100 bg-white flex items-center justify-between px-8 shrink-0 print:hidden z-10">
        <div className="flex items-center gap-6">
           <div className="flex flex-col border-r pr-6 border-slate-100">
              <p className="text-[8px] font-black text-slate-400 tracking-[0.4em] uppercase leading-none mb-1">KRISHNA&apos;S</p>
              <h1 className="text-lg font-black tracking-tight uppercase leading-none text-secondary">SUPER 9+</h1>
           </div>
           <div>
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Billing Desk</h2>
           </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-4 text-slate-400">
             <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                <Keyboard className="h-3.5 w-3.5" />
                <span className="text-[9px] font-bold uppercase tracking-wider">Alt+F: Search</span>
             </div>
             <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                <Keyboard className="h-3.5 w-3.5" />
                <span className="text-[9px] font-bold uppercase tracking-wider">Ctrl+Enter: Sync</span>
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
          
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="h-10 px-4 rounded-xl font-bold text-[10px] uppercase tracking-wider text-slate-500 hover:text-secondary gap-2">
              <LayoutDashboard className="h-4 w-4" /> Ledger
            </Button>
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-50 transition-all">
                <Menu className="h-5 w-5 text-slate-600" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[340px] p-8 space-y-8 border-none shadow-2xl rounded-l-[40px]">
              <SheetHeader>
                <SheetTitle className="text-left font-black uppercase tracking-tight text-2xl text-secondary">Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-3">
                <Link href="/" className="flex items-center justify-between p-4 bg-secondary/5 text-secondary rounded-2xl font-bold uppercase text-xs">
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="h-5 w-5" /> Billing Desk
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </Link>
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
                <div className="pt-8 mt-4 border-t border-slate-100">
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
              <ProductSearch 
                inputRef={searchInputRef}
                products={productsData || []} 
                onProductSelect={handleProductSelect} 
                onScanClick={() => {}} 
                onAddNewProduct={handleAddNewProduct} 
              />
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
                  onScanClick={() => {}} 
                  onAddNewProduct={handleAddNewProduct} 
                />
                <CartList items={cartItems} onUpdateQuantity={updateQuantity} onUpdatePrice={updatePrice} onRemoveItem={removeItem} />
              </TabsContent>
              
              <TabsContent value="checkout" className="flex-1 overflow-hidden mt-0">
                <CheckoutPanel items={cartItems} onComplete={handleCheckout} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>

      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-[40px] p-10 border-none shadow-2xl overflow-hidden print:hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500" />
          <DialogHeader className="space-y-4">
            <div className="mx-auto w-20 h-20 bg-emerald-50 rounded-[32px] flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            </div>
            <DialogTitle className="text-center text-3xl font-black uppercase tracking-tight text-secondary leading-none">Bill Synced</DialogTitle>
          </DialogHeader>

          <div className="py-8 space-y-4">
            <div className="bg-slate-50 rounded-[28px] p-8 space-y-4">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase text-slate-400 tracking-widest">
                <span>INVOICE DETAILS</span>
                <span>{lastSale?.paymentMode}</span>
              </div>
              <div className="flex justify-between items-end border-t border-slate-100 pt-4">
                <span className="text-5xl font-black text-slate-900 tracking-tighter leading-none">₹{lastSale?.totalAmount}</span>
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{lastSale?.items.length} Items</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
               <Button 
                 variant="outline" 
                 className="h-14 rounded-2xl bg-white border-slate-100 font-bold uppercase text-[10px] gap-2 hover:bg-secondary hover:text-white transition-all"
                 onClick={handlePrintAction}
               >
                 <Printer className="h-4 w-4" /> Print
               </Button>
               <Button 
                 variant="outline" 
                 className="h-14 rounded-2xl bg-white border-slate-100 font-bold uppercase text-[10px] gap-2 hover:bg-secondary hover:text-white transition-all"
                 onClick={handlePrintAction}
               >
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
        <DialogContent className="rounded-[32px] p-10 sm:max-w-md border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight text-secondary">Shop Profile</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateShopSettings} className="space-y-6 py-6">
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
             <Button type="submit" className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest bg-primary text-white">SAVE PROFILE</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
