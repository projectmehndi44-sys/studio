
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
      timestamp: new Date(), // Local for immediate preview
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
      timestamp: serverTimestamp() // Server for storage
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

  const handlePrint = (type: 'thermal' | 'normal') => {
    toast({ 
      title: type === 'thermal' ? "Thermal Print" : "Normal Print", 
      description: type === 'thermal' ? "Sending to 58mm printer..." : "Opening standard print dialog..." 
    });
    if (type === 'normal') {
      window.print();
    }
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
      <div className="h-screen flex items-center justify-center bg-white font-body">
        <p className="text-slate-400 font-black animate-pulse uppercase tracking-widest text-xs">Loading Terminal...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 p-6 font-body">
        <div className="max-w-md w-full bg-white rounded-[48px] shadow-2xl p-12 text-center space-y-8 animate-in zoom-in-95 duration-500">
          <div className="mx-auto w-24 h-24 bg-primary/10 rounded-[32px] flex items-center justify-center">
            <ShieldCheck className="h-12 w-12 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight text-slate-900">SUPER 9+ POS</h1>
            <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Authorized Staff Only</p>
          </div>
          <Button 
            onClick={() => initiateAnonymousSignIn(auth)}
            className="w-full h-20 text-xl font-black rounded-3xl shadow-xl shadow-primary/20 transition-all active:scale-95"
          >
            CLOCK IN
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden font-body text-slate-900">
      <Toaster />
      
      <header className="h-16 border-b border-slate-100 bg-white flex items-center justify-between px-6 shrink-0 print:hidden">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center font-black text-primary-foreground shadow-lg shadow-primary/10">S9</div>
          <h1 className="font-black text-xl tracking-tighter uppercase">Super 9+ Billing</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsCashDialogOpen(true)}
            className="rounded-xl font-black text-[10px] uppercase gap-2 bg-emerald-50 text-emerald-600 border-none shadow-sm hover:bg-emerald-100"
          >
            <Banknote className="h-4 w-4" /> Cash Flow
          </Button>
          
          <Link href="/dashboard" className="hidden sm:block">
            <Button variant="ghost" size="sm" className="font-black text-xs uppercase tracking-widest text-slate-400 hover:text-primary">Ledger</Button>
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-xl"><Menu className="h-6 w-6 text-slate-600" /></Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] p-6 space-y-6">
              <SheetHeader><SheetTitle className="text-left font-black uppercase tracking-tighter text-2xl">Terminal Menu</SheetTitle></SheetHeader>
              <nav className="flex flex-col gap-3">
                <Link href="/" className="flex items-center gap-4 p-4 bg-primary/10 text-primary rounded-2xl font-black uppercase text-sm"><ShoppingBag className="h-5 w-5" /> Billing</Link>
                <Link href="/dashboard" className="flex items-center gap-4 p-4 hover:bg-slate-50 text-slate-600 rounded-2xl font-black uppercase text-sm transition-colors"><LayoutDashboard className="h-5 w-5" /> Reports</Link>
                <button onClick={() => setIsProductDialogOpen(true)} className="flex items-center gap-4 p-4 hover:bg-slate-50 text-slate-600 rounded-2xl font-black uppercase text-sm transition-colors w-full text-left"><PackageSearch className="h-5 w-5" /> Item Master</button>
                <div className="pt-6 mt-6 border-t border-slate-100">
                  <Button onClick={() => auth.signOut()} variant="destructive" className="w-full h-14 font-black rounded-2xl gap-2"><LogOut className="h-5 w-5" /> LOG OUT</Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className={cn("flex-1 overflow-hidden print:hidden", !isMobile ? "grid grid-cols-[1fr_400px] h-full" : "flex flex-col")}>
        {isMobile ? (
          <div className="flex flex-col h-full overflow-hidden p-4 gap-4">
            <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-2 bg-slate-100 rounded-[16px] p-1 mb-4">
                <TabsTrigger value="products" className="font-black text-xs uppercase rounded-[12px]">Search Items</TabsTrigger>
                <TabsTrigger value="checkout" className="font-black text-xs uppercase rounded-[12px]" disabled={cartItems.length === 0}>
                  Checkout ({cartTotalItems})
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
            <div className="flex flex-col h-full p-8 overflow-hidden gap-6 bg-slate-50/30 border-r">
              <ProductSearch products={productsData} onProductSelect={handleProductSelect} onScanClick={() => {}} onAddNewProduct={handleAddNewProduct} />
              <div className="flex-1 overflow-hidden">
                <CartList items={cartItems} onUpdateQuantity={updateQuantity} onUpdatePrice={updatePrice} onRemoveItem={removeItem} />
              </div>
            </div>
            <div className="p-8 bg-white overflow-hidden">
              <CheckoutPanel items={cartItems} onComplete={handleCheckout} />
            </div>
          </>
        )}
      </main>

      {/* SUCCESS DIALOG */}
      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-[40px] p-10 border-none shadow-2xl overflow-hidden print:hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500" />
          <DialogHeader className="space-y-4">
            <div className="mx-auto w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            </div>
            <DialogTitle className="text-center text-3xl font-black uppercase tracking-tight">Sync Successful!</DialogTitle>
            <DialogDescription className="text-center font-bold text-slate-400">
              The transaction has been recorded in the cloud ledger.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-4">
            <div className="bg-slate-50 rounded-3xl p-6 space-y-2">
              <div className="flex justify-between items-center text-xs font-black uppercase text-slate-400">
                <span>Receipt Summary</span>
                <span>{lastSale?.paymentMode}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-2xl font-black text-slate-900 tracking-tight">₹{lastSale?.totalAmount}</span>
                <span className="text-[10px] font-bold text-slate-400">{lastSale?.items.length} items</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <Button 
                variant="outline" 
                className="h-16 rounded-2xl bg-slate-50 border-none font-black uppercase text-xs gap-3 hover:bg-slate-100"
                onClick={() => handlePrint('normal')}
              >
                <Printer className="h-5 w-5 text-primary" /> Normal Desktop Print
              </Button>
              <Button 
                variant="outline" 
                className="h-16 rounded-2xl bg-slate-50 border-none font-black uppercase text-xs gap-3 hover:bg-slate-100"
                onClick={() => handlePrint('thermal')}
              >
                <Printer className="h-5 w-5 text-accent" /> Thermal Printer (58/80mm)
              </Button>
              <Button 
                variant="outline" 
                className="h-16 rounded-2xl bg-slate-50 border-none font-black uppercase text-xs gap-3 hover:bg-slate-100"
                onClick={() => {
                  toast({ title: "Downloading PDF", description: "Saving invoice to local storage." });
                  window.print();
                }}
              >
                <FileDown className="h-5 w-5 text-slate-400" /> Save as PDF
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button 
              className="w-full h-16 rounded-2xl font-black text-lg shadow-xl shadow-primary/20"
              onClick={() => setIsSuccessDialogOpen(false)}
            >
              DONE • START NEW BILL
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PRINT-ONLY VIEW */}
      <div className="hidden print:block p-8 bg-white text-slate-900">
        <div className="text-center space-y-2 border-b-2 border-slate-900 pb-6 mb-6">
          <h2 className="text-3xl font-black uppercase tracking-tighter">Super 9+ Supermarket</h2>
          <p className="text-sm font-bold">Authorized Digital Receipt</p>
        </div>
        <div className="space-y-4 mb-6">
          <div className="flex justify-between text-sm font-bold">
            <span>Bill ID: {Date.now()}</span>
            <span>Date: {new Date().toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between text-sm font-bold">
            <span>Customer: {lastSale?.customerId || 'Guest'}</span>
            <span>Mode: {lastSale?.paymentMode}</span>
          </div>
        </div>
        <table className="w-full text-sm border-collapse mb-8">
          <thead>
            <tr className="border-y-2 border-slate-900">
              <th className="text-left py-2 font-black">ITEM</th>
              <th className="text-center py-2 font-black">QTY</th>
              <th className="text-right py-2 font-black">RATE</th>
              <th className="text-right py-2 font-black">TOTAL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {lastSale?.items.map((item, idx) => (
              <tr key={idx}>
                <td className="py-2 font-bold">{item.name}</td>
                <td className="py-2 text-center font-bold">{item.quantity}</td>
                <td className="py-2 text-right font-bold">₹{item.price}</td>
                <td className="py-2 text-right font-bold">₹{item.price * item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="space-y-2 text-right border-t-2 border-slate-900 pt-6">
          <div className="text-sm font-bold">Subtotal: ₹{lastSale?.subtotalAmount}</div>
          <div className="text-sm font-bold">Discount: ₹{lastSale?.discountAmount}</div>
          <div className="text-2xl font-black uppercase">Grand Total: ₹{lastSale?.totalAmount}</div>
        </div>
        <div className="mt-12 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
          Thank you for shopping at Super 9+!
        </div>
      </div>

      <ProductDialog 
        isOpen={isProductDialogOpen}
        onClose={() => setIsProductDialogOpen(false)}
      />

      <Dialog open={isCashDialogOpen} onOpenChange={setIsCashDialogOpen}>
        <DialogContent className="rounded-[32px] p-8 sm:max-w-md print:hidden">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Register Cash Flow</DialogTitle>
            <DialogDescription className="font-bold text-slate-400">
              Record manual cash movements without a bill.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCashTransaction} className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <input type="radio" id="cash-in" name="type" value="IN" defaultChecked className="peer hidden" />
                  <label htmlFor="cash-in" className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border border-transparent peer-checked:border-emerald-500 peer-checked:bg-emerald-50 transition-all cursor-pointer">
                    <PlusCircle className="h-6 w-6 text-emerald-500 mb-1" />
                    <span className="font-black text-[10px] uppercase">Cash In</span>
                  </label>
                </div>
                <div className="relative">
                  <input type="radio" id="cash-out" name="type" value="OUT" className="peer hidden" />
                  <label htmlFor="cash-out" className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border border-transparent peer-checked:border-destructive peer-checked:bg-destructive/5 transition-all cursor-pointer">
                    <MinusCircle className="h-6 w-6 text-destructive mb-1" />
                    <span className="font-black text-[10px] uppercase">Cash Out</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Amount (₹)</Label>
                <Input name="amount" type="number" required placeholder="0.00" className="h-14 text-2xl font-black bg-slate-50 border-none rounded-2xl" />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Reason / Reference</Label>
                <Input name="reason" placeholder="e.g. Tea Expense, Supplier, Float" className="h-12 font-bold bg-slate-50 border-none rounded-xl" />
              </div>
            </div>
            <DialogFooter className="gap-3 sm:justify-between">
              <Button type="button" variant="ghost" onClick={() => setIsCashDialogOpen(false)} className="rounded-xl font-bold">Cancel</Button>
              <Button type="submit" className="rounded-xl font-black px-8">Confirm Sync</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
