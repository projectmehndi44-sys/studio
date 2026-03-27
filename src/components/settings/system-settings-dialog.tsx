
"use client";

import { useState, useEffect, useMemo } from 'react';
import { 
  Settings, 
  Save, 
  Store, 
  MapPin, 
  Hash, 
  Phone, 
  Monitor, 
  ShieldCheck, 
  X, 
  Database, 
  HardDrive, 
  Trash2, 
  RefreshCw,
  Clock,
  AlertTriangle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  useFirestore, 
  useDoc, 
  setDocumentNonBlocking, 
  useMemoFirebase, 
  useCollection,
  deleteDocumentNonBlocking 
} from '@/firebase';
import { doc, collection, query, where, getDocs, writeBatch, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { subDays } from 'date-fns';

interface SystemSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
}

export function SystemSettingsDialog({ isOpen, onClose, isAdmin }: SystemSettingsDialogProps) {
  const { toast } = useToast();
  const db = useFirestore();
  const [isCleaning, setIsCleaning] = useState(false);
  const [activeTab, setActiveTab] = useState('shop');
  
  const settingsRef = useMemoFirebase(() => doc(db, 'settings', 'config'), [db]);
  const { data: currentSettings } = useDoc(settingsRef);

  const productsRef = useMemoFirebase(() => collection(db, 'products'), [db]);
  const purchasesRef = useMemoFirebase(() => collection(db, 'purchases'), [db]);
  const transactionsRef = useMemoFirebase(() => collection(db, 'cashTransactions'), [db]);

  const { data: products } = useCollection(productsRef);
  const { data: purchases } = useCollection(purchasesRef);
  const { data: transactions } = useCollection(transactionsRef);

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

  const cleanOldData = async (days: number) => {
    if (!isAdmin || !confirm(`Clean all sales and logs older than ${days} days?`)) return;
    
    setIsCleaning(true);
    const cutoffDate = subDays(new Date(), days);
    
    try {
      // Clean Purchases
      const pQuery = query(collection(db, 'purchases'), where('timestamp', '<', Timestamp.fromDate(cutoffDate)));
      const pSnap = await getDocs(pQuery);
      pSnap.docs.forEach(d => deleteDocumentNonBlocking(d.ref));

      // Clean Cash Logs
      const cQuery = query(collection(db, 'cashTransactions'), where('timestamp', '<', Timestamp.fromDate(cutoffDate)));
      const cSnap = await getDocs(cQuery);
      cSnap.docs.forEach(d => deleteDocumentNonBlocking(d.ref));

      toast({ title: "Cleanup Triggered", description: `Purging ${pSnap.size + cSnap.size} legacy records.` });
    } catch (e: any) {
      toast({ variant: 'destructive', title: "Cleanup Failed", description: e.message });
    } finally {
      setIsCleaning(false);
    }
  };

  const docCount = (products?.length || 0) + (purchases?.length || 0) + (transactions?.length || 0);
  const usagePercentage = Math.min(100, (docCount / 50000) * 100); // 50k docs as a safe free-tier limit proxy

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl rounded-[40px] p-0 border-none shadow-2xl overflow-hidden font-body">
        <div className="absolute top-0 left-0 w-full h-2 bg-secondary" />
        <DialogHeader className="p-10 border-b bg-slate-50/50 flex flex-row items-center justify-between shrink-0">
          <div>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight text-secondary">System Console</DialogTitle>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Terminal Configuration & Maintenance</p>
          </div>
          <Button variant="ghost" onClick={onClose} className="rounded-2xl h-12 w-12 p-0"><X className="h-6 w-6" /></Button>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-slate-50 border-b h-14 rounded-none px-10 gap-8 justify-start">
            <TabsTrigger value="shop" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full font-bold text-[10px] uppercase gap-2">
              <Store className="h-4 w-4" /> Shop Identity
            </TabsTrigger>
            <TabsTrigger value="data" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full font-bold text-[10px] uppercase gap-2">
              <Database className="h-4 w-4" /> Data & Storage
            </TabsTrigger>
          </TabsList>

          <TabsContent value="shop" className="p-10 space-y-8 bg-white m-0">
            <form onSubmit={handleSave} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">Shop Name</Label>
                  <Input value={formData.shopName} onChange={(e) => setFormData({...formData, shopName: e.target.value})} className="h-12 bg-slate-50 border-none rounded-xl font-bold text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">Contact Phone</Label>
                  <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="h-12 bg-slate-50 border-none rounded-xl font-bold text-sm" />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">Store Address</Label>
                  <Input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="h-12 bg-slate-50 border-none rounded-xl font-bold text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">GSTIN</Label>
                  <Input value={formData.gstin} onChange={(e) => setFormData({...formData, gstin: e.target.value})} className="h-12 bg-slate-50 border-none rounded-xl font-bold text-sm" />
                </div>
                <div className="p-4 bg-slate-50 rounded-[24px] flex items-center justify-between border border-slate-100">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-secondary">Launcher Mode</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Secured Terminal OS</p>
                  </div>
                  <Switch checked={formData.launcherMode} onCheckedChange={(val) => setFormData({...formData, launcherMode: val})} />
                </div>
              </div>
              <Button type="submit" className="w-full h-16 rounded-[24px] bg-secondary text-white font-black uppercase text-xs tracking-widest shadow-2xl gap-3">
                <ShieldCheck className="h-5 w-5" /> COMMIT SYSTEM CHANGES
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="data" className="p-10 space-y-8 bg-white m-0">
            <div className="space-y-6">
              <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm"><HardDrive className="h-6 w-6 text-primary" /></div>
                    <div><h4 className="font-black text-secondary uppercase text-sm">Storage Monitor</h4><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Firestore Database Health</p></div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-secondary">{docCount.toLocaleString()}</p>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Documents</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400"><span>Free Tier Capacity</span><span>{usagePercentage.toFixed(1)}%</span></div>
                  <Progress value={usagePercentage} className="h-2 bg-white" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /><h4 className="text-[10px] font-black uppercase tracking-widest text-secondary">History Cleanup Tools</h4></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Button variant="outline" disabled={isCleaning} onClick={() => cleanOldData(30)} className="h-14 rounded-2xl flex flex-col items-center justify-center border-slate-100 hover:bg-primary/5 hover:border-primary/20 group">
                    <span className="text-[10px] font-black text-secondary group-hover:text-primary uppercase">30 Days</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">Purge Legacy</span>
                  </Button>
                  <Button variant="outline" disabled={isCleaning} onClick={() => cleanOldData(90)} className="h-14 rounded-2xl flex flex-col items-center justify-center border-slate-100 hover:bg-primary/5 hover:border-primary/20 group">
                    <span className="text-[10px] font-black text-secondary group-hover:text-primary uppercase">90 Days</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">Standard Purge</span>
                  </Button>
                  <Button variant="outline" disabled={isCleaning} onClick={() => cleanOldData(365)} className="h-14 rounded-2xl flex flex-col items-center justify-center border-slate-100 hover:bg-primary/5 hover:border-primary/20 group">
                    <span className="text-[10px] font-black text-secondary group-hover:text-primary uppercase">Annual</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">Archive Clean</span>
                  </Button>
                </div>
              </div>

              <div className="p-6 bg-primary/5 border border-primary/10 rounded-[24px] flex items-start gap-4">
                <AlertTriangle className="h-5 w-5 text-primary shrink-0 mt-1" />
                <p className="text-[10px] font-bold text-primary/80 uppercase leading-relaxed tracking-wider">
                  Purging old data improves system speed but is permanent. Download an Excel backup from the Business Ledger before cleaning.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
