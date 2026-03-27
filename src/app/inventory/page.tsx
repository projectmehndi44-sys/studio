
"use client";

import { useState, useMemo } from 'react';
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
  FileUp,
  History,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  useCollection, 
  useFirestore, 
  useUser, 
  useMemoFirebase, 
  updateDocumentNonBlocking, 
  addDocumentNonBlocking,
  deleteDocumentNonBlocking
} from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Product } from '@/lib/types';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { PhoneAuthGate } from '@/components/auth/phone-auth-gate';
import { isStaffAdmin } from '@/lib/staff';
import { BulkImportDialog } from '@/components/inventory/bulk-import-dialog';

const CATEGORIES = [
  'Garments', 'Electronics', 'Crockery', 'Dairy', 'Beverages', 'Bakery', 'Staples', 'Snacks', 'Personal Care', 'Cleaning', 'General'
];

export default function InventoryPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [quickEnrollText, setQuickEnrollText] = useState('');
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  
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

    const parts = quickEnrollText.split(',').map(p => p.trim());
    const name = parts[0];
    const price = parseFloat(parts[1]) || 0;
    const category = parts[2] || 'General';

    if (!name || price <= 0) {
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

  const handleDeleteProduct = () => {
    if (!deletingProductId) return;
    deleteDocumentNonBlocking(doc(db, 'products', deletingProductId));
    setDeletingProductId(null);
    toast({ title: "SKU Deleted", description: "Item removed from the catalog." });
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
      toast({ title: "Updated", description: `${formData.name} saved.` });
    } else {
      addDocumentNonBlocking(collection(db, 'products'), { ...productData, createdAt: new Date().toISOString() });
      toast({ title: "Created", description: `${formData.name} added to master.` });
    }
    
    setIsEditing(false);
    setSelectedProduct(null);
  };

  if (isUserLoading || isLoading) return <div className="h-screen flex items-center justify-center">Syncing Item Master...</div>;
  if (!user) return <PhoneAuthGate />;

  if (!isAdmin) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-8">
        <ShieldAlert className="h-12 w-12 text-primary mb-4" />
        <h1 className="text-2xl font-black uppercase text-secondary">Access Denied</h1>
        <Link href="/"><Button className="mt-6 rounded-2xl h-14 bg-secondary text-white">Back to Terminal</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-body">
      <Toaster />
      <header className="h-20 border-b border-slate-100 bg-white flex items-center justify-between px-8 shrink-0 z-10">
        <div className="flex items-center gap-6">
          <Link href="/">
            <Button variant="outline" size="icon" className="h-11 w-11 rounded-2xl bg-white border-none shadow-sm transition-all hover:scale-110"><ArrowLeft className="h-5 w-5 text-secondary" /></Button>
          </Link>
          <div className="flex items-center gap-2">
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
              placeholder="Quick Enroll: Name, Price, Category (Press Enter)"
              className="h-11 pl-11 bg-slate-50 border-none rounded-xl font-bold text-xs"
            />
          </div>
        </form>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setIsBulkImportOpen(true)} className="h-11 px-6 rounded-xl font-bold uppercase text-[10px] bg-white border-slate-200 gap-2"><FileUp className="h-4 w-4" /> Bulk Import</Button>
          <Button onClick={() => { setSelectedProduct(null); setIsEditing(true); }} className="h-11 px-8 rounded-xl font-bold uppercase text-[10px] bg-primary text-white shadow-lg gap-2"><PackagePlus className="h-4 w-4" /> Create New</Button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden p-8 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
        <Card className="bg-white border-none shadow-sm rounded-[32px] overflow-hidden flex flex-col min-h-0">
          <CardHeader className="p-8 border-b bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
            <div className="flex items-center gap-4">
              <div className="bg-white p-3 rounded-2xl shadow-sm"><Package className="h-5 w-5 text-secondary" /></div>
              <CardTitle className="text-lg font-bold text-secondary uppercase tracking-tight">Global Catalog</CardTitle>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-full md:w-[320px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Search catalog..." className="h-11 pl-11 bg-white border-slate-100 rounded-xl font-bold text-xs" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-11 w-[160px] bg-white border-slate-100 rounded-xl font-bold text-[10px] uppercase"><SelectValue placeholder="Category" /></SelectTrigger>
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
                 <TableHeader className="bg-slate-50/50 sticky top-0 z-10">
                   <TableRow className="border-none">
                     <TableHead className="font-bold text-[10px] uppercase h-14 pl-8">Item Label</TableHead>
                     <TableHead className="font-bold text-[10px] uppercase h-14">Barcode</TableHead>
                     <TableHead className="font-bold text-[10px] uppercase h-14 text-right">Price (₹)</TableHead>
                     <TableHead className="font-bold text-[10px] uppercase h-14 text-right">Stock</TableHead>
                     <TableHead className="font-bold text-[10px] uppercase h-14 text-right pr-8">Actions</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {filteredProducts.map((p) => (
                     <TableRow key={p.id} className="hover:bg-slate-50/50 transition-colors border-slate-50 group">
                       <TableCell className="pl-8">
                         <p className="font-bold text-slate-900 text-sm">{p.name}</p>
                         <p className="text-[10px] font-bold text-slate-400 uppercase">{p.category}</p>
                       </TableCell>
                       <TableCell><code className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg uppercase">{p.barcode || '--'}</code></TableCell>
                       <TableCell className="text-right">
                         {editingCell?.id === p.id && editingCell?.field === 'price' ? (
                           <Input autoFocus type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={saveInlineEdit} onKeyDown={(e) => e.key === 'Enter' && saveInlineEdit()} className="h-8 w-20 ml-auto font-black text-right" />
                         ) : (
                           <button onClick={() => startEditingCell(p.id, 'price', p.price)} className="font-black text-slate-900 text-sm hover:text-primary underline decoration-dotted underline-offset-4">₹{p.price}</button>
                         )}
                       </TableCell>
                       <TableCell className="text-right">
                         {editingCell?.id === p.id && editingCell?.field === 'stock' ? (
                           <Input autoFocus type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={saveInlineEdit} onKeyDown={(e) => e.key === 'Enter' && saveInlineEdit()} className="h-8 w-20 ml-auto font-black text-right" />
                         ) : (
                           <Badge onClick={() => startEditingCell(p.id, 'stock', p.stock)} variant={p.stock !== undefined && p.stock < 10 ? "destructive" : "outline"} className="rounded-lg font-bold text-[9px] cursor-pointer">
                             {p.stock ?? '∞'}
                           </Badge>
                         )}
                       </TableCell>
                       <TableCell className="text-right pr-8">
                         <div className="flex items-center justify-end gap-1">
                           <Button variant="ghost" size="sm" onClick={() => handleEdit(p)} className="h-9 w-9 rounded-xl opacity-0 group-hover:opacity-100 transition-all"><Edit className="h-4 w-4" /></Button>
                           <Button variant="ghost" size="sm" onClick={() => setDeletingProductId(p.id)} className="h-9 w-9 text-slate-300 hover:text-primary rounded-xl opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="h-4 w-4" /></Button>
                         </div>
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        <aside className="space-y-6 flex flex-col min-h-0">
          <Card className="bg-white border-none shadow-sm rounded-[32px] overflow-hidden flex flex-col flex-1">
            <CardHeader className="p-8 border-b bg-slate-900 text-white shrink-0">
              <CardTitle className="text-xs font-bold uppercase tracking-widest">{isEditing ? 'Refine Product' : 'Stock Insight'}</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden">
               {isEditing ? (
                 <ScrollArea className="h-full p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Item Name</Label>
                        <Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-12 bg-slate-50 border-none rounded-xl font-bold text-sm px-6" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Price (₹)</Label><Input required type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="h-12 bg-slate-50 border-none rounded-xl font-bold text-sm px-6" /></div>
                        <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Stock</Label><Input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} className="h-12 bg-slate-50 border-none rounded-xl font-bold text-sm px-6" /></div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Category</Label>
                        <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                          <SelectTrigger className="h-12 bg-slate-50 border-none rounded-xl font-bold text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent className="rounded-xl border-none shadow-2xl">
                            {CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button type="submit" className="w-full h-14 rounded-2xl font-black text-xs uppercase bg-primary text-white shadow-xl">SAVE PRODUCT</Button>
                      <Button type="button" variant="ghost" onClick={() => setIsEditing(false)} className="w-full h-12 rounded-xl text-slate-400 font-bold uppercase text-[10px]">Cancel</Button>
                    </form>
                 </ScrollArea>
               ) : (
                 <div className="p-10 text-center space-y-8 h-full flex flex-col justify-center animate-in fade-in">
                   <div className="mx-auto w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center"><Package className="h-10 w-10 text-slate-200" /></div>
                   <div className="space-y-2"><h4 className="text-sm font-black text-secondary uppercase tracking-tight">System Operational</h4><p className="text-[10px] font-medium text-slate-400 px-8">Quick Enroll at the top or tap values in the table for instant editing.</p></div>
                   <div className="grid grid-cols-2 gap-4 px-8">
                      <div className="bg-slate-50 p-4 rounded-2xl text-left border border-slate-100"><p className="text-[8px] font-black uppercase text-slate-400 mb-1">Total SKUs</p><p className="text-2xl font-black text-secondary">{products.length}</p></div>
                      <div className="bg-slate-50 p-4 rounded-2xl text-left border border-slate-100"><p className="text-[8px] font-black uppercase text-slate-400 mb-1">Low Stock</p><p className="text-2xl font-black text-primary">{products.filter(p => p.stock !== undefined && p.stock < 10).length}</p></div>
                   </div>
                 </div>
               )}
            </CardContent>
          </Card>
        </aside>
      </main>

      <Dialog open={!!deletingProductId} onOpenChange={(open) => !open && setDeletingProductId(null)}>
        <DialogContent className="sm:max-w-md rounded-[32px] p-10 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase text-primary">Remove from Catalog?</DialogTitle>
            <DialogDescription className="font-bold text-[10px] uppercase tracking-widest pt-2">
              This will permanently delete the item. Sales history will be preserved.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="grid grid-cols-2 gap-4 mt-6">
            <Button variant="outline" onClick={() => setDeletingProductId(null)} className="h-14 rounded-2xl font-bold uppercase text-[10px]">Keep Item</Button>
            <Button variant="destructive" onClick={handleDeleteProduct} className="h-14 rounded-2xl font-black uppercase text-[10px]">Delete Forever</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BulkImportDialog 
        isOpen={isBulkImportOpen} 
        onClose={() => setIsBulkImportOpen(false)} 
        existingProducts={products}
      />
    </div>
  );
}
