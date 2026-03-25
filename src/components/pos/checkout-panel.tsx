
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
    <div className="flex flex-col h-full bg-card p-6 rounded-xl border border-border shadow-2xl">
      <div className="space-y-6 flex-1">
        {/* Customer Info */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Customer Details</label>
          <div className="relative">
            <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter Phone Number"
              className="pl-10 h-14 text-xl font-medium bg-secondary/50"
            />
          </div>
          {customer && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="bg-primary rounded-full p-2">
                  <User className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-bold text-foreground">{customer.name}</p>
                  <p className="text-xs text-muted-foreground">Points: {customer.points}</p>
                </div>
              </div>
              <Badge className="bg-primary text-primary-foreground">Member</Badge>
            </div>
          )}
        </div>

        {/* Coupons */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Discounts</label>
            <Button variant="link" size="sm" onClick={handleApplyBestCoupon} className="text-primary p-0 h-auto font-bold">
              <Ticket className="h-4 w-4 mr-1" /> Apply Best
            </Button>
          </div>
          {appliedCoupon ? (
            <div className="flex items-center justify-between bg-accent/20 border border-accent/30 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Ticket className="h-5 w-5 text-accent" />
                <span className="font-bold">{appliedCoupon.code} Applied</span>
              </div>
              <button onClick={() => setAppliedCoupon(null)} className="text-sm text-muted-foreground underline">Remove</button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No coupon applied</p>
          )}
        </div>

        {/* Payment Mode */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Payment Mode</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'Cash', icon: Wallet },
              { id: 'UPI', icon: Smartphone },
              { id: 'Credit', icon: CreditCard }
            ].map((m) => (
              <Button
                key={m.id}
                variant={paymentMode === m.id ? 'default' : 'outline'}
                className={`h-20 flex-col gap-2 rounded-xl transition-all ${paymentMode === m.id ? 'bg-primary ring-2 ring-primary/20 scale-105' : 'bg-transparent'}`}
                onClick={() => setPaymentMode(m.id as any)}
              >
                <m.icon className="h-6 w-6" />
                <span className="font-bold">{m.id}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Totals & Submit */}
      <div className="mt-6 pt-6 border-t space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-accent font-medium">
            <span>Discount</span>
            <span>- ₹{discount.toFixed(2)}</span>
          </div>
          <Separator className="bg-border/50" />
          <div className="flex justify-between items-end pt-2">
            <span className="text-xl font-bold">Payable</span>
            <span className="text-4xl font-black text-primary">₹{total.toFixed(2)}</span>
          </div>
        </div>

        <Button 
          className="w-full h-20 text-2xl font-black rounded-2xl shadow-xl shadow-primary/10 hover:shadow-primary/20 transition-all active:scale-[0.98]"
          disabled={items.length === 0}
          onClick={() => onComplete({ total, paymentMode, customerPhone: phone, discount })}
        >
          <Printer className="h-8 w-8 mr-3" /> PRINT & CLOSE
        </Button>
      </div>
    </div>
  );
}
