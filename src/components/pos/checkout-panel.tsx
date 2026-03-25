"use client";

import { useState, useMemo } from 'react';
import { User, CreditCard, Wallet, Smartphone, Printer, Ticket } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MOCK_CUSTOMERS, MOCK_COUPONS } from '@/lib/mock-data';
import { Badge } from '@/components/ui/badge';
import { CartItem, Coupon } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CheckoutPanelProps {
  items: CartItem[];
  onComplete: (data: {
    total: number;
    paymentMode: string;
    customerPhone: string;
    discount: number;
  }) => void;
}

export function CheckoutPanel({ items, onComplete }: CheckoutPanelProps) {
  const { toast } = useToast();
  const [phone, setPhone] = useState('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Credit'>('Cash');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  const customer = useMemo(() => {
    return MOCK_CUSTOMERS.find(c => c.phone === phone);
  }, [phone]);

  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }, [items]);

  const discount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (subtotal < appliedCoupon.minBill) return 0;
    
    let d = appliedCoupon.type === 'flat' 
      ? appliedCoupon.value 
      : (subtotal * appliedCoupon.value) / 100;
      
    if (appliedCoupon.maxDiscount) {
      d = Math.min(d, appliedCoupon.maxDiscount);
    }
    return d;
  }, [subtotal, appliedCoupon]);

  const total = subtotal - discount;

  const handleApplyBestCoupon = () => {
    const validCoupons = MOCK_COUPONS.filter(c => subtotal >= c.minBill);
    if (validCoupons.length === 0) {
      toast({ title: "No valid coupons", description: "Cart value too low." });
      return;
    }
    const best = validCoupons.sort((a, b) => {
      const da = a.type === 'flat' ? a.value : (subtotal * a.value) / 100;
      const db = b.type === 'flat' ? b.value : (subtotal * b.value) / 100;
      return db - da;
    })[0];
    setAppliedCoupon(best);
  };

  return (
    <div className="flex flex-col h-full bg-card p-4 sm:p-6 rounded-xl border border-border shadow-2xl overflow-hidden">
      <ScrollArea className="flex-1">
        <div className="space-y-6 pb-4">
          {/* Customer Info */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Customer Details</label>
            <div className="relative">
              <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone Number"
                className="pl-10 h-12 text-lg font-medium bg-secondary/50"
              />
            </div>
            {customer && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center justify-between animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="bg-primary rounded-full p-2">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">{customer.name}</p>
                    <p className="text-[10px] text-muted-foreground">Points: {customer.points}</p>
                  </div>
                </div>
                <Badge className="bg-primary text-primary-foreground text-[10px] h-5">Member</Badge>
              </div>
            )}
          </div>

          {/* Coupons */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Discounts</label>
              <Button variant="link" size="sm" onClick={handleApplyBestCoupon} className="text-primary p-0 h-auto font-bold text-xs">
                <Ticket className="h-3 w-3 mr-1" /> Apply Best
              </Button>
            </div>
            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-accent/20 border border-accent/30 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-accent" />
                  <span className="font-bold text-sm">{appliedCoupon.code} Applied</span>
                </div>
                <button onClick={() => setAppliedCoupon(null)} className="text-[10px] text-muted-foreground underline">Remove</button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No coupon applied</p>
            )}
          </div>

          {/* Payment Mode */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Payment Mode</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'Cash', icon: Wallet },
                { id: 'UPI', icon: Smartphone },
                { id: 'Credit', icon: CreditCard }
              ].map((m) => (
                <Button
                  key={m.id}
                  variant={paymentMode === m.id ? 'default' : 'outline'}
                  className={`h-16 flex-col gap-1 rounded-xl transition-all p-1 ${paymentMode === m.id ? 'bg-primary ring-2 ring-primary/20 scale-[1.02]' : 'bg-transparent'}`}
                  onClick={() => setPaymentMode(m.id as any)}
                >
                  <m.icon className="h-5 w-5" />
                  <span className="font-bold text-xs">{m.id}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Totals & Submit */}
      <div className="mt-4 pt-4 border-t space-y-4 bg-card">
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs text-accent font-medium">
            <span>Discount</span>
            <span>- ₹{discount.toFixed(2)}</span>
          </div>
          <Separator className="bg-border/50" />
          <div className="flex justify-between items-end pt-1">
            <span className="text-sm font-bold uppercase tracking-wider">Payable</span>
            <span className="text-3xl font-black text-primary">₹{total.toFixed(2)}</span>
          </div>
        </div>

        <Button 
          className="w-full h-16 sm:h-20 text-xl sm:text-2xl font-black rounded-2xl shadow-xl shadow-primary/10 hover:shadow-primary/20 transition-all active:scale-[0.98]"
          disabled={items.length === 0}
          onClick={() => onComplete({ total, paymentMode, customerPhone: phone, discount })}
        >
          <Printer className="h-6 w-6 sm:h-8 sm:w-8 mr-2 sm:mr-3" /> PRINT & CLOSE
        </Button>
      </div>
    </div>
  );
}