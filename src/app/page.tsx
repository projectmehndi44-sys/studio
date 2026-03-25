
"use client";

import { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  ShoppingBag, 
  LayoutDashboard, 
  Settings, 
  ReceiptText,
  Camera,
  LogOut,
  Bell,
  Star,
  Search,
  X,
  LogIn,
  ShieldCheck,
  PackageSearch,
  Menu,
  MoreVertical
} from 'lucide-react';
import { Product, CartItem } from '@/lib/types';
import { ProductSearch } from '@/components/pos/product-search';
import { QuickTapGrid } from '@/components/pos/quick-tap-grid';
import { CartList } from '@/components/pos/cart-list';
import { CheckoutPanel } from '@/components/pos/checkout-panel';
import { AdminPinDialog } from '@/components/admin/admin-pin-dialog';
import { ProductDialog } from '@/components/pos/product-dialog';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import Link from 'next/link';
import { generatePersonalizedDigitalReceiptAndReviewRequest } from '@/ai/flows/personalized-digital-receipt-and-review-request';
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
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [initialNewName, setInitialNewName] = useState('');
  const [pendingTransaction, setPendingTransaction] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
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

  const { data, isLoading: isProductsLoading } = useCollection<Product>(productsQuery);
  const productsData = data ?? [];

  const cartTotalItems = useMemo(() => 
    cartItems.reduce((acc, item) => acc + item.quantity, 0),
    [cartItems]
  );

  const cartTotalPrice = useMemo(() =>
    cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0),
    [cartItems]
  );

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
      title: "Added to cart",
      description: `${product.name} added.`,
      duration: 1000,
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
    const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const discountPercent = subtotal > 0 ? (data.discount / subtotal) * 100 : 0;

    if (discountPercent > 10) {
      setPendingTransaction(data);
      setIsAdminDialogOpen(true);
      return;
    }

    processFinalSale(data);
  };

  const processFinalSale = async (data: any) => {
    toast({
      title: "Syncing...",
      description: "Saving transaction to cloud.",
    });

    try {
      const purchasesRef = collection(db, 'purchases');
      addDocumentNonBlocking(purchasesRef, {
        staffId: user?.uid || 'anonymous',
        timestamp: serverTimestamp(),
        items: cartItems.map(i => ({ id: i.id, name: i.name, quantity: i.quantity, price: i.price })),
        totalAmount: data.total,
        subtotalAmount: cartTotalPrice,
        discountAmount: data.discount,
        paymentMode: data.paymentMode,
        isOfflineSale: false,
        customerId: data.customerPhone || null
      });

      if (data.customerPhone) {
        generatePersonalizedDigitalReceiptAndReviewRequest({
          customerName: "Valued Customer",
          orderId: `ORD-${Date.now()}`,
          orderItems: cartItems.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
          orderTotal: data.total,
          pdfReceiptLink: "https://super9pos.com/receipt/123",
          reviewLink: "https://g.page/krishnas-super-9/review"
        });
        toast({ title: "WhatsApp Sent", description: "Digital receipt shared." });
      }

      setCartItems([]);
      setPendingTransaction(null);
      setActiveMainTab('products');
      
      toast({
        title: "Sale Completed",
        description: `Total Amount: ₹${data.total.toFixed(2)}`,
      });

    } catch (error) {
      toast({ title: "Checkout Error", description: "Something went wrong.", variant: "destructive" });
    }
  };

  const handleStaffLogin = () => {
    initiateAnonymousSignIn(auth);
  };

  const handleSignOut = () => {
    auth.signOut();
    toast({ title: "Logged Out", description: "Staff session ended." });
  };

  const handleAddNewProduct = (initialName: string, isSilent = false) => {
    if (isSilent) {
      addDocumentNonBlocking(collection(db, 'products'), {
        name: initialName,
        price: 0,
        costPrice: 0,
        barcode: '',
        category: 'General',
        stock: null,
        isPopular: false,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return;
    }
    
    setInitialNewName(initialName);
    setEditingProduct(null);
    setIsProductDialogOpen(true);
  };

  if (isUserLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-primary rounded-3xl animate-bounce flex items-center justify-center font-black text-2xl text-primary-foreground shadow-2xl shadow-primary/20">
            S9
          </div>
          <p className="text-slate-400 font-black animate-pulse uppercase tracking-widest text-xs">Initializing Terminal</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white rounded-[48px] shadow-2xl border border-slate-100 p-12 text-center space-y-8 animate-in zoom-in-95 duration-500">
          <div className="mx-auto w-24 h-24 bg-primary/10 rounded-[32px] flex items-center justify-center">
            <ShieldCheck className="h-12 w-12 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight text-slate-900">SUPER 9+ POS</h1>
            <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Billing Terminal v2.0</p>
          </div>
          <Button 
            onClick={handleStaffLogin}
            className="w-full h-20 text-xl font-black rounded-3xl shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <LogIn className="mr-3 h-6 w-6" /> CLOCK IN
          </Button>
          <p className="text-xs text-slate-400 font-medium">Authorized Personnel Only • Encrypted Session</p>
        </div>
      </div>
    );
  }

  const productArea = (
    <div className="flex flex-col h-full gap-4 overflow-hidden">
      <ProductSearch 
        products={productsData}
        onProductSelect={handleProductSelect} 
        onScanClick={() => setIsScanning(!isScanning)} 
        onAddNewProduct={handleAddNewProduct}
      />
      
      <Tabs defaultValue="popular" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 rounded-[16px] mb-2">
          <TabsTrigger value="popular" className="font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 rounded-[12px] py-2 data-[state=active]:bg-white data-[state=active]:text-primary">
            <Star className="h-3 w-3" /> Top Sellers
          </TabsTrigger>
          <TabsTrigger value="search" className="font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 rounded-[12px] py-2 data-[state=active]:bg-white data-[state=active]:text-primary">
            <Search className="h-3 w-3" /> All Items
          </TabsTrigger>
        </TabsList>
        <TabsContent value="popular" className="flex-1 overflow-y-auto custom-scrollbar mt-0">
          <QuickTapGrid products={productsData} onProductSelect={handleProductSelect} />
        </TabsContent>
        <TabsContent value="search" className="flex-1 flex flex-col overflow-hidden mt-0">
           <QuickTapGrid products={productsData} onProductSelect={handleProductSelect} showAll />
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden font-body text-slate-900">
      <Toaster />
      
      {/* Top Navigation Bar (Replacing Sidebar) */}
      <header className="h-16 border-b border-slate-100 bg-white flex items-center justify-between px-4 sm:px-8 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center font-black text-primary-foreground shadow-lg shadow-primary/10">
            S9
          </div>
          <h1 className="font-black text-xl tracking-tighter text-slate-900 uppercase">Super 9+</h1>
        </div>
        
        <div className="flex items-center gap-2">
          {!isMobile && (
            <div className="flex items-center gap-1 mr-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="font-black text-xs uppercase tracking-widest text-primary">
                  <ShoppingBag className="h-4 w-4 mr-2" /> Billing
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="font-black text-xs uppercase tracking-widest text-slate-400 hover:text-primary">
                  <LayoutDashboard className="h-4 w-4 mr-2" /> Ledger
                </Button>
              </Link>
              <Button onClick={() => setIsProductDialogOpen(true)} variant="ghost" size="sm" className="font-black text-xs uppercase tracking-widest text-slate-400 hover:text-primary">
                <PackageSearch className="h-4 w-4 mr-2" /> Master
              </Button>
            </div>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-xl">
                <Menu className="h-6 w-6 text-slate-600" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] p-6 space-y-8">
              <SheetHeader>
                <SheetTitle className="text-left font-black uppercase tracking-tighter text-2xl">Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4">
                <Link href="/" className="flex items-center gap-4 p-4 bg-primary/10 text-primary rounded-2xl font-black uppercase text-sm">
                  <ShoppingBag className="h-5 w-5" /> Billing Terminal
                </Link>
                <Link href="/dashboard" className="flex items-center gap-4 p-4 hover:bg-slate-50 text-slate-600 rounded-2xl font-black uppercase text-sm transition-colors">
                  <LayoutDashboard className="h-5 w-5" /> Business Ledger
                </Link>
                <button onClick={() => { setIsProductDialogOpen(true); }} className="flex items-center gap-4 p-4 hover:bg-slate-50 text-slate-600 rounded-2xl font-black uppercase text-sm transition-colors w-full text-left">
                  <PackageSearch className="h-5 w-5" /> Product Master
                </button>
                <button className="flex items-center gap-4 p-4 hover:bg-slate-50 text-slate-600 rounded-2xl font-black uppercase text-sm transition-colors w-full text-left">
                  <Bell className="h-5 w-5" /> Notifications
                </button>
                <button className="flex items-center gap-4 p-4 hover:bg-slate-50 text-slate-600 rounded-2xl font-black uppercase text-sm transition-colors w-full text-left">
                  <Settings className="h-5 w-5" /> Settings
                </button>
                <div className="pt-8 mt-auto">
                  <Button onClick={handleSignOut} variant="destructive" className="w-full h-14 font-black rounded-2xl gap-2">
                    <LogOut className="h-5 w-5" /> CLOCK OUT
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className={cn(
        "flex-1 overflow-hidden",
        !isMobile ? "grid grid-cols-[1fr_400px] h-full" : "flex flex-col"
      )}>
        {isMobile ? (
          <div className="flex flex-col h-full overflow-hidden p-4 gap-4">
            <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-3 bg-slate-100 rounded-[16px] p-1 mb-4">
                <TabsTrigger value="products" className="font-black text-xs uppercase rounded-[12px]">Catalog</TabsTrigger>
                <TabsTrigger value="cart" className="font-black text-xs uppercase rounded-[12px] relative">
                  Cart
                  {cartTotalItems > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 rounded-full bg-destructive text-white border-2 border-white text-[9px] font-black">
                      {cartTotalItems}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="checkout" className="font-black text-xs uppercase rounded-[12px]" disabled={cartItems.length === 0}>Finish</TabsTrigger>
              </TabsList>
              
              <TabsContent value="products" className="flex-1 overflow-hidden mt-0">
                {productArea}
              </TabsContent>
              
              <TabsContent value="cart" className="flex-1 overflow-hidden mt-0">
                <CartList 
                  items={cartItems} 
                  onUpdateQuantity={updateQuantity} 
                  onUpdatePrice={updatePrice}
                  onRemoveItem={removeItem} 
                />
              </TabsContent>
              
              <TabsContent value="checkout" className="flex-1 overflow-hidden mt-0">
                <CheckoutPanel 
                  items={cartItems} 
                  onComplete={handleCheckout} 
                />
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <>
            {/* Desktop: Product Selection Area */}
            <div className="p-8 overflow-hidden border-r border-slate-100 bg-slate-50/30">
              {productArea}
            </div>

            {/* Desktop: Cart & Checkout Panel Area */}
            <div className="flex flex-col h-full bg-white overflow-hidden">
               <div className="flex-1 p-8 overflow-hidden flex flex-col gap-8">
                 <div className="flex-1 overflow-hidden">
                   <CartList 
                    items={cartItems} 
                    onUpdateQuantity={updateQuantity} 
                    onUpdatePrice={updatePrice}
                    onRemoveItem={removeItem} 
                  />
                 </div>
                 <div className="shrink-0">
                    <CheckoutPanel 
                      items={cartItems} 
                      onComplete={handleCheckout} 
                    />
                 </div>
               </div>
            </div>
          </>
        )}
      </main>

      <AdminPinDialog 
        isOpen={isAdminDialogOpen} 
        onClose={() => setIsAdminDialogOpen(false)} 
        onSuccess={() => {
          setIsAdminDialogOpen(false);
          processFinalSale(pendingTransaction);
        }}
        requiredFor="Authorize discount exceeding 10%"
      />

      <ProductDialog 
        isOpen={isProductDialogOpen}
        onClose={() => {
          setIsProductDialogOpen(false);
          setEditingProduct(null);
          setInitialNewName('');
        }}
        product={editingProduct}
        initialName={initialNewName}
      />

      {isScanning && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-8 animate-in fade-in">
          <button onClick={() => setIsScanning(false)} className="absolute top-10 right-10 text-white p-4 transition-transform hover:scale-110 active:scale-90">
             <X className="h-12 w-12" />
          </button>
          <div className="w-full max-w-2xl aspect-[4/3] bg-white/5 border-4 border-dashed border-primary rounded-[64px] flex flex-col items-center justify-center text-center">
            <Camera className="h-32 w-32 text-primary mb-8 animate-pulse" />
            <h2 className="text-4xl font-black text-white mb-3 tracking-tight">SCANNING...</h2>
            <p className="text-xl text-slate-400 font-medium">Place barcode within the frame</p>
          </div>
        </div>
      )}
    </div>
  );
}
