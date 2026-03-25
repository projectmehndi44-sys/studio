"use client";

import { useState, useCallback, useMemo } from 'react';
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
  Wallet
} from 'lucide-react';
import { Product, CartItem } from '@/lib/types';
import { ProductSearch } from '@/components/pos/product-search';
import { QuickTapGrid } from '@/components/pos/quick-tap-grid';
import { CartList } from '@/components/pos/cart-list';
import { CheckoutPanel } from '@/components/pos/checkout-panel';
import { AdminPinDialog } from '@/components/admin/admin-pin-dialog';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import Link from 'next/link';
import { generatePersonalizedDigitalReceiptAndReviewRequest } from '@/ai/flows/personalized-digital-receipt-and-review-request';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function POSPage() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState('products');

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

  const removeItem = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const handleCheckout = async (data: any) => {
    const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const discountPercent = (data.discount / subtotal) * 100;

    if (discountPercent > 10) {
      setPendingTransaction(data);
      setIsAdminDialogOpen(true);
      return;
    }

    processFinalSale(data);
  };

  const processFinalSale = async (data: any) => {
    toast({
      title: "Processing Sale...",
      description: "Generating digital receipt and updating stock.",
    });

    try {
      if (data.customerPhone) {
        await generatePersonalizedDigitalReceiptAndReviewRequest({
          customerName: "Valued Customer",
          orderId: `ORD-${Date.now()}`,
          orderItems: cartItems.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
          orderTotal: data.total,
          pdfReceiptLink: "https://super9pos.com/receipt/123",
          reviewLink: "https://g.page/krishnas-super-9/review"
        });
        toast({ title: "WhatsApp Sent", description: "Digital receipt shared with customer." });
      }

      setCartItems([]);
      setPendingTransaction(null);
      setActiveMainTab('products');
      
      toast({
        title: "Sale Completed",
        description: `Total Amount: ₹${data.total.toFixed(2)}`,
        variant: "default",
      });

      if (data.paymentMode === 'Credit') {
        toast({ title: "Credit Sale", description: "Printing 2 copies for shop and customer." });
      }

    } catch (error) {
      toast({ title: "Checkout Error", description: "Something went wrong.", variant: "destructive" });
    }
  };

  const sidebarContent = (
    <nav className={cn(
      "flex gap-4",
      isMobile ? "flex-row justify-around w-full px-4 pb-4" : "flex-col items-center py-6 gap-8 w-20 border-r bg-secondary"
    )}>
      {!isMobile && (
        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center font-black text-xl text-primary-foreground shadow-lg shadow-primary/20 mb-4">
          S9+
        </div>
      )}
      <Link href="/" className="p-3 bg-primary/20 text-primary rounded-xl transition-all"><ShoppingBag className="h-7 w-7" /></Link>
      <Link href="/dashboard" className="p-3 text-muted-foreground hover:bg-secondary-foreground/10 rounded-xl transition-all"><LayoutDashboard className="h-7 w-7" /></Link>
      <button className="p-3 text-muted-foreground hover:bg-secondary-foreground/10 rounded-xl transition-all"><ReceiptText className="h-7 w-7" /></button>
      {!isMobile && (
        <>
          <button className="p-3 text-muted-foreground hover:bg-secondary-foreground/10 rounded-xl transition-all"><Bell className="h-7 w-7" /></button>
          <div className="flex-1" />
          <button className="p-3 text-muted-foreground hover:bg-secondary-foreground/10 rounded-xl transition-all"><Settings className="h-7 w-7" /></button>
          <button className="p-3 text-destructive hover:bg-destructive/10 rounded-xl transition-all"><LogOut className="h-7 w-7" /></button>
        </>
      )}
    </nav>
  );

  const productArea = (
    <div className="flex flex-col h-full gap-4 overflow-hidden">
      <div className="flex items-center gap-2">
        <ProductSearch 
          onProductSelect={handleProductSelect} 
          onScanClick={() => setIsScanning(!isScanning)} 
        />
      </div>
      
      <Tabs defaultValue="popular" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="grid w-full grid-cols-2 bg-secondary/50 p-1 rounded-lg">
          <TabsTrigger value="popular" className="font-bold flex items-center gap-2">
            <Star className="h-4 w-4" /> TOP SELLING
          </TabsTrigger>
          <TabsTrigger value="search" className="font-bold flex items-center gap-2">
            <Search className="h-4 w-4" /> ALL ITEMS
          </TabsTrigger>
        </TabsList>
        <TabsContent value="popular" className="flex-1 overflow-y-auto custom-scrollbar pt-4 data-[state=inactive]:hidden">
          <QuickTapGrid onProductSelect={handleProductSelect} />
        </TabsContent>
        <TabsContent value="search" className="flex-1 flex items-center justify-center text-muted-foreground p-8 text-center data-[state=inactive]:hidden">
          <div className="space-y-2">
            <Search className="h-12 w-12 mx-auto opacity-20" />
            <p>Use the search bar above to find specific items in the full catalogue.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <div className={cn(
      "flex h-screen bg-background overflow-hidden font-body",
      isMobile ? "flex-col" : "flex-row"
    )}>
      <Toaster />
      
      {!isMobile && sidebarContent}

      <main className={cn(
        "flex-1 p-4 lg:p-6 gap-6",
        !isMobile ? "pos-grid-container" : "flex flex-col h-full overflow-hidden"
      )}>
        {isMobile ? (
          <div className="flex flex-col h-full overflow-hidden">
             {/* Mobile Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-black text-sm text-primary-foreground">
                  S9+
                </div>
                <h1 className="font-black text-lg tracking-tight">SUPER 9+</h1>
              </div>
              {cartTotalPrice > 0 && (
                <div className="text-primary font-black text-lg">
                  ₹{cartTotalPrice.toFixed(2)}
                </div>
              )}
            </div>

            <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-3 bg-secondary mb-4">
                <TabsTrigger value="products" className="font-bold">CATALOG</TabsTrigger>
                <TabsTrigger value="cart" className="font-bold relative">
                  CART
                  {cartTotalItems > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 rounded-full bg-primary text-primary-foreground text-[10px]">
                      {cartTotalItems}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="checkout" className="font-bold" disabled={cartItems.length === 0}>PAY</TabsTrigger>
              </TabsList>
              
              <TabsContent value="products" className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden">
                {productArea}
              </TabsContent>
              
              <TabsContent value="cart" className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden">
                <CartList 
                  items={cartItems} 
                  onUpdateQuantity={updateQuantity} 
                  onRemoveItem={removeItem} 
                />
              </TabsContent>
              
              <TabsContent value="checkout" className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden">
                <CheckoutPanel 
                  items={cartItems} 
                  onComplete={handleCheckout} 
                />
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <>
            <div className="flex flex-col h-full overflow-hidden">
              <CartList 
                items={cartItems} 
                onUpdateQuantity={updateQuantity} 
                onRemoveItem={removeItem} 
              />
            </div>

            <div className="flex flex-col lg:flex-row h-full gap-6 overflow-hidden">
              <div className="flex-1 overflow-hidden">
                {productArea}
              </div>
              <div className="w-full lg:w-[420px] h-full flex flex-col">
                <CheckoutPanel 
                  items={cartItems} 
                  onComplete={handleCheckout} 
                />
              </div>
            </div>
          </>
        )}
      </main>

      {isMobile && (
        <div className="border-t bg-secondary/30">
          {sidebarContent}
        </div>
      )}

      <AdminPinDialog 
        isOpen={isAdminDialogOpen} 
        onClose={() => setIsAdminDialogOpen(false)} 
        onSuccess={() => {
          setIsAdminDialogOpen(false);
          processFinalSale(pendingTransaction);
        }}
        requiredFor="Authorize discount exceeding 10%"
      />

      {isScanning && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-8 animate-in fade-in">
          <button onClick={() => setIsScanning(false)} className="absolute top-8 right-8 text-white p-4">
            <X className="h-10 w-10" />
          </button>
          <div className="w-full max-w-2xl aspect-[4/3] bg-muted border-4 border-dashed border-primary rounded-3xl flex flex-col items-center justify-center text-center">
            <Camera className="h-24 w-24 text-primary mb-6 animate-pulse" />
            <h2 className="text-3xl font-black text-white mb-2">SCANNING...</h2>
            <p className="text-xl text-muted-foreground">Align barcode within the frame</p>
          </div>
          <div className="mt-12 flex gap-4">
             <div className="w-3 h-3 bg-primary rounded-full animate-ping" />
             <p className="text-primary font-bold tracking-[0.2em]">CAMERA ACTIVE</p>
          </div>
        </div>
      )}
    </div>
  );
}

function X({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  );
}