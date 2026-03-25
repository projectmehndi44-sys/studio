
"use client";

import { useState, useCallback, useEffect } from 'react';
import { 
  ShoppingBag, 
  LayoutDashboard, 
  Settings, 
  ReceiptText,
  Camera,
  LogOut,
  Bell
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

export default function POSPage() {
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);

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
      // 1. Digital Receipt via GenAI
      if (data.customerPhone) {
        const aiResponse = await generatePersonalizedDigitalReceiptAndReviewRequest({
          customerName: "Valued Customer",
          orderId: `ORD-${Date.now()}`,
          orderItems: cartItems.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
          orderTotal: data.total,
          pdfReceiptLink: "https://super9pos.com/receipt/123",
          reviewLink: "https://g.page/krishnas-super-9/review"
        });
        
        console.log("WhatsApp Message Prepared:", aiResponse.whatsappMessage);
        toast({ title: "WhatsApp Sent", description: "Digital receipt shared with customer." });
      }

      // 2. Clear Cart
      setCartItems([]);
      setPendingTransaction(null);
      
      toast({
        title: "Sale Completed",
        description: `Total Amount: ₹${data.total.toFixed(2)}`,
        variant: "default",
      });

      // Special case for Credit/Udhaar: Auto-print 2 copies logic placeholder
      if (data.paymentMode === 'Credit') {
        toast({ title: "Credit Sale", description: "Printing 2 copies for shop and customer." });
      }

    } catch (error) {
      toast({ title: "Checkout Error", description: "Something went wrong.", variant: "destructive" });
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden font-body">
      <Toaster />
      
      {/* Sidebar Navigation */}
      <aside className="w-20 bg-secondary flex flex-col items-center py-6 gap-8 border-r">
        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center font-black text-xl text-primary-foreground shadow-lg shadow-primary/20">
          S9+
        </div>
        <nav className="flex-1 flex flex-col gap-4">
          <Link href="/" className="p-3 bg-primary/20 text-primary rounded-xl transition-all"><ShoppingBag className="h-7 w-7" /></Link>
          <Link href="/dashboard" className="p-3 text-muted-foreground hover:bg-secondary-foreground/10 rounded-xl transition-all"><LayoutDashboard className="h-7 w-7" /></Link>
          <button className="p-3 text-muted-foreground hover:bg-secondary-foreground/10 rounded-xl transition-all"><ReceiptText className="h-7 w-7" /></button>
          <button className="p-3 text-muted-foreground hover:bg-secondary-foreground/10 rounded-xl transition-all"><Bell className="h-7 w-7" /></button>
        </nav>
        <div className="flex flex-col gap-4">
          <button className="p-3 text-muted-foreground hover:bg-secondary-foreground/10 rounded-xl transition-all"><Settings className="h-7 w-7" /></button>
          <button className="p-3 text-destructive hover:bg-destructive/10 rounded-xl transition-all"><LogOut className="h-7 w-7" /></button>
        </div>
      </aside>

      {/* Main POS Interface */}
      <main className="flex-1 pos-grid-container p-6 gap-6">
        {/* Left Side: Cart */}
        <div className="flex flex-col h-full overflow-hidden">
          <CartList 
            items={cartItems} 
            onUpdateQuantity={updateQuantity} 
            onRemoveItem={removeItem} 
          />
        </div>

        {/* Right Side: Product Search & Quick Grid & Checkout Toggle */}
        <div className="flex flex-col h-full gap-6">
          <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
            {/* Middle: Selection Area */}
            <div className="flex-1 flex flex-col gap-6 overflow-hidden">
              <ProductSearch 
                onProductSelect={handleProductSelect} 
                onScanClick={() => setIsScanning(!isScanning)} 
              />
              
              <div className="flex-1 overflow-hidden flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-black text-foreground uppercase tracking-wider">Top Selling Items</h2>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <QuickTapGrid onProductSelect={handleProductSelect} />
                </div>
              </div>
            </div>

            {/* Right: Checkout */}
            <div className="w-full lg:w-[420px] h-full flex flex-col">
              <CheckoutPanel 
                items={cartItems} 
                onComplete={handleCheckout} 
              />
            </div>
          </div>
        </div>
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

      {/* Scan Mode Overlay (Placeholder) */}
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
             <p className="text-primary font-bold tracking-[0.2em]">CAMERA CONTINUOUS-SCAN ACTIVE</p>
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
