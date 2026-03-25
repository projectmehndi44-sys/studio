
"use client";

import { useState, useMemo } from 'react';
import { User, Smartphone, Printer, Share2, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { CartItem } from '@/lib/types';

interface CheckoutPanelProps {
  items: CartItem[];
  onComplete: (data: {
    total: number;
    paymentMode: string;
    customerPhone: string;
  }) => void;
}

export function CheckoutPanel({ items, onComplete }: CheckoutPanelProps) {
  const { toast } = useToast();
  const [phone, setPhone] = useState('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Credit'>('Cash');

  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }, [items]);

  const handlePrint = () => {
    if (items.length === 0) return;
    window.print();
    toast({ title: "Printing...", description: "Sending bill to default printer." });
  };

  const handleShare = () => {
    if (!phone) {
      toast({ title: "Phone Required", description: "Enter customer phone to share receipt.", variant: "destructive" });
      return;
    }
    toast({ title: "Sharing...", description: "Digital receipt sent to " + phone });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-[40px] border border-slate-100 shadow-2xl p-6 sm:p-8 overflow-hidden">
      <ScrollArea className="flex-1">
        <div className="space-y-8 pb-4">
          {/* Customer Profile Section */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer Profile</label>
            <div className="relative">
              <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Mobile (WhatsApp)"
                className="pl-12 h-16 text-xl font-bold bg-slate-50 border-none rounded-2xl focus-visible:ring-primary"
              />
            </div>
            {phone.length >= 10 && (
              <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex items-center gap-4 animate-in slide-in-from-top-2">
                <div className="bg-primary h-10 w-10 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                  <User className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-black text-sm text-slate-900 leading-none">Customer Identified</p>
                  <p className="text-[10px] font-bold text-primary mt-1 uppercase tracking-wider">Syncing Profile</p>
                </div>
              </div>
            )}
          </div>

          {/* Settlement Method */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Mode</label>
            <div className="grid grid-cols-3 gap-3">
              {(['Cash', 'UPI', 'Credit'] as const).map((m) => (
                <Button
                  key={m}
                  variant={paymentMode === m ? 'default' : 'outline'}
                  className={cn(
                    "h-20 flex-col gap-1 rounded-2xl border-none transition-all",
                    paymentMode === m ? 'bg-primary shadow-xl shadow-primary/20 scale-[1.02]' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                  )}
                  onClick={() => setPaymentMode(m)}
                >
                  <span className="font-black text-xs uppercase tracking-widest">{m}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Totals & Quick Actions */}
      <div className="mt-6 pt-6 border-t border-slate-100 space-y-6">
        <div className="flex justify-between items-end">
          <span className="text-xs font-black uppercase tracking-widest text-slate-400">Total Bill</span>
          <span className="text-5xl font-black text-primary tracking-tighter">₹{subtotal.toFixed(0)}</span>
        </div>

        <div className="space-y-3">
          <Button 
            className="w-full h-20 text-xl font-black rounded-3xl shadow-2xl shadow-primary/20 transition-all active:scale-95"
            disabled={items.length === 0}
            onClick={() => onComplete({ total: subtotal, paymentMode, customerPhone: phone })}
          >
            <Save className="h-6 w-6 mr-3" /> SAVE BILL
          </Button>
          
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline"
              className="h-16 bg-slate-50 border-none rounded-2xl hover:bg-slate-100 font-black uppercase text-xs tracking-widest gap-2"
              onClick={handlePrint}
              disabled={items.length === 0}
            >
              <Printer className="h-5 w-5" /> Print
            </Button>
            <Button 
              variant="outline"
              className="h-16 bg-slate-50 border-none rounded-2xl hover:bg-slate-100 font-black uppercase text-xs tracking-widest gap-2"
              onClick={handleShare}
              disabled={items.length === 0}
            >
              <Share2 className="h-5 w-5" /> Share
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
