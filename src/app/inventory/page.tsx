
"use client";

import { useState, useMemo } from 'react';
import { 
  ArrowLeft,
  Search,
  Plus,
  Edit,
  Filter,
  PackagePlus,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Package
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
  const { user } = useUser();
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

  const productsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(db, 'products');
  }, [db, user]);

  const { data: productsData, isLoading } = useCollection<Product>(productsQuery);
  const products = productsData || [];

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.barcode?.includes(searchQuery);
      const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, categoryFilter]);

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

  const handleAddNew = () => {
    setSelectedProduct(null);
    setFormData({
      name: '',
      price: '',
      costPrice: '',
      barcode: '',
      category: 'General',
      stock: '',
      isPopular: false
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

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center font-bold animate-pulse text-slate-400 text-xs uppercase tracking-[0.2em]">
          Syncing Item Master...
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
            <Button variant="outline" size="icon" className="h-11 w-11 rounded-2xl bg-white border-none shadow-sm hover:scale-105 active:scale-95 transition-all">
              <ArrowLeft className="h-5 w-5 text-secondary" />
            </Button>
          </Link>
          <div className="flex flex-col border-r pr-8 border-slate-200">
            <p className="text-[8px] font-black text-slate-400 tracking-[0.4em] uppercase leading-none mb-1">KRISHNA&apos;S</p>
            <h1 className="text-lg font-black tracking-tight uppercase leading-none text-secondary">SUPER 9+</h1>
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Stock Master</h2>
          </div>
        </div>
        
        <Button 
          onClick={handleAddNew}
          className="h-11 px-8 rounded-xl font-bold uppercase text-[10px] tracking-widest bg-primary hover:bg-primary/95 text-white shadow-lg shadow-primary/10 gap-2"
        >
          <PackagePlus className="h-4 w-4" /> Create New Item
        </Button>
      </header>

      <main className="flex-1 overflow-hidden p-8 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
        <Card className="bg-white border-none shadow-sm rounded-[32px] overflow-hidden flex flex-col min-h-0">
          <CardHeader className="p-8 border-b bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
            <div className="flex items-center gap-4">
              <div className="bg-white p-3 rounded-2xl shadow-sm">
                <Package className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-secondary uppercase tracking-tight">Global Catalog</CardTitle>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{filteredProducts.length} Listed Items</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
               <div className="relative w-full md:w-[320px]">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                 <Input 
                   placeholder="Search item name or barcode..." 
                   className="h-11 pl-11 bg-white border-slate-100 rounded-xl font-bold text-xs"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                 />
               </div>
               <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                 <SelectTrigger className="h-11 w-[160px] bg-white border-slate-100 rounded-xl font-bold text-[10px] uppercase tracking-wider px-4">
                   <Filter className="h-4 w-4 mr-2" />
                   <SelectValue placeholder="Category" />
                 </SelectTrigger>
                 <SelectContent className="rounded-xl p-1 border-none shadow-xl">
                    <SelectItem value="All" className="font-bold text-[10px] uppercase py-2.5 rounded-lg">All Stock</SelectItem>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat} className="font-bold text-[10px] uppercase py-2.5 rounded-lg">{cat}</SelectItem>
                    ))}
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
                     <TableHead className="font-bold text-[10px] uppercase tracking-widest h-14">Category</TableHead>
                     <TableHead className="font-bold text-[10px] uppercase tracking-widest h-14 text-right">Selling (₹)</TableHead>
                     <TableHead className="font-bold text-[10px] uppercase tracking-widest h-14 text-right">Stock</TableHead>
                     <TableHead className="font-bold text-[10px] uppercase tracking-widest h-14 text-right pr-8">Actions</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {filteredProducts.length === 0 ? (
                     <TableRow>
                       <TableCell colSpan={6} className="h-60 text-center text-slate-300 font-bold uppercase text-[10px] tracking-widest">
                         No stock found in this category
                       </TableCell>
                     </TableRow>
                   ) : (
                     filteredProducts.map((p) => {
                       const status = getStockStatus(p.stock);
                       return (
                         <TableRow key={p.id} className="hover:bg-slate-50/50 transition-colors border-slate-50 group">
                           <TableCell className="pl-8">
                             <p className="font-bold text-slate-900 text-sm">{p.name}</p>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                               Created: {p.createdAt ? format(new Date(p.createdAt), 'dd MMM yyyy') : '--'}
                             </p>
                           </TableCell>
                           <TableCell>
                             <code className="text-[10px] font-bold text-secondary bg-secondary/5 px-2 py-1 rounded-lg uppercase tracking-wider">
                               {p.barcode || 'NO-SCAN'}
                             </code>
                           </TableCell>
                           <TableCell>
                             <Badge variant="outline" className="rounded-lg font-bold text-[9px] uppercase border-slate-100 text-slate-400">
                               {p.category}
                             </Badge>
                           </TableCell>
                           <TableCell className="text-right">
                             <p className="font-black text-slate-900 text-sm">₹{p.price.toLocaleString()}</p>
                           </TableCell>
                           <TableCell className="text-right">
                              <Badge variant={status.variant} className="rounded-lg font-bold text-[9px] uppercase tracking-wider h-7 px-2 border-none">
                                {status.label} • {p.stock ?? '∞'}
                              </Badge>
                           </TableCell>
                           <TableCell className="text-right pr-8">
                             <Button 
                               variant="ghost" 
                               size="sm" 
                               onClick={() => handleEdit(p)}
                               className="h-9 w-9 rounded-xl hover:bg-secondary hover:text-white transition-all opacity-0 group-hover:opacity-100"
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
          </CardContent>
        </Card>

        <aside className="space-y-6 flex flex-col min-h-0">
          <Card className="bg-white border-none shadow-sm rounded-[32px] overflow-hidden flex flex-col flex-1">
            <CardHeader className="p-8 border-b bg-slate-900 text-white shrink-0">
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-3">
                {isEditing ? (selectedProduct ? 'Refine Product' : 'Enroll New Product') : 'Stock Intelligence'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden">
               {isEditing ? (
                 <ScrollArea className="h-full">
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Item Description</Label>
                          <Input
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Amul Milk 1L"
                            className="h-12 bg-slate-50 border-none rounded-xl font-bold text-sm px-6"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sales Price (₹)</Label>
                            <Input
                              required
                              type="number"
                              value={formData.price}
                              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                              className="h-12 bg-slate-50 border-none rounded-xl font-bold text-sm px-6"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cost Price (₹)</Label>
                            <Input
                              type="number"
                              value={formData.costPrice}
                              onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                              className="h-12 bg-slate-50 border-none rounded-xl font-bold text-sm px-6"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Category Bucket</Label>
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

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Stock Count</Label>
                            <Input
                              type="number"
                              value={formData.stock}
                              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                              className="h-12 bg-slate-50 border-none rounded-xl font-bold text-sm px-6"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Barcode ID</Label>
                            <Input
                              value={formData.barcode}
                              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                              className="h-12 bg-slate-50 border-none rounded-xl font-bold text-sm px-6"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 space-y-3">
                        <Button type="submit" className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest bg-primary text-white shadow-xl shadow-primary/10">
                          {selectedProduct ? 'COMMIT CHANGES' : 'SAVE TO LEDGER'}
                        </Button>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          onClick={() => setIsEditing(false)} 
                          className="w-full h-12 rounded-xl font-bold text-[10px] uppercase text-slate-400"
                        >
                          Discard
                        </Button>
                      </div>
                    </form>
                 </ScrollArea>
               ) : (
                 <div className="p-10 text-center space-y-8 h-full flex flex-col justify-center">
                   <div className="mx-auto w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center">
                     <Package className="h-10 w-10 text-slate-200" />
                   </div>
                   <div className="space-y-2">
                     <h4 className="text-xl font-black text-secondary uppercase tracking-tight">Stock Analysis</h4>
                     <p className="text-xs font-medium text-slate-400 px-8">Select any item from the global catalog to view advanced metrics and modify stock levels.</p>
                   </div>
                   <div className="grid grid-cols-2 gap-4 px-8">
                      <div className="bg-slate-50 p-4 rounded-2xl text-left">
                        <p className="text-[8px] font-black uppercase text-slate-400 mb-1">Low Items</p>
                        <p className="text-2xl font-black text-secondary">{products.filter(p => p.stock !== undefined && p.stock < 10 && p.stock > 0).length}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl text-left">
                        <p className="text-[8px] font-black uppercase text-slate-400 mb-1">Dead Stock</p>
                        <p className="text-2xl font-black text-primary">{products.filter(p => p.stock !== undefined && p.stock <= 0).length}</p>
                      </div>
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
