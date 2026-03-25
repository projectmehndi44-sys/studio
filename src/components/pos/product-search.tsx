"use client";

import { useState, useMemo } from 'react';
import { Search, Scan, Plus, PackagePlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Product } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

interface ProductSearchProps {
  products: Product[] | null;
  onProductSelect: (product: Product) => void;
  onScanClick: () => void;
  onAddNewProduct: (initialName: string, isSilent?: boolean) => void;
}

export function ProductSearch({ products, onProductSelect, onScanClick, onAddNewProduct }: ProductSearchProps) {
  const [query, setQuery] = useState('');

  const filteredProducts = useMemo(() => {
    if (!query || !products) return [];
    const lowerQuery = query.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) || 
      (p.barcode && p.barcode.toLowerCase().includes(lowerQuery))
    ).slice(0, 10);
  }, [query, products]);

  const quickPrice = useMemo(() => {
    try {
      if (query.includes('+')) {
        const parts = query.split('+').map(p => parseFloat(p));
        if (parts.every(p => !isNaN(p))) {
          return parts.reduce((a, b) => a + b, 0);
        }
      }
      const price = parseFloat(query);
      return isNaN(price) || price <= 0 ? null : price;
    } catch (e) {
      return null;
    }
  }, [query]);

  const handleQuickAdd = () => {
    if (quickPrice) {
      const quickItem: Product = {
        id: `quick-${Date.now()}`,
        name: `Quick Item (₹${quickPrice})`,
        barcode: 'QUICK',
        price: quickPrice,
        costPrice: quickPrice * 0.8,
        category: 'Custom',
        isPopular: false
      };
      onProductSelect(quickItem);
      setQuery('');
    }
  };

  const handleSearchSubmit = () => {
    if (quickPrice) {
      handleQuickAdd();
      return;
    }

    if (query.trim().length > 1) {
      if (filteredProducts.length > 0) {
        onProductSelect(filteredProducts[0]);
        setQuery('');
      } else {
        const autoItem: Product = {
          id: `auto-${Date.now()}`,
          name: query.trim(),
          barcode: '',
          price: 0,
          costPrice: 0,
          category: 'General',
          isPopular: false
        };
        onProductSelect(autoItem);
        onAddNewProduct(query.trim(), true);
        setQuery('');
      }
    }
  };

  const showAddPrompt = query.length > 2 && filteredProducts.length === 0 && !quickPrice;

  return (
    <div className="relative w-full">
      <div className="relative flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-7 w-7 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearchSubmit();
              }
            }}
            placeholder="Search items or type price (e.g. 500)..."
            className="pl-16 h-20 bg-white border-2 border-slate-50 focus-visible:ring-4 focus-visible:ring-primary/20 text-3xl font-black rounded-[28px] shadow-xl"
          />
        </div>
        {quickPrice ? (
          <Button
            onClick={handleQuickAdd}
            className="h-20 px-10 bg-primary text-primary-foreground font-black text-2xl animate-in scale-in rounded-[28px] shadow-2xl shadow-primary/20"
          >
            <Plus className="h-8 w-8 mr-3" /> ADD ₹{quickPrice}
          </Button>
        ) : (
          <button
            onClick={onScanClick}
            className="h-20 w-20 flex items-center justify-center rounded-[28px] bg-white border-2 border-slate-50 text-slate-600 hover:bg-slate-50 transition-all active:scale-90 shadow-xl"
          >
            <Scan className="h-10 w-10" />
          </button>
        )}
      </div>

      {(filteredProducts.length > 0 || showAddPrompt) && !quickPrice && (
        <div className="absolute top-full left-0 right-0 mt-4 z-50 bg-white border-none rounded-[36px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] overflow-hidden animate-in fade-in slide-in-from-top-4">
          <ScrollArea className="max-h-[500px]">
            {filteredProducts.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  onProductSelect(p);
                  setQuery('');
                }}
                className="w-full flex items-center justify-between p-8 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-none group"
              >
                <div className="text-left">
                  <p className="font-black text-2xl text-slate-900 group-hover:text-primary transition-colors tracking-tight">{p.name}</p>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
                    ₹{p.price} • {p.category}
                  </p>
                </div>
                <div className="text-right">
                  {p.stock !== undefined ? (
                    <Badge variant={p.stock < 10 ? "destructive" : "secondary"} className="rounded-xl font-black text-xs h-10 px-4">
                      STOCK: {p.stock}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="rounded-xl font-black text-xs text-slate-300 h-10 px-4">UNTRACKED</Badge>
                  )}
                </div>
              </button>
            ))}
            
            {showAddPrompt && (
              <button
                onClick={() => {
                  onAddNewProduct(query);
                  setQuery('');
                }}
                className="w-full flex items-center gap-6 p-10 hover:bg-primary/5 transition-colors group"
              >
                <div className="bg-primary/10 p-6 rounded-[28px] group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                  <PackagePlus className="h-10 w-10 text-primary group-hover:text-white" />
                </div>
                <div className="text-left">
                  <p className="font-black text-3xl text-slate-900 tracking-tighter">Add "{query}" to Catalog</p>
                  <p className="text-lg font-bold text-primary tracking-tight">New item detected • Tap to save details</p>
                </div>
              </button>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}