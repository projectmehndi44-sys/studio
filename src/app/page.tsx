"use client";

import { useState, useCallback, useEffect } from 'react';
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
  FileDown,
  Settings,
  X
} from 'lucide-react';
import { Product, CartItem, PurchaseRecord } from '@/lib/types';
import { ProductSearch } from '@/components/pos/product-search';
import { CartList } from '@/components/pos/cart-list';
import { CheckoutPanel } from '@/components/pos/checkout-panel';
import { ProductDialog } from '@/components/pos/product-dialog';
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
  useAuth 
} from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const CART_STORAGE_KEY = 'super9_pos_current_cart';

export default function POSPage() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const db = useFirestore();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isCashDialogOpen, setIsCashDialogOpen] = useState(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [lastSale, setLastSale] = useState<PurchaseRecord | null>(null);
  const [activeMainTab, setActiveMainTab] = useState('products');

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

  const { data } = useCollection<Product>(productsQuery);
  const productsData = data ?? [];

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
    toast({
      title: "Added",
      description: `${product.name} added to cart.`,
      duration: 800,
    });
  }, [toast]);

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
      paymentMode: data.paymentMode,
      isOfflineSale: false,
      customerId: data.customerPhone || null
    };

    addDocumentNonBlocking(collection(db, 'purchases'), {
      ...saleData,
      timestamp: serverTimestamp()
    });

    setLastSale(saleData);
    setCartItems([]);
    setActiveMainTab('products');
    setIsSuccessDialogOpen(true);
    
    toast({
      title: "Syncing Complete",
      description: `Bill synced to cloud ledger.`,
    });
  };

  const handlePrintAction = (type: 'thermal' | 'normal' | 'pdf') => {
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

  if (isUserLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <p className="text-slate-400 font-bold animate-pulse uppercase tracking-widest text-xs">Loading Terminal...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center space-y-6 animate-in zoom-in-95 duration-500">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-secondary font-bold text-[10px] uppercase tracking-[0.2em]">KRISHNA'S</p>
            <h1 className="text-4xl font-bold tracking-tight text-primary">Super9<span className="text-secondary">+</span></h1>
            <p className="text-slate-400 font-medium uppercase text-[10px] tracking-widest mt-2">Authorized Staff Only</p>
          </div>
          <Button 
            onClick={() => initiateAnonymousSignIn(auth)}
            className="w-full h-14 text-lg font-bold rounded-xl shadow-md transition-all active:scale-95 bg-primary hover:bg-primary/90"
          >
            CLOCK IN
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden text-slate-900">
      <Toaster />
      
      {/* PROFESSIONAL PRINT-ONLY RECEIPT */}
      <div className="hidden print-only p-8 bg-white text-slate-900 min-h-screen font-receipt">
        <div className="text-center space-y-1 border-b border-slate-900 pb-4 mb-4">
          <p className="text-[10px] font-bold tracking-[0.2em]">KRISHNA'S</p>
          <h2 className="text-3xl font-bold uppercase tracking-tight">Super 9+ Supermarket</h2>
          <p className="text-[10px] font-medium">Main Market, New Delhi • GSTIN: 07AABCU1234F1Z5</p>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
          <div className="space-y-0.5">
            <p className="font-bold">Bill ID: #{Date.now().toString().slice(-8)}</p>
            <p className="font-bold">Date: {new Date().toLocaleDateString()}</p>
            <p className="font-bold">Time: {new Date().toLocaleTimeString()}</p>
          </div>
          <div className="space-y-0.5 text-right">
            <p className="font-bold">Cust: {lastSale?.customerId || 'Guest'}</p>
            <p className="font-bold">Mode: {lastSale?.paymentMode || 'Cash'}</p>
            <p className="font-bold">Staff: #{user.uid.slice(0, 5)}</p>
          </div>
        </div>

        <table className="w-full text-xs border-collapse mb-4">
          <thead>
            <tr className="border-y border-slate-900">
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
                <td className="py-2 text-right">₹{item.price * item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="space-y-1 text-right border-t border-slate-900 pt-4">
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
            No Exchange without Bill • Inclusive of GST
          </p>
          <p className="text-xs font-bold">Thank you for shopping at Super 9+!</p>
        </div>
      </div>

      <header className="h-14 border-b border-slate-100 bg-white flex items-center justify-between px-6 shrink-0 print:hidden shadow-sm z-10">
        <div className="flex flex-col">
           <p className="text-[9px] font-bold text-secondary tracking-[0.2em] leading-none mb-0.5">KRISHNA'S</p>
           <h1 className="text-xl font-bold tracking-tight uppercase leading-none text-primary">Super9<span className="text-secondary">+</span> Billing</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsCashDialogOpen(true)}
            className="rounded-lg font-bold text-[10px] uppercase gap-1.5 bg-emerald-50 text-emerald-600 border-none shadow-sm hover:bg-emerald-100 h-9"
          >
            <Banknote className="h-4 w-4" /> Cash Flow
          </Button>
          
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="h-9 font-bold text-[10px] uppercase tracking-wider text-slate-500 hover:text-primary">Ledger</Button>
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg"><Menu className="h-5 w-5 text-slate-600" /></Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] p-6 space-y-6">
              <SheetHeader>
                <SheetTitle className="text-left font-bold uppercase tracking-tight text-xl">Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2">
                <Link href="/" className="flex items-center gap-3 p-3 bg-primary/5 text-primary rounded-xl font-bold uppercase text-xs">
                  <ShoppingBag className="h-5 w-5" /> Billing Terminal
                </Link>
                <Link href="/dashboard" className="flex items-center gap-3 p-3 hover:bg-slate-50 text-slate-600 rounded-xl font-bold uppercase text-xs transition-colors">
                  <LayoutDashboard className="h-5 w-5" /> Performance
                </Link>
                <button onClick={() => setIsProductDialogOpen(true)} className="flex items-center gap-3 p-3 hover:bg-slate-50 text-slate-600 rounded-xl font-bold uppercase text-xs transition-colors w-full text-left">
                  <PackageSearch className="h-5 w-5" /> Item Master
                </button>
                <button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-3 p-3 hover:bg-slate-50 text-slate-600 rounded-xl font-bold uppercase text-xs transition-colors w-full text-left">
                  <Settings className="h-5 w-5" /> Store Settings
                </button>
                <div className="pt-6 mt-6 border-t border-slate-100">
                  <Button onClick={() => auth.signOut()} variant="destructive" className="w-full h-12 font-bold rounded-xl gap-2 text-sm">
                    <LogOut className="h-5 w-5" /> LOG OUT
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className={cn("flex-1 overflow-hidden print:hidden", !isMobile ? "grid grid-cols-[1fr_380px] h-full" : "flex flex-col")}>
        {isMobile ? (
          <div className="flex flex-col h-full overflow-hidden p-4 gap-4">
            <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-2 bg-slate-100 rounded-xl p-1 mb-4 h-12">
                <TabsTrigger value="products" className="font-bold text-xs uppercase rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Catalog</TabsTrigger>
                <TabsTrigger value="checkout" className="font-bold text-xs uppercase rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm" disabled={cartItems.length === 0}>
                  Billing ({cartTotalItems})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="products" className="flex-1 overflow-hidden mt-0 flex flex-col gap-4">
                <ProductSearch products={productsData} onProductSelect={handleProductSelect} onScanClick={() => {}} onAddNewProduct={handleAddNewProduct} />
                <CartList items={cartItems} onUpdateQuantity={updateQuantity} onUpdatePrice={updatePrice} onRemoveItem={removeItem} />
              </TabsContent>
              
              <TabsContent value="checkout" className="flex-1 overflow-hidden mt-0">
                <CheckoutPanel items={cartItems} onComplete={handleCheckout} />
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <>
            <div className="flex flex-col h-full p-6 overflow-hidden gap-6 bg-slate-50/20 border-r">
              <ProductSearch products={productsData} onProductSelect={handleProductSelect} onScanClick={() => {}} onAddNewProduct={handleAddNewProduct} />
              <div className="flex-1 overflow-hidden">
                <CartList items={cartItems} onUpdateQuantity={updateQuantity} onUpdatePrice={updatePrice} onRemoveItem={removeItem} />
              </div>
            </div>
            <div className="p-6 bg-white overflow-hidden shadow-lg">
              <CheckoutPanel items={cartItems} onComplete={handleCheckout} />
            </div>
          </>
        )}
      </main>

      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-8 border-none shadow-2xl overflow-hidden print:hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500" />
          <DialogHeader className="space-y-3">
            <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </div>
            <DialogTitle className="text-center text-2xl font-bold uppercase tracking-tight">Sync Confirmed</DialogTitle>
            <DialogDescription className="text-center font-medium text-slate-400 text-sm">
              Transaction added to cloud ledger.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-4">
            <div className="bg-slate-50 rounded-2xl p-6 space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase text-slate-400 tracking-widest">
                <span>RECEIPT</span>
                <span>{lastSale?.paymentMode}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-3xl font-bold text-slate-900 tracking-tight">₹{lastSale?.totalAmount}</span>
                <span className="text-xs font-medium text-slate-400">{lastSale?.items.length} Items</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <Button 
                variant="outline" 
                className="h-14 rounded-xl bg-slate-50 border-none font-bold uppercase text-xs gap-3 hover:bg-slate-100"
                onClick={() => handlePrintAction('normal')}
              >
                <Printer className="h-5 w-5 text-primary" /> Desktop Print (A4)
              </Button>
              <Button 
                variant="outline" 
                className="h-14 rounded-xl bg-slate-50 border-none font-bold uppercase text-xs gap-3 hover:bg-slate-100"
                onClick={() => handlePrintAction('thermal')}
              >
                <Printer className="h-5 w-5 text-secondary" /> Thermal (58/80mm)
              </Button>
              <Button 
                variant="outline" 
                className="h-14 rounded-xl bg-slate-50 border-none font-bold uppercase text-xs gap-3 hover:bg-slate-100"
                onClick={() => handlePrintAction('pdf')}
              >
                <FileDown className="h-5 w-5 text-slate-400" /> Save PDF Copy
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button 
              className="w-full h-14 rounded-xl font-bold text-base shadow-lg shadow-primary/10 bg-primary hover:bg-primary/90"
              onClick={() => setIsSuccessDialogOpen(false)}
            >
              FINISH • NEW BILL
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ProductDialog 
        isOpen={isProductDialogOpen}
        onClose={() => setIsProductDialogOpen(false)}
      />

      <Dialog open={isCashDialogOpen} onOpenChange={setIsCashDialogOpen}>
        <DialogContent className="rounded-2xl p-8 sm:max-w-md print:hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold uppercase tracking-tight text-secondary">Manual Cash Adjustment</DialogTitle>
            <DialogDescription className="font-medium text-slate-400 text-sm">
              Record register flow without a bill.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCashTransaction} className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <input type="radio" id="cash-in" name="type" value="IN" defaultChecked className="peer hidden" />
                  <label htmlFor="cash-in" className="flex flex-col items-center justify-center h-20 rounded-xl bg-slate-50 border-2 border-transparent peer-checked:border-emerald-500 peer-checked:bg-emerald-50 transition-all cursor-pointer">
                    <PlusCircle className="h-6 w-6 text-emerald-500 mb-1" />
                    <span className="font-bold text-[10px] uppercase">Cash In</span>
                  </label>
                </div>
                <div className="relative">
                  <input type="radio" id="cash-out" name="type" value="OUT" className="peer hidden" />
                  <label htmlFor="cash-out" className="flex flex-col items-center justify-center h-20 rounded-xl bg-slate-50 border-2 border-transparent peer-checked:border-destructive peer-checked:bg-destructive/5 transition-all cursor-pointer">
                    <MinusCircle className="h-6 w-6 text-destructive mb-1" />
                    <span className="font-bold text-[10px] uppercase">Cash Out</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Amount (₹)</Label>
                <Input name="amount" type="number" required placeholder="0.00" className="h-12 text-2xl font-bold bg-slate-50 border-none rounded-xl" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Reason / Remark</Label>
                <Input name="reason" placeholder="Vendor, Fuel, Food etc." className="h-11 font-medium bg-slate-50 border-none rounded-xl text-sm" />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:justify-between">
              <Button type="button" variant="ghost" onClick={() => setIsCashDialogOpen(false)} className="rounded-xl font-bold h-12 px-6">Cancel</Button>
              <Button type="submit" className="rounded-xl font-bold px-8 h-12 text-sm bg-secondary">Sync Ledger</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="rounded-2xl p-8 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold uppercase tracking-tight text-secondary">Store Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
             <div className="bg-slate-50 p-6 rounded-2xl space-y-2">
               <p className="font-bold text-primary text-lg">Krishna's SUPER 9+</p>
               <p className="text-slate-500 font-medium text-xs">Main Market, New Delhi</p>
               <p className="text-slate-500 font-medium text-xs">GSTIN: 07AABCU1234F1Z5</p>
             </div>
             <p className="text-slate-400 text-center font-medium text-[10px] leading-relaxed uppercase tracking-wider">
               Central profile management. Contact administrator to update GST or address details.
             </p>
          </div>
          <Button onClick={() => setIsSettingsOpen(false)} className="w-full h-12 rounded-xl font-bold text-sm">CLOSE</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}