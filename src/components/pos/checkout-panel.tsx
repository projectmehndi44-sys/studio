"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { 
  Smartphone, 
  Printer, 
  Save, 
  Download, 
  User, 
  Check, 
  CreditCard, 
  Banknote, 
  Wallet,
  AlertTriangle 
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
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
    customerName: string;
  }) => void;
}

export function CheckoutPanel({ items, onComplete }: CheckoutPanelProps) {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Credit'>('Cash');
  const [isPrinterDialogOpen, setIsPrinterDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  
  const nameInputRef = useRef<HTMLInputElement>(null);

  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }, [items]);

  const requestLedgerSync = useCallback(() => {
    if (items.length === 0) return;
    setIsConfirmDialogOpen(true);
  }, [items]);

  const handleFinalConfirm = () => {
    setIsConfirmDialogOpen(false);
    onComplete({ 
      total: subtotal, 
      paymentMode, 
      customerPhone: phone, 
      customerName: name 
    });
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ctrl + Enter: Trigger Confirmation before Sync
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        requestLedgerSync();
      }
      // Shift + Enter: Focus Customer Name
      if (e.shiftKey && e.key === 'Enter') {
        e.preventDefault();
        nameInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [requestLedgerSync]);

  const executePrint = () => {
    setIsPrinterDialogOpen(false);
    requestLedgerSync();
  };

  const handleModeKeyDown = (e: React.KeyboardEvent, mode: 'Cash' | 'UPI' | 'Credit') => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setPaymentMode(mode);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white p-8 overflow-hidden">
      <ScrollArea className="flex-1">
        <div className="space-y-8 pb-6">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Customer Identity</label>
            <div className="grid grid-cols-1 gap-3">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                <Input
                  ref={nameInputRef}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Customer Name (Shift+Enter)"
                  className="pl-12 h-12 text-sm font-bold bg-slate-50 border-none rounded-xl focus-visible:ring-primary/20"
                />
              </div>
              <div className="relative">
                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Mobile (WhatsApp)"
                  className="pl-12 h-12 text-sm font-bold bg-slate-50 border-none rounded-xl focus-visible:ring-primary/20"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Settlement Method</label>
            <div className="grid grid-cols-1 gap-2">
              {[
                { id: 'Cash', icon: Banknote, color: 'emerald' },
                { id: 'UPI', icon: Wallet, color: 'blue' },
                { id: 'Credit', icon: CreditCard, color: 'orange' }
              ].map((m) => {
                const Icon = m.icon;
                const isActive = paymentMode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMode(m.id as any)}
                    onKeyDown={(e) => handleModeKeyDown(e, m.id as any)}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-2xl transition-all border-2 outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                      isActive 
                        ? 'bg-secondary text-white border-secondary shadow-lg' 
                        : 'bg-white text-slate-500 border-slate-50 hover:border-slate-200'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", isActive ? "bg-white/10" : "bg-slate-100")}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="font-bold text-xs uppercase tracking-widest">{m.id}</span>
                    </div>
                    {isActive && <Check className="h-4 w-4" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </ScrollArea>

      <div className="mt-8 pt-8 border-t space-y-8">
        <div className="flex justify-between items-end">
          <div className="flex flex-col">
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1">Final Payable</span>
             <span className="text-5xl font-black text-secondary tracking-tighter leading-none">₹{subtotal.toLocaleString()}</span>
          </div>
          <Badge variant="outline" className="h-8 px-4 rounded-xl font-bold text-[10px] border-slate-100 text-slate-400 uppercase">
             {items.length} Units
          </Badge>
        </div>

        <div className="space-y-3">
          <Button 
            className="w-full h-16 text-xs font-black rounded-2xl shadow-2xl shadow-primary/20 transition-all active:scale-95 bg-primary hover:bg-primary/95 text-white uppercase tracking-[0.2em]"
            disabled={items.length === 0}
            onClick={requestLedgerSync}
          >
            CONFIRM & SYNC BILL (CTRL+ENTER)
          </Button>
          
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline"
              className="h-12 bg-slate-50 border-none rounded-xl hover:bg-slate-100 font-bold uppercase text-[9px] tracking-widest gap-2 text-slate-600"
              onClick={() => setIsPrinterDialogOpen(true)}
              disabled={items.length === 0}
            >
              <Printer className="h-4 w-4" /> Print
            </Button>
            <Button 
              variant="outline"
              className="h-12 bg-slate-50 border-none rounded-xl hover:bg-slate-100 font-bold uppercase text-[9px] tracking-widest gap-2 text-slate-600"
              onClick={requestLedgerSync}
              disabled={items.length === 0}
            >
              <Download className="h-4 w-4" /> Digital PDF
            </Button>
          </div>
        </div>
      </div>

      {/* SYNC CONFIRMATION DIALOG */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-[40px] p-10 border-none shadow-2xl overflow-hidden print:hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
          <DialogHeader className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/5 rounded-[24px] flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-center text-xl font-black uppercase tracking-tight text-secondary leading-none">
              Sync Bill to Ledger?
            </DialogTitle>
          </DialogHeader>

          <div className="text-center py-4 space-y-2">
            <p className="text-sm font-bold text-slate-500 leading-relaxed">
              Are you sure you want to finalize this bill for <span className="text-secondary font-black">₹{subtotal.toLocaleString()}</span>?
            </p>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
              This will commit the transaction to the cloud archive.
            </p>
          </div>

          <DialogFooter className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="h-14 rounded-2xl font-bold uppercase text-[10px] tracking-widest bg-white border-slate-100 hover:bg-slate-50"
              onClick={() => setIsConfirmDialogOpen(false)}
            >
              No, Cancel
            </Button>
            <Button 
              className="h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-primary text-white shadow-xl shadow-primary/10"
              onClick={handleFinalConfirm}
            >
              Yes, Sync Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PRINTER SELECTION DIALOG */}
      <Dialog open={isPrinterDialogOpen} onOpenChange={setIsPrinterDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-[32px] p-10 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight text-secondary">Output Device</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-6">
            <button
              onClick={executePrint}
              className="flex flex-col items-center justify-center h-40 bg-slate-50 rounded-[32px] hover:bg-secondary/5 hover:text-secondary transition-all group border-2 border-transparent hover:border-secondary/10 outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
            >
              <div className="h-14 w-14 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Printer className="h-6 w-6 text-slate-400 group-hover:text-secondary" />
              </div>
              <span className="font-bold text-[10px] uppercase tracking-widest">Normal (A4/Desk)</span>
            </button>
            <button
              onClick={executePrint}
              className="flex flex-col items-center justify-center h-40 bg-slate-50 rounded-[32px] hover:bg-primary/5 hover:text-primary transition-all group border-2 border-transparent hover:border-primary/10 outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <div className="h-14 w-14 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Printer className="h-6 w-6 text-slate-400 group-hover:text-primary" />
              </div>
              <span className="font-bold text-[10px] uppercase tracking-widest">Thermal (58/80mm)</span>
            </button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsPrinterDialogOpen(false)} className="font-bold h-12 w-full rounded-xl uppercase text-[10px] tracking-widest">Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
