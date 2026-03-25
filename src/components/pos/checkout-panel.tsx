"use client";

import { useState, useMemo } from 'react';
import { Smartphone, Printer, Save, FileDown, Monitor, Bluetooth, Usb } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { CartItem } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

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
  const [isPrinterDialogOpen, setIsPrinterDialogOpen] = useState(false);

  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }, [items]);

  const handleLedgerSync = () => {
    onComplete({ total: subtotal, paymentMode, customerPhone: phone });
  };

  const handleSavePDF = () => {
    if (items.length === 0) return;
    handleLedgerSync();
  };

  const handlePrintClick = () => {
    if (items.length === 0) return;
    setIsPrinterDialogOpen(true);
  };

  const executePrint = (type: 'normal' | 'thermal') => {
    setIsPrinterDialogOpen(false);
    handleLedgerSync();
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-[48px] border-2 border-slate-50 shadow-2xl p-10 overflow-hidden">
      <ScrollArea className="flex-1">
        <div className="space-y-10 pb-6">
          {/* Customer Profile Section */}
          <div className="space-y-4">
            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Customer Profile</label>
            <div className="relative">
              <Smartphone className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-300" />
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Mobile Number (WhatsApp)"
                className="pl-16 h-20 text-2xl font-black bg-slate-50 border-none rounded-[24px] focus-visible:ring-primary shadow-inner"
              />
            </div>
          </div>

          {/* Settlement Method */}
          <div className="space-y-4">
            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Payment Mode</label>
            <div className="grid grid-cols-3 gap-4">
              {(['Cash', 'UPI', 'Credit'] as const).map((m) => (
                <Button
                  key={m}
                  variant={paymentMode === m ? 'default' : 'outline'}
                  className={cn(
                    "h-24 flex-col gap-2 rounded-3xl border-none transition-all",
                    paymentMode === m 
                      ? 'bg-secondary text-white shadow-xl shadow-secondary/20 scale-[1.05]' 
                      : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                  )}
                  onClick={() => setPaymentMode(m)}
                >
                  <span className="font-black text-sm uppercase tracking-widest">{m}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Totals & Quick Actions */}
      <div className="mt-8 pt-10 border-t-4 border-slate-50 space-y-8">
        <div className="flex justify-between items-end">
          <span className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Grand Total</span>
          <span className="text-7xl font-black text-primary tracking-tighter leading-none">₹{subtotal.toLocaleString()}</span>
        </div>

        <div className="space-y-4">
          <Button 
            className="w-full h-24 text-3xl font-black rounded-[32px] shadow-2xl shadow-primary/30 transition-all active:scale-95 bg-primary hover:bg-primary/90"
            disabled={items.length === 0}
            onClick={handleLedgerSync}
          >
            <Save className="h-8 w-8 mr-4" /> CONFIRM & SYNC
          </Button>
          
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline"
              className="h-20 bg-slate-50 border-none rounded-[24px] hover:bg-slate-100 font-black uppercase text-xs tracking-[0.2em] gap-3"
              onClick={handlePrintClick}
              disabled={items.length === 0}
            >
              <Printer className="h-6 w-6" /> PRINT RECEIPT
            </Button>
            <Button 
              variant="outline"
              className="h-20 bg-slate-50 border-none rounded-[24px] hover:bg-slate-100 font-black uppercase text-xs tracking-[0.2em] gap-3"
              onClick={handleSavePDF}
              disabled={items.length === 0}
            >
              <FileDown className="h-6 w-6" /> SAVE DIGITAL
            </Button>
          </div>
        </div>
      </div>

      {/* Printer Selection Dialog */}
      <Dialog open={isPrinterDialogOpen} onOpenChange={setIsPrinterDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-[48px] p-12 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-4xl font-black uppercase tracking-tight text-secondary">Printer Setup</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-6 py-8">
            <button
              onClick={() => executePrint('normal')}
              className="flex flex-col items-center justify-center h-44 bg-slate-50 rounded-[32px] hover:bg-primary/10 hover:text-primary transition-all group"
            >
              <Monitor className="h-12 w-12 mb-4 text-slate-400 group-hover:text-primary" />
              <span className="font-black text-xs uppercase tracking-widest">Normal Desktop</span>
            </button>
            <button
              onClick={() => executePrint('thermal')}
              className="flex flex-col items-center justify-center h-44 bg-slate-50 rounded-[32px] hover:bg-secondary/10 hover:text-secondary transition-all group"
            >
              <div className="flex gap-2 mb-4">
                <Bluetooth className="h-8 w-8 text-slate-400 group-hover:text-secondary" />
                <Usb className="h-8 w-8 text-slate-400 group-hover:text-secondary" />
              </div>
              <span className="font-black text-xs uppercase tracking-widest">Thermal (USB/BT)</span>
            </button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsPrinterDialogOpen(false)} className="font-bold h-16 w-full rounded-2xl">Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}