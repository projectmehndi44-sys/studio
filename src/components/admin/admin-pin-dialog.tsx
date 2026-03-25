
"use client";

import { useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';
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
    if (pin === '1234') { // Simple mock PIN
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
      <DialogContent className="sm:max-w-md bg-card border-primary/20">
        <DialogHeader>
          <div className="mx-auto bg-destructive/10 p-3 rounded-full mb-4">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>
          <DialogTitle className="text-center text-2xl">Admin Override Required</DialogTitle>
          <DialogDescription className="text-center">
            {requiredFor}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <Input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter Admin PIN"
            className={`h-14 text-center text-2xl tracking-[1rem] font-bold ${error ? 'border-destructive ring-destructive' : ''}`}
            maxLength={4}
            autoFocus
          />
          {error && <p className="text-destructive text-center text-sm font-bold">Incorrect PIN. Access Denied.</p>}
          <div className="flex gap-3">
            <Button variant="outline" type="button" onClick={onClose} className="flex-1 h-12">Cancel</Button>
            <Button variant="default" type="submit" className="flex-1 h-12 font-bold">Authorize</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
