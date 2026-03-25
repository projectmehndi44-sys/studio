"use client";

import { useState, useMemo } from 'react';
import { Smartphone, Printer, Save, FileDown, Monitor, Bluetooth, Usb } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { CartItem } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
    <div className="flex flex-col h-full bg-white rounded-3xl border border-slate-100 shadow-sm p-6 overflow-hidden">
      <ScrollArea className="flex-1">
        <div className="space-y-6 pb-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customer Profile</label>
            <div className="relative">
              <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Mobile (WhatsApp)"
                className="pl-12 h-12 text-base font-bold bg-slate-50 border-none rounded-xl focus-visible:ring-primary shadow-inner"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Payment Mode</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Cash', 'UPI', 'Credit'] as const).map((m) => (
                <Button
                  key={m}
                  variant={paymentMode === m ? 'default' : 'outline'}
                  className={cn(
                    "h-16 flex-col gap-1 rounded-xl border-none transition-all",
                    paymentMode === m 
                      ? 'bg-secondary text-white shadow-md scale-[1.02]' 
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  )}
                  onClick={() => setPaymentMode(m)}
                >
                  <span className="font-bold text-[10px] uppercase tracking-wider">{m}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>

      <div className="mt-6 pt-6 border-t space-y-6">
        <div className="flex justify-between items-end">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Grand Total</span>
          <span className="text-4xl font-bold text-primary tracking-tight leading-none">₹{subtotal.toLocaleString()}</span>
        </div>

        <div className="space-y-2">
          <Button 
            className="w-full h-14 text-lg font-bold rounded-xl shadow-lg shadow-primary/10 transition-all active:scale-95 bg-primary hover:bg-primary/90"
            disabled={items.length === 0}
            onClick={handleLedgerSync}
          >
            <Save className="h-5 w-5 mr-2" /> CONFIRM & SYNC
          </Button>
          
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline"
              className="h-11 bg-slate-50 border-none rounded-lg hover:bg-slate-100 font-bold uppercase text-[9px] tracking-wider gap-2"
              onClick={handlePrintClick}
              disabled={items.length === 0}
            >
              <Printer className="h-4 w-4" /> PRINT BILL
            </Button>
            <Button 
              variant="outline"
              className="h-11 bg-slate-50 border-none rounded-lg hover:bg-slate-100 font-bold uppercase text-[9px] tracking-wider gap-2"
              onClick={handleSavePDF}
              disabled={items.length === 0}
            >
              <FileDown className="h-4 w-4" /> SAVE PDF
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={isPrinterDialogOpen} onOpenChange={setIsPrinterDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-8 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold uppercase tracking-tight text-secondary">Printer Setup</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <button
              onClick={() => executePrint('normal')}
              className="flex flex-col items-center justify-center h-32 bg-slate-50 rounded-2xl hover:bg-primary/5 hover:text-primary transition-all group"
            >
              <Monitor className="h-8 w-8 mb-2 text-slate-400 group-hover:text-primary" />
              <span className="font-bold text-[10px] uppercase tracking-wider">Normal (Desktop)</span>
            </button>
            <button
              onClick={() => executePrint('thermal')}
              className="flex flex-col items-center justify-center h-32 bg-slate-50 rounded-2xl hover:bg-secondary/5 hover:text-secondary transition-all group"
            >
              <div className="flex gap-1 mb-2">
                <Bluetooth className="h-6 w-6 text-slate-400 group-hover:text-secondary" />
                <Usb className="h-6 w-6 text-slate-400 group-hover:text-secondary" />
              </div>
              <span className="font-bold text-[10px] uppercase tracking-wider">Thermal (BT/USB)</span>
            </button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsPrinterDialogOpen(false)} className="font-bold h-11 w-full rounded-xl">Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}