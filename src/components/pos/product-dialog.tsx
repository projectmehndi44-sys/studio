"use client";

import { useState, useEffect, useMemo } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Product } from '@/lib/types';
import { useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Search, Edit, PackagePlus, Filter, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

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

interface ProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProductDialog({ isOpen, onClose }: ProductDialogProps) {
  const { toast } = useToast();
  const db = useFirestore();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    costPrice: '',
    barcode: '',
    category: 'General',
    stock: '',
    isPopular: false
  });

  const productsQuery = useMemoFirebase(() => collection(db, 'products'), [db]);
  const { data: products } = useCollection<Product>(productsQuery);

  const filteredProducts = useMemo(() => {
    return (products || []).filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.barcode?.includes(searchQuery);
      const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, categoryFilter]);

  useEffect(() => {
    if (selectedProduct) {
      setFormData({
        name: selectedProduct.name,
        price: selectedProduct.price.toString(),
        costPrice: (selectedProduct.costPrice || 0).toString(),
        barcode: selectedProduct.barcode || '',
        category: selectedProduct.category || 'General',
        stock: (selectedProduct.stock || '').toString(),
        isPopular: !!selectedProduct.isPopular
      });
    } else {
      setFormData({
        name: '',
        price: '',
        costPrice: '',
        barcode: '',
        category: 'General',
        stock: '',
        isPopular: false
      });
    }
  }, [selectedProduct]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const productData = {
      name: formData.name,
      price: parseFloat(formData.price),
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
      toast({ title: "Updated", description: "Item saved successfully." });
    } else {
      addDocumentNonBlocking(collection(db, 'products'), {
        ...productData,
        createdAt: new Date().toISOString()
      });
      toast({ title: "Added", description: "Item added to catalog." });
    }
    
    setIsEditing(false);
    setSelectedProduct(null);
  };

  const getStockStatus = (stock?: number) => {
    if (stock === undefined || stock === null) return { label: 'Tracked', variant: 'outline' as const };
    if (stock <= 0) return { label: 'Out', variant: 'destructive' as const };
    if (stock < 10) return { label: 'Low', variant: 'secondary' as const };
    return { label: 'Healthy', variant: 'outline' as const };
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1000px] rounded-[32px] p-0 border-none shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-8 border-b bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
          <div>
            <DialogTitle className="text-2xl font-bold tracking-tight uppercase text-secondary">
              Inventory Master
            </DialogTitle>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Global Product Catalog & Stock Status</p>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="ghost" onClick={onClose} className="h-11 w-11 rounded-2xl p-0 hover:bg-slate-200"><X className="h-5 w-5" /></Button>
          </div>
        </div>

        {!isEditing ? (
          <div className="flex-1 flex flex-col min-h-0 bg-white">
            <div className="p-6 border-b flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-3 w-full md:w-auto">
                 <div className="relative w-full md:w-[300px]">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                   <Input 
                     placeholder="Search item name or barcode..." 
                     className="pl-11 h-11 bg-slate-50 border-none rounded-xl font-bold text-xs"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                   />
                 </div>
                 <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                   <SelectTrigger className="h-11 w-[160px] bg-slate-50 border-none rounded-xl font-bold text-[10px] uppercase tracking-wider px-4">
                     <Filter className="h-4 w-4 mr-2" />
                     <SelectValue placeholder="All Categories" />
                   </SelectTrigger>
                   <SelectContent className="rounded-xl p-1 border-none shadow-xl">
                      <SelectItem value="All" className="font-bold text-[10px] uppercase py-2.5 rounded-lg">All Categories</SelectItem>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat} className="font-bold text-[10px] uppercase py-2.5 rounded-lg">{cat}</SelectItem>
                      ))}
                   </SelectContent>
                 </Select>
              </div>
              <Button onClick={() => setIsEditing(true)} className="h-11 px-8 rounded-xl font-bold uppercase text-[10px] tracking-widest bg-primary hover:bg-primary/90 shadow-lg shadow-primary/10 gap-2">
                <PackagePlus className="h-4 w-4" /> Create New Item
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <Table>
                <TableHeader className="bg-slate-50/50 sticky top-0 z-10">
                  <TableRow className="border-slate-50">
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest h-14 pl-8">Product Name</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest h-14">Barcode</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest h-14">Category</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest h-14 text-right">Selling (₹)</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest h-14 text-right">Stock Status</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest h-14 text-right pr-8">Manage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-60 text-center text-slate-300 font-bold uppercase text-[10px] tracking-widest">
                        No catalog items found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map(p => {
                      const status = getStockStatus(p.stock);
                      return (
                        <TableRow key={p.id} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                          <TableCell className="pl-8">
                            <p className="font-bold text-slate-900 text-sm">{p.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Added: {p.createdAt ? format(new Date(p.createdAt), 'dd MMM yyyy') : '--'}</p>
                          </TableCell>
                          <TableCell>
                            <code className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{p.barcode || '--'}</code>
                          </TableCell>
                          <TableCell>
                             <Badge variant="outline" className="rounded-lg font-bold text-[9px] uppercase border-slate-100 text-slate-400">{p.category}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <p className="font-black text-slate-900 text-sm">₹{p.price.toLocaleString()}</p>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={status.variant} className="rounded-lg font-bold text-[9px] uppercase tracking-wider h-6 px-2">
                              {status.label} • {p.stock ?? '∞'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-8">
                             <Button 
                               variant="ghost" 
                               size="sm" 
                               onClick={() => { setSelectedProduct(p); setIsEditing(true); }} 
                               className="h-9 w-9 rounded-xl hover:bg-secondary hover:text-white transition-all"
                             >
                               <Edit className="h-4 w-4" />
                             </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 bg-white p-10 flex flex-col">
            <div className="grid grid-cols-2 gap-8 flex-1">
              <div className="col-span-2 space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Detailed Product Label</Label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Amul Gold Full Cream Milk 1L"
                  className="h-14 bg-slate-50 border-none rounded-2xl font-bold text-lg px-6 focus-visible:ring-primary/20"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sales Value (MRP/SP)</Label>
                <Input
                  required
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="h-12 bg-slate-50 border-none rounded-xl font-bold text-sm px-6"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Landing Cost (Optional)</Label>
                <Input
                  type="number"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  className="h-12 bg-slate-50 border-none rounded-xl font-bold text-sm px-6"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Category Bucket</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(val) => setFormData({ ...formData, category: val })}
                >
                  <SelectTrigger className="h-12 bg-slate-50 border-none rounded-xl font-bold text-xs px-6">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl p-1 border-none shadow-2xl">
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat} className="font-bold text-xs py-3 rounded-lg">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Inventory Count</Label>
                <Input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="Leave empty for untracked"
                  className="h-12 bg-slate-50 border-none rounded-xl font-bold text-sm px-6"
                />
              </div>
            </div>

            <DialogFooter className="pt-10 gap-4">
              <Button type="button" variant="ghost" onClick={() => { setIsEditing(false); setSelectedProduct(null); }} className="h-14 rounded-2xl font-bold px-10 text-xs uppercase tracking-widest">Discard</Button>
              <Button type="submit" className="h-14 rounded-2xl font-bold px-12 text-xs uppercase tracking-widest bg-primary text-white shadow-xl shadow-primary/10">Commit to Ledger</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}