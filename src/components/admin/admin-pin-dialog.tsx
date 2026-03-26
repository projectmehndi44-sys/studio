"use client";

import { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface AdminPinDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  requiredFor: string;
}

export function AdminPinDialog({ isOpen, onClose, onSuccess, requiredFor }: AdminPinDialogProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '2045') { // Security PIN updated as requested
      onSuccess();
      setPin('');
      setError(false);
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-primary/20 rounded-[32px] p-10">
        <DialogHeader>
          <div className="mx-auto bg-primary/10 p-4 rounded-3xl mb-4 w-fit">
            <ShieldAlert className="h-10 w-10 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl font-black uppercase tracking-tight text-secondary">Security Clearance</DialogTitle>
          <DialogDescription className="text-center font-bold text-slate-400 uppercase text-[10px] tracking-widest mt-2">
            {requiredFor}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-8 py-4">
          <Input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="• • • •"
            className={`h-20 text-center text-4xl tracking-[1.5rem] font-black bg-slate-50 border-none rounded-2xl focus-visible:ring-primary/20 ${error ? 'animate-shake' : ''}`}
            maxLength={4}
            autoFocus
          />
          {error && <p className="text-primary text-center text-[10px] font-black uppercase tracking-widest">Authentication Failed</p>}
          <div className="flex gap-4">
            <Button variant="ghost" type="button" onClick={onClose} className="flex-1 h-14 rounded-2xl font-bold uppercase text-[10px] tracking-widest">Cancel</Button>
            <Button variant="default" type="submit" className="flex-1 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-secondary text-white shadow-xl">Authorize</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
