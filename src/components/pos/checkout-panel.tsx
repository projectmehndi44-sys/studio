"use client";

import { useState, useMemo } from 'react';
import { User, CreditCard, Wallet, Smartphone, Printer, Ticket, Share2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MOCK_CUSTOMERS, MOCK_COUPONS } from '@/lib/mock-data';
import { Badge } from '@/components/ui/badge';
import { CartItem, Coupon } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

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
      toast({ title: "No valid coupons", description: "Cart value too low.", variant: "destructive" });
      return;
    }
    const best = validCoupons.sort((a, b) => {
      const da = a.type === 'flat' ? a.value : (subtotal * a.value) / 100;
      const db = b.type === 'flat' ? b.value : (subtotal * b.value) / 100;
      return db - da;
    })[0];
    setAppliedCoupon(best);
    toast({ title: "Coupon Applied", description: `${best.code} added to bill.` });
  };

  return (
    <div className="flex flex-col h-full bg-white p-6 sm:p-8 rounded-[40px] border border-slate-200 shadow-xl overflow-hidden">
      <ScrollArea className="flex-1">
        <div className="space-y-8 pb-4">
          {/* Customer Info */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Customer Profile</label>
            <div className="relative">
              <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone (WhatsApp)"
                className="pl-12 h-16 text-xl font-bold bg-slate-50 border-none rounded-2xl focus-visible:ring-primary"
              />
            </div>
            {customer && (
              <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex items-center justify-between animate-in slide-in-from-top-2">
                <div className="flex items-center gap-4">
                  <div className="bg-primary h-12 w-12 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                    <User className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-black text-slate-900">{customer.name}</p>
                    <p className="text-xs font-bold text-primary">Member • {customer.points} Points</p>
                  </div>
                </div>
                <Badge className="bg-primary text-primary-foreground text-[10px] font-black rounded-lg">PRO</Badge>
              </div>
            )}
          </div>

          {/* Discounts */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Offers & Savings</label>
              <Button variant="link" size="sm" onClick={handleApplyBestCoupon} className="text-primary p-0 h-auto font-black text-xs uppercase tracking-wider">
                Find Best Coupon
              </Button>
            </div>
            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-accent/5 border border-accent/10 p-4 rounded-2xl">
                <div className="flex items-center gap-3">
                  <Ticket className="h-5 w-5 text-accent" />
                  <div>
                    <span className="font-black text-slate-900 uppercase tracking-tight">{appliedCoupon.code}</span>
                    <p className="text-[10px] font-bold text-accent">Discount Applied Successfully</p>
                  </div>
                </div>
                <button onClick={() => setAppliedCoupon(null)} className="text-xs font-black text-slate-400 hover:text-destructive transition-colors">REMOVE</button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-100 p-4 rounded-2xl text-center">
                <p className="text-xs font-bold text-slate-300">No coupon applied</p>
              </div>
            )}
          </div>

          {/* Payment Mode */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Settlement Method</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'Cash', icon: Wallet },
                { id: 'UPI', icon: Smartphone },
                { id: 'Credit', icon: CreditCard }
              ].map((m) => (
                <Button
                  key={m.id}
                  variant={paymentMode === m.id ? 'default' : 'outline'}
                  className={cn(
                    "h-24 flex-col gap-2 rounded-2xl transition-all border-none",
                    paymentMode === m.id ? 'bg-primary shadow-xl shadow-primary/20 scale-[1.05]' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                  )}
                  onClick={() => setPaymentMode(m.id as any)}
                >
                  <m.icon className={cn("h-7 w-7", paymentMode === m.id ? "text-primary-foreground" : "text-slate-300")} />
                  <span className="font-black text-xs uppercase tracking-widest">{m.id}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Totals & Submit */}
      <div className="mt-6 pt-6 border-t border-slate-100 space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-bold text-slate-400">
            <span>Gross Total</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-black text-accent">
            <span>Net Savings</span>
            <span>- ₹{discount.toFixed(2)}</span>
          </div>
          <Separator className="bg-slate-50 h-[2px]" />
          <div className="flex justify-between items-end pt-2">
            <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Total Payable</span>
            <span className="text-4xl font-black text-primary tracking-tighter">₹{total.toFixed(0)}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            className="flex-1 h-20 text-xl font-black rounded-3xl shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            disabled={items.length === 0}
            onClick={() => onComplete({ total, paymentMode, customerPhone: phone, discount })}
          >
            <Printer className="h-7 w-7 mr-3" /> PRINT BILL
          </Button>
          <Button 
            variant="outline"
            className="h-20 w-20 bg-slate-50 border-none rounded-3xl hover:bg-primary hover:text-white transition-all group"
            onClick={() => {
              if (phone) {
                toast({ title: "Sharing...", description: "Digital receipt being generated." });
              } else {
                toast({ title: "Missing Phone", description: "Add a phone number to share.", variant: "destructive" });
              }
            }}
          >
            <Share2 className="h-8 w-8 text-slate-300 group-hover:text-white transition-colors" />
          </Button>
        </div>
      </div>
    </div>
  );
}