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
        <p className="text-slate-400 font-black animate-pulse uppercase tracking-widest text-xs">Loading Terminal...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white rounded-[48px] shadow-2xl p-12 text-center space-y-8 animate-in zoom-in-95 duration-500">
          <div className="mx-auto w-24 h-24 bg-primary/10 rounded-[32px] flex items-center justify-center">
            <ShieldCheck className="h-12 w-12 text-primary" />
          </div>
          <div className="space-y-2">
            <p className="text-secondary font-black text-xs uppercase tracking-[0.2em]">KRISHNA'S</p>
            <h1 className="text-6xl font-black tracking-tighter text-primary">Super9<span className="text-secondary">+</span></h1>
            <p className="text-slate-500 font-bold uppercase text-xs tracking-widest mt-4">Authorized Staff Only</p>
          </div>
          <Button 
            onClick={() => initiateAnonymousSignIn(auth)}
            className="w-full h-24 text-2xl font-black rounded-3xl shadow-xl shadow-primary/20 transition-all active:scale-95 bg-primary hover:bg-primary/90"
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
        <div className="text-center space-y-1 border-b-2 border-slate-900 pb-6 mb-6">
          <p className="text-xs font-bold tracking-[0.3em]">KRISHNA'S</p>
          <h2 className="text-4xl font-black uppercase tracking-tighter">Super 9+ Supermarket</h2>
          <p className="text-xs font-medium">Main Market, New Delhi • GSTIN: 07AABCU1234F1Z5</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div className="space-y-1">
            <p className="font-bold">Bill ID: #{Date.now()}</p>
            <p className="font-bold">Date: {new Date().toLocaleDateString()}</p>
            <p className="font-bold">Time: {new Date().toLocaleTimeString()}</p>
          </div>
          <div className="space-y-1 text-right">
            <p className="font-bold">Cust: {lastSale?.customerId || 'Guest'}</p>
            <p className="font-bold">Mode: {lastSale?.paymentMode || 'Cash'}</p>
            <p className="font-bold">Staff: #{user.uid.slice(0, 5)}</p>
          </div>
        </div>

        <table className="w-full text-sm border-collapse mb-8">
          <thead>
            <tr className="border-y-2 border-slate-900">
              <th className="text-left py-3 font-black uppercase text-xs">Item</th>
              <th className="text-center py-3 font-black uppercase text-xs">Qty</th>
              <th className="text-right py-3 font-black uppercase text-xs">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {lastSale?.items.map((item, idx) => (
              <tr key={idx}>
                <td className="py-3 font-bold">{item.name}</td>
                <td className="py-3 text-center font-bold">{item.quantity}</td>
                <td className="py-3 text-right font-bold">₹{item.price * item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="space-y-2 text-right border-t-2 border-slate-900 pt-6">
          <div className="flex justify-between items-center text-sm font-bold">
            <span>Subtotal</span>
            <span>₹{lastSale?.subtotalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-900">
            <span className="text-lg font-black uppercase tracking-tight">Grand Total</span>
            <span className="text-3xl font-black">₹{lastSale?.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-16 text-center space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            No Exchange without Bill • Items including GST
          </p>
          <p className="text-sm font-bold">Thank you for shopping at Super 9+!</p>
        </div>
      </div>

      <header className="h-20 border-b border-slate-100 bg-white flex items-center justify-between px-8 shrink-0 print:hidden">
        <div className="flex flex-col">
           <p className="text-[10px] font-black text-secondary tracking-[0.3em] leading-none mb-1">KRISHNA'S</p>
           <h1 className="text-3xl font-black tracking-tighter uppercase leading-none text-primary">Super9<span className="text-secondary">+</span> Billing</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="lg" 
            onClick={() => setIsCashDialogOpen(true)}
            className="rounded-2xl font-black text-xs uppercase gap-2 bg-emerald-50 text-emerald-600 border-none shadow-sm hover:bg-emerald-100 h-14"
          >
            <Banknote className="h-5 w-5" /> Cash Flow
          </Button>
          
          <Link href="/dashboard">
            <Button variant="ghost" size="lg" className="h-14 font-black text-xs uppercase tracking-widest text-slate-400 hover:text-primary">Ledger</Button>
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl"><Menu className="h-8 w-8 text-slate-600" /></Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[350px] p-8 space-y-8">
              <SheetHeader>
                <SheetTitle className="text-left font-black uppercase tracking-tighter text-3xl">Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4">
                <Link href="/" className="flex items-center gap-4 p-5 bg-primary/10 text-primary rounded-3xl font-black uppercase text-sm">
                  <ShoppingBag className="h-6 w-6" /> Billing
                </Link>
                <Link href="/dashboard" className="flex items-center gap-4 p-5 hover:bg-slate-50 text-slate-600 rounded-3xl font-black uppercase text-sm transition-colors">
                  <LayoutDashboard className="h-6 w-6" /> Performance
                </Link>
                <button onClick={() => setIsProductDialogOpen(true)} className="flex items-center gap-4 p-5 hover:bg-slate-50 text-slate-600 rounded-3xl font-black uppercase text-sm transition-colors w-full text-left">
                  <PackageSearch className="h-6 w-6" /> Item Master
                </button>
                <button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-4 p-5 hover:bg-slate-50 text-slate-600 rounded-3xl font-black uppercase text-sm transition-colors w-full text-left">
                  <Settings className="h-6 w-6" /> Shop Settings
                </button>
                <div className="pt-8 mt-8 border-t border-slate-100">
                  <Button onClick={() => auth.signOut()} variant="destructive" className="w-full h-16 font-black rounded-2xl gap-2 text-lg">
                    <LogOut className="h-6 w-6" /> LOG OUT
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className={cn("flex-1 overflow-hidden print:hidden", !isMobile ? "grid grid-cols-[1fr_450px] h-full" : "flex flex-col")}>
        {isMobile ? (
          <div className="flex flex-col h-full overflow-hidden p-6 gap-6">
            <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-2 bg-slate-100 rounded-[20px] p-1.5 mb-6 h-16">
                <TabsTrigger value="products" className="font-black text-sm uppercase rounded-[16px] data-[state=active]:bg-white data-[state=active]:shadow-md">Search Items</TabsTrigger>
                <TabsTrigger value="checkout" className="font-black text-sm uppercase rounded-[16px] data-[state=active]:bg-white data-[state=active]:shadow-md" disabled={cartItems.length === 0}>
                  Pay ({cartTotalItems})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="products" className="flex-1 overflow-hidden mt-0 flex flex-col gap-6">
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
            <div className="flex flex-col h-full p-10 overflow-hidden gap-8 bg-slate-50/30 border-r">
              <ProductSearch products={productsData} onProductSelect={handleProductSelect} onScanClick={() => {}} onAddNewProduct={handleAddNewProduct} />
              <div className="flex-1 overflow-hidden">
                <CartList items={cartItems} onUpdateQuantity={updateQuantity} onUpdatePrice={updatePrice} onRemoveItem={removeItem} />
              </div>
            </div>
            <div className="p-10 bg-white overflow-hidden shadow-2xl">
              <CheckoutPanel items={cartItems} onComplete={handleCheckout} />
            </div>
          </>
        )}
      </main>

      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-[48px] p-12 border-none shadow-2xl overflow-hidden print:hidden">
          <div className="absolute top-0 left-0 w-full h-3 bg-emerald-500" />
          <DialogHeader className="space-y-4">
            <div className="mx-auto w-24 h-24 bg-emerald-50 rounded-[32px] flex items-center justify-center">
              <CheckCircle2 className="h-14 w-14 text-emerald-500" />
            </div>
            <DialogTitle className="text-center text-4xl font-black uppercase tracking-tight">Bill Confirmed</DialogTitle>
            <DialogDescription className="text-center font-bold text-slate-400 text-lg">
              Transaction synced to cloud ledger.
            </DialogDescription>
          </DialogHeader>

          <div className="py-8 space-y-6">
            <div className="bg-slate-50 rounded-[32px] p-8 space-y-3">
              <div className="flex justify-between items-center text-xs font-black uppercase text-slate-400 tracking-widest">
                <span>RECEIPT SUMMARY</span>
                <span>{lastSale?.paymentMode}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-5xl font-black text-slate-900 tracking-tighter">₹{lastSale?.totalAmount}</span>
                <span className="text-sm font-bold text-slate-400">{lastSale?.items.length} Items</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <Button 
                variant="outline" 
                className="h-20 rounded-3xl bg-slate-50 border-none font-black uppercase text-sm gap-4 hover:bg-slate-100"
                onClick={() => handlePrintAction('normal')}
              >
                <Printer className="h-7 w-7 text-primary" /> Normal Desktop Print
              </Button>
              <Button 
                variant="outline" 
                className="h-20 rounded-3xl bg-slate-50 border-none font-black uppercase text-sm gap-4 hover:bg-slate-100"
                onClick={() => handlePrintAction('thermal')}
              >
                <Printer className="h-7 w-7 text-secondary" /> Thermal Printer (58/80mm)
              </Button>
              <Button 
                variant="outline" 
                className="h-20 rounded-3xl bg-slate-50 border-none font-black uppercase text-sm gap-4 hover:bg-slate-100"
                onClick={() => handlePrintAction('pdf')}
              >
                <FileDown className="h-7 w-7 text-slate-400" /> Save as Digital PDF
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button 
              className="w-full h-20 rounded-3xl font-black text-xl shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90"
              onClick={() => setIsSuccessDialogOpen(false)}
            >
              DONE • NEW BILL
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ProductDialog 
        isOpen={isProductDialogOpen}
        onClose={() => setIsProductDialogOpen(false)}
      />

      <Dialog open={isCashDialogOpen} onOpenChange={setIsCashDialogOpen}>
        <DialogContent className="rounded-[40px] p-10 sm:max-w-md print:hidden">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black uppercase tracking-tight text-secondary">Register Cash Flow</DialogTitle>
            <DialogDescription className="font-bold text-slate-400 text-lg">
              Manual adjustments for the drawer.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCashTransaction} className="space-y-8 py-6">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="relative">
                  <input type="radio" id="cash-in" name="type" value="IN" defaultChecked className="peer hidden" />
                  <label htmlFor="cash-in" className="flex flex-col items-center justify-center h-28 rounded-[24px] bg-slate-50 border-2 border-transparent peer-checked:border-emerald-500 peer-checked:bg-emerald-50 transition-all cursor-pointer">
                    <PlusCircle className="h-10 w-10 text-emerald-500 mb-2" />
                    <span className="font-black text-xs uppercase">Cash In</span>
                  </label>
                </div>
                <div className="relative">
                  <input type="radio" id="cash-out" name="type" value="OUT" className="peer hidden" />
                  <label htmlFor="cash-out" className="flex flex-col items-center justify-center h-28 rounded-[24px] bg-slate-50 border-2 border-transparent peer-checked:border-destructive peer-checked:bg-destructive/5 transition-all cursor-pointer">
                    <MinusCircle className="h-10 w-10 text-destructive mb-2" />
                    <span className="font-black text-xs uppercase">Cash Out</span>
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Amount (₹)</Label>
                <Input name="amount" type="number" required placeholder="0.00" className="h-20 text-4xl font-black bg-slate-50 border-none rounded-[24px]" />
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Reason</Label>
                <Input name="reason" placeholder="e.g. Supplier, Food, Change" className="h-16 font-bold bg-slate-50 border-none rounded-[16px] text-lg" />
              </div>
            </div>
            <DialogFooter className="gap-4 sm:justify-between">
              <Button type="button" variant="ghost" onClick={() => setIsCashDialogOpen(false)} className="rounded-2xl font-bold h-16 px-8">Cancel</Button>
              <Button type="submit" className="rounded-2xl font-black px-12 h-16 text-lg bg-secondary">Sync Drawer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="rounded-[40px] p-12 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black uppercase tracking-tight text-secondary">Shop Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-6">
             <div className="bg-slate-50 p-8 rounded-[32px] space-y-4">
               <p className="font-black text-primary text-xl">Krishna's SUPER 9+</p>
               <p className="text-slate-400 font-bold text-sm">Main Market, New Delhi</p>
               <p className="text-slate-400 font-bold text-sm">GSTIN: 07AABCU1234F1Z5</p>
             </div>
             <p className="text-slate-400 text-center font-bold text-sm">Shop details are managed centrally. Contact admin to update address or GST details.</p>
          </div>
          <Button onClick={() => setIsSettingsOpen(false)} className="w-full h-20 rounded-3xl font-black text-xl">CLOSE</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}