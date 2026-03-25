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
import { Search, Edit } from 'lucide-react';
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
      <DialogContent className="sm:max-w-[600px] rounded-3xl p-8 border-none shadow-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-tight uppercase text-secondary">
            Item Master
          </DialogTitle>
        </DialogHeader>

        {!isEditing ? (
          <div className="flex-1 flex flex-col gap-6 min-h-0 mt-2">
            <div className="flex gap-2 items-center">
               <div className="relative flex-1">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                 <Input 
                   placeholder="Search catalog..." 
                   className="pl-10 h-11 bg-slate-50 border-none rounded-xl font-medium text-sm"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                 />
               </div>
               <Button onClick={() => setIsEditing(true)} className="h-11 px-6 rounded-xl font-bold uppercase text-[10px] tracking-wider bg-primary">
                 Add New
               </Button>
            </div>

            <ScrollArea className="flex-1 border border-slate-100 rounded-xl p-2 bg-slate-50/30">
               <div className="divide-y divide-slate-50">
                 {filteredProducts.map(p => (
                   <div key={p.id} className="p-4 flex items-center justify-between hover:bg-white transition-colors rounded-lg">
                     <div>
                       <p className="font-bold text-sm text-slate-900">{p.name}</p>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                         ₹{p.price} • {p.category} • STOCK: {p.stock ?? '∞'}
                       </p>
                     </div>
                     <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedProduct(p); setIsEditing(true); }} className="h-9 w-9 rounded-lg">
                          <Edit className="h-4 w-4" />
                        </Button>
                     </div>
                   </div>
                 ))}
                 {filteredProducts.length === 0 && (
                   <div className="p-8 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                     No items found
                   </div>
                 )}
               </div>
            </ScrollArea>
            <Button variant="outline" onClick={onClose} className="h-11 rounded-xl font-bold text-xs uppercase tracking-wider">Close</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Item Name</Label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Levi's Denim Jeans"
                  className="h-11 bg-slate-50 border-none rounded-xl font-bold text-sm"
                />
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Selling Price (₹)</Label>
                <Input
                  required
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="h-11 bg-slate-50 border-none rounded-xl font-bold text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cost Price (₹)</Label>
                <Input
                  type="number"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  className="h-11 bg-slate-50 border-none rounded-xl font-bold text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(val) => setFormData({ ...formData, category: val })}
                >
                  <SelectTrigger className="h-11 bg-slate-50 border-none rounded-xl font-bold text-xs px-4">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl p-1 border-none shadow-xl">
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat} className="font-bold text-xs py-2.5 rounded-lg">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Stock Qty</Label>
                <Input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="Unlimited"
                  className="h-11 bg-slate-50 border-none rounded-xl font-bold text-sm"
                />
              </div>
            </div>

            <DialogFooter className="pt-4 gap-2">
              <Button type="button" variant="ghost" onClick={() => { setIsEditing(false); setSelectedProduct(null); }} className="h-11 rounded-xl font-bold px-6 text-xs uppercase">Cancel</Button>
              <Button type="submit" className="h-11 rounded-xl font-bold px-8 text-xs uppercase bg-primary">Save Item</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}