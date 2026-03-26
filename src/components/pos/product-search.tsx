"use client";

import { useState, useMemo, useEffect, KeyboardEvent } from 'react';
import { Search, Scan, Plus, PackagePlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Product } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProductSearchProps {
  products: Product[] | null;
  onProductSelect: (product: Product) => void;
  onScanClick: () => void;
  onAddNewProduct: (initialName: string, isSilent?: boolean) => void;
  inputRef?: React.RefObject<HTMLInputElement>;
}

export function ProductSearch({ products, onProductSelect, onScanClick, onAddNewProduct, inputRef }: ProductSearchProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Quick Price detection
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

  const filteredProducts = useMemo(() => {
    if (!query || !products) return [];
    const lowerQuery = query.toLowerCase();
    
    // If it's a numeric search, prioritize exact price matches from inventory
    if (quickPrice !== null) {
      return products.filter(p => p.price === quickPrice).slice(0, 10);
    }

    return products.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) || 
      (p.barcode && p.barcode.toLowerCase().includes(lowerQuery))
    ).slice(0, 10);
  }, [query, products, quickPrice]);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [query]);

  const handleQuickAdd = () => {
    if (quickPrice) {
      const quickItem: Product = {
        id: `quick-${Date.now()}`,
        name: `Custom Item (₹${quickPrice})`,
        barcode: 'CUSTOM',
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
    if (quickPrice && filteredProducts.length === 0) {
      handleQuickAdd();
      return;
    }

    if (selectedIndex >= 0 && selectedIndex < filteredProducts.length) {
      onProductSelect(filteredProducts[selectedIndex]);
      setQuery('');
      return;
    }

    if (query.trim().length > 0) {
      if (filteredProducts.length > 0) {
        onProductSelect(filteredProducts[0]);
        setQuery('');
      } else if (quickPrice) {
        handleQuickAdd();
      } else {
        // Ghost Enrollment trigger
        onAddNewProduct(query.trim(), true);
        setQuery('');
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < filteredProducts.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > -1 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit();
    }
  };

  const showAddPrompt = query.length > 2 && filteredProducts.length === 0 && !quickPrice;

  return (
    <div className="relative w-full">
      <div className="relative flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="[Enter] Search Item or Price..."
            className="pl-12 h-14 bg-white border border-slate-100 focus-visible:ring-2 focus-visible:ring-primary/20 text-lg font-bold rounded-2xl shadow-sm"
            autoFocus
          />
        </div>
        
        <button
          onClick={onScanClick}
          tabIndex={-1}
          className="h-14 w-14 flex items-center justify-center rounded-2xl bg-white border border-slate-100 text-slate-500 hover:bg-slate-50 transition-all shadow-sm"
        >
          <Scan className="h-6 w-6" />
        </button>
      </div>

      {(filteredProducts.length > 0 || quickPrice !== null || showAddPrompt) && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white border rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
          <ScrollArea className="max-h-[350px]">
            {quickPrice !== null && (
               <button
                 onClick={handleQuickAdd}
                 className={cn(
                   "w-full flex items-center justify-between p-4 bg-primary/5 hover:bg-primary/10 transition-colors border-b outline-none",
                   selectedIndex === -1 && "border-l-4 border-l-primary"
                 )}
               >
                 <div className="text-left">
                   <p className="font-black text-base text-primary">Quick Add: ₹{quickPrice}</p>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">General Sale Item</p>
                 </div>
                 <Plus className="h-5 w-5 text-primary" />
               </button>
            )}

            {filteredProducts.map((p, index) => (
              <button
                key={p.id}
                onClick={() => {
                  onProductSelect(p);
                  setQuery('');
                }}
                className={cn(
                  "w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors border-b last:border-none group outline-none",
                  selectedIndex === index && "bg-slate-50 border-l-4 border-l-secondary"
                )}
              >
                <div className="text-left">
                  <p className={cn("font-bold text-base text-slate-900", selectedIndex === index && "text-secondary")}>{p.name}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                    ₹{p.price} • {p.category}
                  </p>
                </div>
                <div className="text-right">
                   <Badge variant="outline" className="rounded-lg font-bold text-[9px] text-slate-400 h-6 px-2">SELECT</Badge>
                </div>
              </button>
            ))}
            
            {showAddPrompt && (
              <button
                onClick={() => {
                  onAddNewProduct(query);
                  setQuery('');
                }}
                className="w-full flex items-center gap-4 p-5 hover:bg-primary/5 transition-colors group outline-none"
              >
                <div className="bg-primary/10 p-4 rounded-xl group-hover:bg-primary group-hover:text-white transition-all">
                  <PackagePlus className="h-6 w-6 text-primary group-hover:text-white" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-lg text-slate-900 tracking-tight">Add "{query}" to Catalog</p>
                  <p className="text-xs font-bold text-primary">New item detected • Tap to save</p>
                </div>
              </button>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
