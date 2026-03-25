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

  // Check if query is a numeric value or a simple math expression (Calculator Mode)
  const quickPrice = useMemo(() => {
    try {
      // Basic support for arithmetic like "100+20"
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
        // Add the first matching product
        onProductSelect(filteredProducts[0]);
        setQuery('');
      } else {
        // AUTOMATIC ADD: If no match found, create it automatically
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
        onAddNewProduct(query.trim(), true); // Silent background creation
        setQuery('');
      }
    }
  };

  const showAddPrompt = query.length > 2 && filteredProducts.length === 0 && !quickPrice;

  return (
    <div className="relative w-full">
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearchSubmit();
              }
            }}
            placeholder="Search items or type price..."
            className="pl-10 h-14 bg-white border-slate-200 focus-visible:ring-2 focus-visible:ring-primary text-xl font-bold rounded-2xl shadow-sm"
          />
        </div>
        {quickPrice ? (
          <Button
            onClick={handleQuickAdd}
            className="h-14 px-6 bg-primary text-primary-foreground font-black text-lg animate-in scale-in rounded-2xl"
          >
            <Plus className="h-6 w-6 mr-2" /> ADD ₹{quickPrice}
          </Button>
        ) : (
          <button
            onClick={onScanClick}
            className="h-14 w-14 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
          >
            <Scan className="h-6 w-6" />
          </button>
        )}
      </div>

      {(filteredProducts.length > 0 || showAddPrompt) && !quickPrice && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
          <ScrollArea className="max-h-80">
            {filteredProducts.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  onProductSelect(p);
                  setQuery('');
                }}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-none group"
              >
                <div className="text-left">
                  <p className="font-bold text-lg text-slate-900 group-hover:text-primary transition-colors">{p.name}</p>
                  <p className="text-sm text-slate-400 font-medium">
                    ₹{p.price} • {p.category} {p.barcode ? `• ${p.barcode}` : ''}
                  </p>
                </div>
                <div className="text-right">
                  {p.stock !== undefined ? (
                    <Badge variant={p.stock < 10 ? "destructive" : "secondary"} className="rounded-lg font-black text-[10px]">
                      STOCK: {p.stock}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="rounded-lg font-black text-[10px] text-slate-300">UNTRACKED</Badge>
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
                className="w-full flex items-center gap-4 p-6 hover:bg-primary/5 transition-colors group"
              >
                <div className="bg-primary/10 p-3 rounded-2xl group-hover:bg-primary group-hover:text-white transition-colors">
                  <PackagePlus className="h-6 w-6 text-primary group-hover:text-white" />
                </div>
                <div className="text-left">
                  <p className="font-black text-lg text-slate-900">Add "{query}" to Catalog</p>
                  <p className="text-sm font-bold text-primary">New item detected • Tap to save details</p>
                </div>
              </button>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
