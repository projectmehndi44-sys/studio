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
import { useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

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
  product?: Product | null;
  initialName?: string;
}

export function ProductDialog({ isOpen, onClose, product, initialName }: ProductDialogProps) {
  const { toast } = useToast();
  const db = useFirestore();
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    costPrice: '',
    barcode: '',
    category: 'General',
    stock: '',
    isPopular: false
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        price: product.price.toString(),
        costPrice: (product.costPrice || 0).toString(),
        barcode: product.barcode || '',
        category: product.category || 'General',
        stock: (product.stock || '').toString(),
        isPopular: !!product.isPopular
      });
    } else if (initialName) {
      setFormData(prev => ({ ...prev, name: initialName }));
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
  }, [product, initialName, isOpen]);

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

    if (product?.id) {
      updateDocumentNonBlocking(doc(db, 'products', product.id), productData);
      toast({ title: "Product Updated", description: `${formData.name} saved successfully.` });
    } else {
      addDocumentNonBlocking(collection(db, 'products'), {
        ...productData,
        createdAt: new Date().toISOString()
      });
      toast({ title: "Product Added", description: `${formData.name} added to catalog.` });
    }
    
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] rounded-[32px] p-8 border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black tracking-tight uppercase">
            {product ? 'Edit Product' : 'Add New Product'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Item Name</Label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Levi's Denim Jeans"
                className="h-12 bg-slate-50 border-none rounded-xl font-bold"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Selling Price (₹)</Label>
                <Input
                  required
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  className="h-12 bg-slate-50 border-none rounded-xl font-bold"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cost Price (₹)</Label>
                <Input
                  type="number"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  placeholder="0.00"
                  className="h-12 bg-slate-50 border-none rounded-xl font-bold"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(val) => setFormData({ ...formData, category: val })}
              >
                <SelectTrigger className="h-12 bg-slate-50 border-none rounded-xl font-bold">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-xl">
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat} className="font-bold py-3">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Barcode (Optional)</Label>
                <Input
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="Scan or type..."
                  className="h-12 bg-slate-50 border-none rounded-xl font-bold"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Stock Qty (Optional)</Label>
                <Input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="Unlimited"
                  className="h-12 bg-slate-50 border-none rounded-xl font-bold"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="popular"
                checked={formData.isPopular}
                onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                className="w-5 h-5 accent-primary rounded-lg"
              />
              <Label htmlFor="popular" className="font-bold text-slate-600">Mark as Top Seller (Quick Tap)</Label>
            </div>
          </div>

          <DialogFooter className="pt-4 gap-3">
            <Button type="button" variant="ghost" onClick={onClose} className="h-12 rounded-xl font-bold">Cancel</Button>
            <Button type="submit" className="h-12 rounded-xl font-black px-8">Save Product</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
