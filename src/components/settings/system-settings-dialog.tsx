"use client";

import { useState, useEffect } from 'react';
import { Settings, Save, Store, MapPin, Hash, Phone, Monitor, ShieldCheck, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useFirestore, useDoc, setDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface SystemSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
}

export function SystemSettingsDialog({ isOpen, onClose, isAdmin }: SystemSettingsDialogProps) {
  const { toast } = useToast();
  const db = useFirestore();
  
  // FIXED: Memoized settingsRef to prevent infinite re-render loops
  const settingsRef = useMemoFirebase(() => doc(db, 'settings', 'config'), [db]);
  const { data: currentSettings, isLoading } = useDoc(settingsRef);

  const [formData, setFormData] = useState({
    shopName: "KRISHNA'S SUPER 9+",
    address: "Hoolungooree, Mariani",
    gstin: "",
    phone: "",
    launcherMode: false
  });

  useEffect(() => {
    if (currentSettings) {
      setFormData({
        shopName: currentSettings.shopName || "KRISHNA'S SUPER 9+",
        address: currentSettings.address || "Hoolungooree, Mariani",
        gstin: currentSettings.gstin || "",
        phone: currentSettings.phone || "",
        launcherMode: !!currentSettings.launcherMode
      });
    }
  }, [currentSettings]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      toast({ variant: 'destructive', title: 'Access Denied', description: 'Only Admins can change system settings.' });
      return;
    }

    setDocumentNonBlocking(settingsRef, {
      ...formData,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    toast({ title: "Settings Saved", description: "System configuration updated across all terminals." });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl rounded-[40px] p-0 border-none shadow-2xl overflow-hidden font-body">
        <div className="absolute top-0 left-0 w-full h-2 bg-secondary" />
        <DialogHeader className="p-10 border-b bg-slate-50/50 flex flex-row items-center justify-between shrink-0">
          <div>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight text-secondary">System Console</DialogTitle>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Terminal Configuration & Shop Identity</p>
          </div>
          <Button variant="ghost" onClick={onClose} className="rounded-2xl h-12 w-12 p-0"><X className="h-6 w-6" /></Button>
        </DialogHeader>

        <form onSubmit={handleSave} className="p-10 space-y-8 bg-white">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><Store className="h-3 w-3" /> Shop Name</Label>
                <Input 
                  value={formData.shopName} 
                  onChange={(e) => setFormData({...formData, shopName: e.target.value})}
                  className="h-12 bg-slate-50 border-none rounded-xl font-bold text-sm px-4"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><Phone className="h-3 w-3" /> Contact Phone</Label>
                <Input 
                  value={formData.phone} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="h-12 bg-slate-50 border-none rounded-xl font-bold text-sm px-4"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><MapPin className="h-3 w-3" /> Store Address</Label>
              <Input 
                value={formData.address} 
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="h-12 bg-slate-50 border-none rounded-xl font-bold text-sm px-4"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><Hash className="h-3 w-3" /> GSTIN (Optional)</Label>
                <Input 
                  value={formData.gstin} 
                  onChange={(e) => setFormData({...formData, gstin: e.target.value})}
                  className="h-12 bg-slate-50 border-none rounded-xl font-bold text-sm px-4"
                  placeholder="e.g. 18AABCU9603R1ZM"
                />
              </div>
              <div className="p-4 bg-slate-50 rounded-[24px] flex items-center justify-between border border-slate-100">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-secondary flex items-center gap-2"><Monitor className="h-3 w-3" /> Launcher Mode</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Secured OS-like Home Screen</p>
                </div>
                <Switch 
                  checked={formData.launcherMode} 
                  onCheckedChange={(val) => setFormData({...formData, launcherMode: val})} 
                />
              </div>
            </div>
          </div>

          <div className="pt-6">
            <Button type="submit" className="w-full h-16 rounded-[24px] bg-secondary text-white font-black uppercase text-xs tracking-widest shadow-2xl gap-3">
              <ShieldCheck className="h-5 w-5" /> COMMIT SYSTEM CHANGES
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
