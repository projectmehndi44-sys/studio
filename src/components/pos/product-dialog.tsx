"use client";

import { useState, useEffect } from 'react';
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
import { Product } from '@/lib/types';
import { useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Search, Edit, Trash2 } from 'lucide-react';
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

  const filteredProducts = (products || []).filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.barcode?.includes(searchQuery)
  );

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] rounded-[48px] p-12 border-none shadow-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-4xl font-black tracking-tighter uppercase text-secondary">
            Item Master
          </DialogTitle>
        </DialogHeader>

        {!isEditing ? (
          <div className="flex-1 flex flex-col gap-8 min-h-0">
            <div className="flex gap-4 items-center">
               <div className="relative flex-1">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                 <Input 
                   placeholder="Search catalog..." 
                   className="pl-12 h-16 bg-slate-50 border-none rounded-2xl font-bold text-lg"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                 />
               </div>
               <Button onClick={() => setIsEditing(true)} className="h-16 px-10 rounded-2xl font-black uppercase tracking-widest bg-primary">
                 Add New
               </Button>
            </div>

            <ScrollArea className="flex-1 border-2 border-slate-50 rounded-[32px] p-4">
               <div className="divide-y divide-slate-50">
                 {filteredProducts.map(p => (
                   <div key={p.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors rounded-2xl">
                     <div>
                       <p className="font-black text-xl text-slate-900">{p.name}</p>
                       <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                         ₹{p.price} • {p.category} • STOCK: {p.stock ?? '∞'}
                       </p>
                     </div>
                     <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedProduct(p); setIsEditing(true); }} className="h-14 w-14 rounded-2xl">
                          <Edit className="h-6 w-6" />
                        </Button>
                     </div>
                   </div>
                 ))}
                 {filteredProducts.length === 0 && (
                   <div className="p-12 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">
                     No matching items found
                   </div>
                 )}
               </div>
            </ScrollArea>
            <Button variant="outline" onClick={onClose} className="h-16 rounded-2xl font-black text-lg">Close Master</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8 pt-4">
            <div className="grid grid-cols-2 gap-8">
              <div className="col-span-2 space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Item Name</Label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Levi's Denim Jeans"
                  className="h-16 bg-slate-50 border-none rounded-2xl font-bold text-xl"
                />
              </div>
              
              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Selling Price (₹)</Label>
                <Input
                  required
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="h-16 bg-slate-50 border-none rounded-2xl font-bold text-xl"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Cost Price (₹)</Label>
                <Input
                  type="number"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  className="h-16 bg-slate-50 border-none rounded-2xl font-bold text-xl"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(val) => setFormData({ ...formData, category: val })}
                >
                  <SelectTrigger className="h-16 bg-slate-50 border-none rounded-2xl font-bold text-lg px-6">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-3xl p-2 border-none shadow-2xl">
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat} className="font-bold py-4 rounded-xl">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Stock Qty</Label>
                <Input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="Unlimited"
                  className="h-16 bg-slate-50 border-none rounded-2xl font-bold text-xl"
                />
              </div>
            </div>

            <DialogFooter className="pt-8 gap-4">
              <Button type="button" variant="ghost" onClick={() => { setIsEditing(false); setSelectedProduct(null); }} className="h-16 rounded-2xl font-bold px-10">Cancel</Button>
              <Button type="submit" className="h-16 rounded-2xl font-black px-12 text-lg bg-primary">Save Changes</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}