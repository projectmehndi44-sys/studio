
"use client";

import { useState, useCallback, useEffect } from 'react';
import { 
  ShoppingBag, 
  LayoutDashboard, 
  Menu,
  LogOut,
  PackageSearch,
  LogIn,
  ShieldCheck
} from 'lucide-react';
import { Product, CartItem } from '@/lib/types';
import { ProductSearch } from '@/components/pos/product-search';
import { CartList } from '@/components/pos/cart-list';
import { CheckoutPanel } from '@/components/pos/checkout-panel';
import { ProductDialog } from '@/components/pos/product-dialog';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import Link from 'next/link';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCollection, useFirestore, useUser, useMemoFirebase, addDocumentNonBlocking, initiateAnonymousSignIn, useAuth } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const CART_STORAGE_KEY = 'super9_pos_current_cart';

export default function POSPage() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const db = useFirestore();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState('products');

  // Load cart from local storage on mount
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

  // Save cart to local storage on change
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
      item.id === id ? { ...item, price: newPrice } : item
    ));
  };

  const removeItem = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const handleCheckout = async (data: any) => {
    toast({ title: "Saving...", description: "Recording sale in ledger." });

    const purchasesRef = collection(db, 'purchases');
    addDocumentNonBlocking(purchasesRef, {
      staffId: user?.uid || 'anonymous',
      timestamp: serverTimestamp(),
      items: cartItems.map(i => ({ id: i.id, name: i.name, quantity: i.quantity, price: i.price })),
      totalAmount: data.total,
      subtotalAmount: cartItems.reduce((acc, i) => acc + (i.price * i.quantity), 0),
      discountAmount: data.discount || 0,
      paymentMode: data.paymentMode,
      isOfflineSale: false,
      customerId: data.customerPhone || null
    });

    setCartItems([]);
    setActiveMainTab('products');
    toast({
      title: "Sale Completed",
      description: `Bill saved successfully.`,
    });
  };

  const handleAddNewProduct = (name: string) => {
    // Automatic direct add
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
    
    // Add to Firestore catalog
    addDocumentNonBlocking(collection(db, 'products'), {
      ...newProd,
      isActive: true,
      createdAt: new Date().toISOString()
    });

    // Add to current cart
    handleProductSelect(newProd);
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
      
      {/* Simplified Header */}
      <header className="h-16 border-b border-slate-100 bg-white flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center font-black text-primary-foreground shadow-lg shadow-primary/10">S9</div>
          <h1 className="font-black text-xl tracking-tighter uppercase">Super 9+ Billing</h1>
        </div>
        
        <div className="flex items-center gap-2">
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

      <main className={cn("flex-1 overflow-hidden", !isMobile ? "grid grid-cols-[1fr_400px] h-full" : "flex flex-col")}>
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
            {/* Desktop View: Search & Cart on Left, Checkout on Right */}
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

      <ProductDialog 
        isOpen={isProductDialogOpen}
        onClose={() => setIsProductDialogOpen(false)}
      />
    </div>
  );
}
