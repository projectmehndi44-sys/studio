
"use client";

import { useState, useMemo } from 'react';
import { User, Smartphone, Printer, Save, FileDown, Check, Monitor, Bluetooth, Usb } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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
    toast({ title: "Syncing & Saving", description: "Updating ledger and generating PDF..." });
    // Trigger ledger sync
    handleLedgerSync();
    // Trigger browser print/save dialog
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handlePrintClick = () => {
    if (items.length === 0) return;
    setIsPrinterDialogOpen(true);
  };

  const executePrint = (type: 'normal' | 'thermal') => {
    setIsPrinterDialogOpen(false);
    toast({ 
      title: type === 'normal' ? "Printing Document" : "Thermal Print Initiated", 
      description: `Syncing bill to ledger and connecting to ${type} printer...` 
    });
    
    // Always sync ledger first
    handleLedgerSync();

    if (type === 'normal') {
      setTimeout(() => window.print(), 500);
    } else {
      // Mock Thermal Printer Connection (USB/BT)
      toast({
        title: "Thermal Output",
        description: "58mm receipt sent to Thermal Printer via Bluetooth/USB.",
        duration: 3000,
      });
    }
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
            onClick={handleLedgerSync}
          >
            <Save className="h-6 w-6 mr-3" /> CONFIRM & SYNC
          </Button>
          
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline"
              className="h-16 bg-slate-50 border-none rounded-2xl hover:bg-slate-100 font-black uppercase text-xs tracking-widest gap-2"
              onClick={handlePrintClick}
              disabled={items.length === 0}
            >
              <Printer className="h-5 w-5" /> Print
            </Button>
            <Button 
              variant="outline"
              className="h-16 bg-slate-50 border-none rounded-2xl hover:bg-slate-100 font-black uppercase text-xs tracking-widest gap-2"
              onClick={handleSavePDF}
              disabled={items.length === 0}
            >
              <FileDown className="h-5 w-5" /> Save PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Printer Selection Dialog */}
      <Dialog open={isPrinterDialogOpen} onOpenChange={setIsPrinterDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-[32px] p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Select Printer</DialogTitle>
            <DialogDescription className="font-bold text-slate-400">
              Choose output format for current bill sync.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <button
              onClick={() => executePrint('normal')}
              className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-3xl hover:bg-primary/10 hover:text-primary transition-all group"
            >
              <Monitor className="h-10 w-10 mb-3 text-slate-400 group-hover:text-primary" />
              <span className="font-black text-xs uppercase">Normal / PDF</span>
            </button>
            <button
              onClick={() => executePrint('thermal')}
              className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-3xl hover:bg-primary/10 hover:text-primary transition-all group"
            >
              <div className="flex gap-1 mb-3">
                <Bluetooth className="h-6 w-6 text-slate-400 group-hover:text-primary" />
                <Usb className="h-6 w-6 text-slate-400 group-hover:text-primary" />
              </div>
              <span className="font-black text-xs uppercase">Thermal (USB/BT)</span>
            </button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsPrinterDialogOpen(false)} className="font-bold">Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
