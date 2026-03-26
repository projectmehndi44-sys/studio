"use client";

import { useState, useMemo, useRef } from 'react';
import { 
  ArrowLeft,
  Search,
  Edit,
  Filter,
  PackagePlus,
  Package,
  ShieldAlert,
  Zap,
  Check,
  X,
  Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCollection, useFirestore, useUser, useMemoFirebase, updateDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Product } from '@/lib/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { PhoneAuthGate } from '@/components/auth/phone-auth-gate';
import { isStaffAdmin } from '@/lib/staff';

const CATEGORIES = [
  'Garments',
  'Electronics',
  'Crockery',
  'Dairy',
  'Beverages',
  'Bakery',
  'Staples',
  'Snacks',
  'Personal Care',
  'Cleaning',
  'General'
];

export default function InventoryPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [quickEnrollText, setQuickEnrollText] = useState('');
  
  const [editingCell, setEditingCell] = useState<{ id: string, field: 'price' | 'stock' } | null>(null);
  const [editValue, setEditValue] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    costPrice: '',
    barcode: '',
    category: 'General',
    stock: '',
    isPopular: false
  });

  const isAdmin = useMemo(() => isStaffAdmin(user?.phoneNumber || null), [user]);

  const productsQuery = useMemoFirebase(() => {
    if (!user || !isAdmin) return null;
    return collection(db, 'products');
  }, [db, user, isAdmin]);

  const { data: productsData, isLoading } = useCollection<Product>(productsQuery);
  const products = productsData || [];

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.barcode?.includes(searchQuery);
      const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, categoryFilter]);

  const handleQuickEnroll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickEnrollText.trim()) return;

    // Format: Name, Price, Category
    const parts = quickEnrollText.split(',').map(p => p.trim());
    const name = parts[0];
    const price = parseFloat(parts[1]) || 0;
    const category = parts[2] || 'General';

    if (!name) {
      toast({ variant: 'destructive', title: 'Invalid Format', description: 'Use: Name, Price, Category' });
      return;
    }

    const newProd = {
      name,
      price,
      costPrice: price * 0.8,
      category: CATEGORIES.includes(category) ? category : 'General',
      stock: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    addDocumentNonBlocking(collection(db, 'products'), newProd);
    toast({ title: "Quick Enrolled", description: `${name} added to catalog.` });
    setQuickEnrollText('');
  };

  const startEditingCell = (id: string, field: 'price' | 'stock', value: any) => {
    setEditingCell({ id, field });
    setEditValue(value?.toString() || '0');
  };

  const saveInlineEdit = () => {
    if (!editingCell) return;
    const { id, field } = editingCell;
    const val = field === 'stock' ? parseInt(editValue) : parseFloat(editValue);
    
    updateDocumentNonBlocking(doc(db, 'products', id), {
      [field]: val,
      updatedAt: new Date().toISOString()
    });

    setEditingCell(null);
    toast({ title: "Updated", description: `Item ${field} synced.` });
  };

  const handleEdit = (p: Product) => {
    setSelectedProduct(p);
    setFormData({
      name: p.name,
      price: p.price.toString(),
      costPrice: (p.costPrice || 0).toString(),
      barcode: p.barcode || '',
      category: p.category || 'General',
      stock: (p.stock || '').toString(),
      isPopular: !!p.isPopular
    });
    setIsEditing(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const productData = {
      name: formData.name,
      price: parseFloat(formData.price) || 0,
      costPrice: parseFloat(formData.costPrice) || 0,
      barcode: formData.barcode,
      category: formData.category,
      stock: formData.stock ? parseInt(formData.stock) : null,
      isPopular: formData.isPopular,
      isActive: true,
      updatedAt: new Date().toISOString()
    };

    if (selectedProduct?.id) {
      updateDocumentNonBlocking(doc(db, 'products', selectedProduct.id), productData);
      toast({ title: "Stock Updated", description: `${formData.name} committing to ledger.` });
    } else {
      addDocumentNonBlocking(collection(db, 'products'), {
        ...productData,
        createdAt: new Date().toISOString()
      });
      toast({ title: "New Item Created", description: `${formData.name} added to catalog.` });
    }
    
    setIsEditing(false);
    setSelectedProduct(null);
  };

  const getStockStatus = (stock?: number) => {
    if (stock === undefined || stock === null) return { label: 'Untracked', variant: 'outline' as const };
    if (stock <= 0) return { label: 'Out', variant: 'destructive' as const };
    if (stock < 10) return { label: 'Low', variant: 'secondary' as const };
    return { label: 'Stable', variant: 'outline' as const };
  };

  if (isUserLoading || isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center font-bold animate-pulse text-slate-400 text-[10px] uppercase tracking-[0.2em]">
          Syncing Item Master...
        </div>
      </div>
    );
  }

  if (!user) return <PhoneAuthGate />;

  if (!isAdmin) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 p-8 text-center">
        <div className="max-w-md space-y-6 animate-in fade-in zoom-in-95 duration-500">
          <div className="mx-auto w-24 h-24 bg-primary/5 rounded-[40px] flex items-center justify-center">
            <ShieldAlert className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-secondary">Access Restricted</h1>
          <Link href="/"><Button className="h-14 px-8 rounded-2xl bg-secondary text-white shadow-xl">Back to Billing</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-body">
      <Toaster />
      <header className="h-20 border-b border-slate-100 bg-white flex items-center justify-between px-8 shrink-0 z-10">
        <div className="flex items-center gap-6">
          <Link href="/">
            <Button variant="outline" size="icon" className="h-11 w-11 rounded-2xl bg-white border-none shadow-sm"><ArrowLeft className="h-5 w-5 text-secondary" /></Button>
          </Link>
          <div className="flex items-center gap-2 border-r pr-8 border-slate-200">
            <span className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.2em]">KRISHNA'S</span>
            <span className="text-lg font-black uppercase text-secondary">SUPER 9+</span>
          </div>
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Stock Master</h2>
        </div>
        
        <form onSubmit={handleQuickEnroll} className="hidden md:flex items-center gap-3 flex-1 max-w-xl mx-8">
          <div className="relative flex-1">
            <Zap className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
            <Input 
              value={quickEnrollText}
              onChange={(e) => setQuickEnrollText(e.target.value)}
              placeholder="Quick Enroll: Name, Price, Category (Enter)"
              className="h-11 pl-11 bg-slate-50 border-none rounded-xl font-bold text-xs shadow-inner"
            />
          </div>
        </form>

        <Button onClick={() => { setSelectedProduct(null); setIsEditing(true); }} className="h-11 px-8 rounded-xl font-bold uppercase text-[10px] bg-primary text-white shadow-lg gap-2">
          <PackagePlus className="h-4 w-4" /> Create New
        </Button>
      </header>

      <main className="flex-1 overflow-hidden p-8 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
        <Card className="bg-white border-none shadow-sm rounded-[32px] overflow-hidden flex flex-col min-h-0">
          <CardHeader className="p-8 border-b bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
            <div className="flex items-center gap-4">
              <div className="bg-white p-3 rounded-2xl shadow-sm"><Package className="h-5 w-5 text-secondary" /></div>
              <div><CardTitle className="text-lg font-bold text-secondary uppercase">Global Catalog</CardTitle></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-full md:w-[320px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Search Label..." className="h-11 pl-11 bg-white border-slate-100 rounded-xl font-bold text-xs" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-11 w-[160px] bg-white border-slate-100 rounded-xl font-bold text-[10px] uppercase"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-xl">
                  <SelectItem value="All" className="font-bold text-[10px] uppercase">All Stock</SelectItem>
                  {CATEGORIES.map(cat => <SelectItem key={cat} value={cat} className="font-bold text-[10px] uppercase">{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full">
               <Table>
                 <TableHeader className="bg-slate-50/50 sticky top-0 z-10 shadow-sm">
                   <TableRow className="border-none">
                     <TableHead className="font-bold text-[10px] uppercase tracking-widest h-14 pl-8">Item Label</TableHead>
                     <TableHead className="font-bold text-[10px] uppercase tracking-widest h-14">Barcode</TableHead>
                     <TableHead className="font-bold text-[10px] uppercase tracking-widest h-14 text-right">Selling (₹)</TableHead>
                     <TableHead className="font-bold text-[10px] uppercase tracking-widest h-14 text-right">Stock</TableHead>
                     <TableHead className="font-bold text-[10px] uppercase tracking-widest h-14 text-right pr-8">Actions</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {filteredProducts.map((p) => {
                     const status = getStockStatus(p.stock);
                     return (
                       <TableRow key={p.id} className="hover:bg-slate-50/50 transition-colors border-slate-50 group">
                         <TableCell className="pl-8">
                           <p className="font-bold text-slate-900 text-sm">{p.name}</p>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.category}</p>
                         </TableCell>
                         <TableCell><code className="text-[10px] font-bold text-secondary bg-secondary/5 px-2 py-1 rounded-lg uppercase">{p.barcode || 'NO-SCAN'}</code></TableCell>
                         <TableCell className="text-right">
                           {editingCell?.id === p.id && editingCell?.field === 'price' ? (
                             <div className="flex items-center justify-end gap-2">
                               <Input autoFocus type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveInlineEdit()} className="h-8 w-20 font-black text-right" />
                               <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-500" onClick={saveInlineEdit}><Check className="h-4 w-4" /></Button>
                             </div>
                           ) : (
                             <button onClick={() => startEditingCell(p.id, 'price', p.price)} className="font-black text-slate-900 text-sm hover:text-primary transition-colors underline decoration-dotted underline-offset-4">₹{p.price.toLocaleString()}</button>
                           )}
                         </TableCell>
                         <TableCell className="text-right">
                           {editingCell?.id === p.id && editingCell?.field === 'stock' ? (
                             <div className="flex items-center justify-end gap-2">
                               <Input autoFocus type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveInlineEdit()} className="h-8 w-20 font-black text-right" />
                               <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-500" onClick={saveInlineEdit}><Check className="h-4 w-4" /></Button>
                             </div>
                           ) : (
                             <Badge onClick={() => startEditingCell(p.id, 'stock', p.stock)} variant={status.variant} className="rounded-lg font-bold text-[9px] uppercase tracking-wider h-7 px-2 cursor-pointer hover:opacity-80 transition-opacity">
                               {p.stock ?? '∞'}
                             </Badge>
                           )}
                         </TableCell>
                         <TableCell className="text-right pr-8">
                           <Button variant="ghost" size="sm" onClick={() => handleEdit(p)} className="h-9 w-9 rounded-xl hover:bg-secondary hover:text-white transition-all opacity-0 group-hover:opacity-100"><Edit className="h-4 w-4" /></Button>
                         </TableCell>
                       </TableRow>
                     );
                   })}
                 </TableBody>
               </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        <aside className="space-y-6 flex flex-col min-h-0">
          <Card className="bg-white border-none shadow-sm rounded-[32px] overflow-hidden flex flex-col flex-1">
            <CardHeader className="p-8 border-b bg-slate-900 text-white shrink-0">
              <CardTitle className="text-xs font-bold uppercase tracking-widest">{isEditing ? 'Refine Product' : 'Enroll Item'}</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden">
               {isEditing ? (
                 <ScrollArea className="h-full">
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-slate-400">Description</Label>
                          <Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-12 bg-slate-50 border-none rounded-xl font-bold text-sm px-6" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Price (₹)</Label><Input required type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="h-12 bg-slate-50 border-none rounded-xl font-bold text-sm px-6" /></div>
                          <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Cost (₹)</Label><Input type="number" value={formData.costPrice} onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })} className="h-12 bg-slate-50 border-none rounded-xl font-bold text-sm px-6" /></div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-slate-400">Category</Label>
                          <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                            <SelectTrigger className="h-12 bg-slate-50 border-none rounded-xl font-bold text-xs px-6"><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent className="rounded-xl border-none shadow-2xl">
                              {CATEGORIES.map(cat => <SelectItem key={cat} value={cat} className="font-bold text-xs py-3 rounded-lg">{cat}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="pt-6 space-y-3">
                        <Button type="submit" className="w-full h-14 rounded-2xl font-black text-xs uppercase bg-primary text-white">SAVE ITEM</Button>
                        <Button type="button" variant="ghost" onClick={() => setIsEditing(false)} className="w-full h-12 rounded-xl font-bold text-[10px] uppercase text-slate-400">Discard</Button>
                      </div>
                    </form>
                 </ScrollArea>
               ) : (
                 <div className="p-10 text-center space-y-8 h-full flex flex-col justify-center">
                   <div className="mx-auto w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center"><Package className="h-10 w-10 text-slate-200" /></div>
                   <div className="space-y-2"><h4 className="text-sm font-black text-secondary uppercase">Stock Analysis</h4><p className="text-[10px] font-medium text-slate-400 px-8">Quick Enroll or tap price/stock to edit.</p></div>
                   <div className="grid grid-cols-2 gap-4 px-8">
                      <div className="bg-slate-50 p-4 rounded-2xl text-left"><p className="text-[8px] font-black uppercase text-slate-400 mb-1">Low Items</p><p className="text-2xl font-black text-secondary">{products.filter(p => p.stock !== undefined && p.stock < 10 && p.stock > 0).length}</p></div>
                      <div className="bg-slate-50 p-4 rounded-2xl text-left"><p className="text-[8px] font-black uppercase text-slate-400 mb-1">Out Stock</p><p className="text-2xl font-black text-primary">{products.filter(p => p.stock !== undefined && p.stock <= 0).length}</p></div>
                   </div>
                 </div>
               )}
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  );
}
