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
  Download,
  Settings,
  ChevronRight
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
      paymentMode: data.paymentMode,
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
            <h1 className="text-5xl font-black tracking-tighter text-secondary leading-none">Super9<span className="text-primary">+</span></h1>
            <p className="text-slate-400 font-medium text-sm mt-4">Krishna's POS Terminal v2.5</p>
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
          <p className="text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase">Krishna's</p>
          <h2 className="text-3xl font-black uppercase tracking-tight">Super 9+ Supermarket</h2>
          <p className="text-[10px] font-bold">Main Market, New Delhi • GSTIN: 07AABCU1234F1Z5</p>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
          <div className="space-y-0.5">
            <p className="font-bold">Bill ID: #{Date.now().toString().slice(-8)}</p>
            <p className="font-bold">Date: {new Date().toLocaleDateString()}</p>
            <p className="font-bold">Time: {new Date().toLocaleTimeString()}</p>
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
                <td className="py-2 text-right">₹{item.price * item.quantity}</td>
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
          <p className="text-xs font-bold">Thank you for shopping at Super 9+!</p>
        </div>
      </div>

      <header className="h-16 border-b border-slate-100 bg-white flex items-center justify-between px-8 shrink-0 print:hidden z-10">
        <div className="flex items-center gap-4">
           <div className="h-10 w-10 bg-secondary rounded-xl flex items-center justify-center font-black text-white text-xs">S9</div>
           <div className="flex flex-col">
              <p className="text-[9px] font-bold text-primary tracking-[0.2em] uppercase leading-none mb-0.5">Krishna's</p>
              <h1 className="text-xl font-black tracking-tight uppercase leading-none text-secondary">Super9<span className="text-primary">+</span> Terminal</h1>
           </div>
        </div>
        
        <div className="flex items-center gap-3">
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
                <SheetTitle className="text-left font-black uppercase tracking-tight text-2xl text-secondary">Settings</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-3">
                <Link href="/" className="flex items-center justify-between p-4 bg-secondary/5 text-secondary rounded-2xl font-bold uppercase text-xs">
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="h-5 w-5" /> Billing Desk
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <button onClick={() => setIsProductDialogOpen(true)} className="flex items-center justify-between p-4 hover:bg-slate-50 text-slate-600 rounded-2xl font-bold uppercase text-xs transition-all w-full text-left">
                  <div className="flex items-center gap-3">
                    <PackageSearch className="h-5 w-5" /> Stock Master
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </button>
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
        {isMobile ? (
          <div className="flex flex-col h-full overflow-hidden p-4 gap-4">
            <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-2 bg-slate-100 rounded-2xl p-1 mb-4 h-14">
                <TabsTrigger value="products" className="font-bold text-[10px] uppercase rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">Catalog</TabsTrigger>
                <TabsTrigger value="checkout" className="font-bold text-[10px] uppercase rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm" disabled={cartItems.length === 0}>
                  Bill ({cartTotalItems})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="products" className="flex-1 overflow-hidden mt-0 flex flex-col gap-4">
                <ProductSearch products={productsData || []} onProductSelect={handleProductSelect} onScanClick={() => {}} onAddNewProduct={handleAddNewProduct} />
                <CartList items={cartItems} onUpdateQuantity={updateQuantity} onUpdatePrice={updatePrice} onRemoveItem={removeItem} />
              </TabsContent>
              
              <TabsContent value="checkout" className="flex-1 overflow-hidden mt-0">
                <CheckoutPanel items={cartItems} onComplete={handleCheckout} />
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <>
            <div className="flex flex-col h-full p-8 overflow-hidden gap-8 bg-white/40 border-r border-slate-100">
              <ProductSearch products={productsData || []} onProductSelect={handleProductSelect} onScanClick={() => {}} onAddNewProduct={handleAddNewProduct} />
              <div className="flex-1 overflow-hidden">
                <CartList items={cartItems} onUpdateQuantity={updateQuantity} onUpdatePrice={updatePrice} onRemoveItem={removeItem} />
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow-[-20px_0_40px_rgba(0,0,0,0.02)] z-0">
              <CheckoutPanel items={cartItems} onComplete={handleCheckout} />
            </div>
          </>
        )}
      </main>

      {/* SYNC SUCCESS DIALOG */}
      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-[40px] p-10 border-none shadow-2xl overflow-hidden print:hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500" />
          <DialogHeader className="space-y-4">
            <div className="mx-auto w-20 h-20 bg-emerald-50 rounded-[32px] flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            </div>
            <DialogTitle className="text-center text-3xl font-black uppercase tracking-tight text-secondary leading-none">Bill Synced</DialogTitle>
            <DialogDescription className="text-center font-bold text-slate-400 text-[10px] uppercase tracking-[0.2em]">
              Transaction locked to ledger
            </DialogDescription>
          </DialogHeader>

          <div className="py-8 space-y-4">
            <div className="bg-slate-50 rounded-[28px] p-8 space-y-4">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase text-slate-400 tracking-widest">
                <span>INVOICE</span>
                <span>{lastSale?.paymentMode}</span>
              </div>
              <div className="flex justify-between items-end border-t border-slate-100 pt-4">
                <span className="text-5xl font-black text-slate-900 tracking-tighter leading-none">₹{lastSale?.totalAmount}</span>
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{lastSale?.items.length} Items</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="flex gap-3">
                 <Button 
                   variant="outline" 
                   className="flex-1 h-14 rounded-2xl bg-white border-slate-100 font-bold uppercase text-[10px] gap-2 hover:bg-secondary hover:text-white transition-all"
                   onClick={() => handlePrintAction()}
                 >
                   Desktop Print
                 </Button>
                 <Button 
                   variant="outline" 
                   className="flex-1 h-14 rounded-2xl bg-white border-slate-100 font-bold uppercase text-[10px] gap-2 hover:bg-secondary hover:text-white transition-all"
                   onClick={() => handlePrintAction()}
                 >
                   Thermal Slip
                 </Button>
              </div>
              <Button 
                variant="outline" 
                className="h-14 rounded-2xl bg-slate-100 border-none font-bold uppercase text-[10px] gap-3 hover:bg-slate-200 transition-all text-slate-600"
                onClick={() => handlePrintAction()}
              >
                <Download className="h-5 w-5" /> Save Digital PDF
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button 
              className="w-full h-16 rounded-2xl font-black text-sm shadow-xl shadow-primary/10 bg-primary hover:bg-primary/95 text-white uppercase tracking-widest"
              onClick={() => setIsSuccessDialogOpen(false)}
            >
              NEXT CUSTOMER
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ProductDialog 
        isOpen={isProductDialogOpen}
        onClose={() => setIsProductDialogOpen(false)}
      />

      {/* CASH FLOW DIALOG */}
      <Dialog open={isCashDialogOpen} onOpenChange={setIsCashDialogOpen}>
        <DialogContent className="rounded-[32px] p-10 sm:max-w-md print:hidden border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight text-secondary">Register Log</DialogTitle>
            <DialogDescription className="font-bold text-slate-400 text-[10px] uppercase tracking-widest">
              Record drawer flow (Manual)
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCashTransaction} className="space-y-8 py-6">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <input type="radio" id="cash-in" name="type" value="IN" defaultChecked className="peer hidden" />
                  <label htmlFor="cash-in" className="flex flex-col items-center justify-center h-24 rounded-2xl bg-slate-50 border-2 border-transparent peer-checked:border-emerald-500 peer-checked:bg-emerald-50 transition-all cursor-pointer group">
                    <PlusCircle className="h-7 w-7 text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-[10px] uppercase tracking-widest">Cash In</span>
                  </label>
                </div>
                <div className="relative">
                  <input type="radio" id="cash-out" name="type" value="OUT" className="peer hidden" />
                  <label htmlFor="cash-out" className="flex flex-col items-center justify-center h-24 rounded-2xl bg-slate-50 border-2 border-transparent peer-checked:border-primary peer-checked:bg-primary/5 transition-all cursor-pointer group">
                    <MinusCircle className="h-7 w-7 text-primary mb-2 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-[10px] uppercase tracking-widest">Cash Out</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Transaction Value (₹)</Label>
                <Input name="amount" type="number" required placeholder="0.00" className="h-16 text-4xl font-black bg-slate-50 border-none rounded-2xl px-6 focus-visible:ring-emerald-500/20" />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Reason / Reference</Label>
                <Input name="reason" placeholder="Vendor, Fuel, Milk etc." className="h-14 font-bold bg-slate-50 border-none rounded-2xl px-6 text-sm" />
              </div>
            </div>
            <DialogFooter className="gap-3 sm:justify-between">
              <Button type="button" variant="ghost" onClick={() => setIsCashDialogOpen(false)} className="rounded-2xl font-bold h-14 px-8 text-xs uppercase">Discard</Button>
              <Button type="submit" className="rounded-2xl font-black px-12 h-14 text-xs uppercase bg-secondary text-white shadow-xl shadow-secondary/10">Sync Ledger</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="rounded-[32px] p-10 sm:max-w-md border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight text-secondary">Master Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-6 text-center">
             <div className="bg-slate-50 p-10 rounded-[32px] space-y-3">
               <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto text-primary font-black text-xl mb-4">S9</div>
               <p className="font-black text-secondary text-2xl uppercase tracking-tighter">Krishna's SUPER 9+</p>
               <div className="h-px w-12 bg-slate-200 mx-auto" />
               <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Main Market, New Delhi</p>
               <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">GST: 07AABCU1234F1Z5</p>
             </div>
             <p className="text-slate-400 font-bold text-[10px] leading-relaxed uppercase tracking-[0.2em]">
               Enterprise Identity locked. Contact support to update core shop details.
             </p>
          </div>
          <Button onClick={() => setIsSettingsOpen(false)} className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest bg-secondary text-white">DISMISS</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}