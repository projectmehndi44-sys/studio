"use client";

import { useState, useMemo, useEffect, KeyboardEvent, useRef } from 'react';
import { Search, Scan, Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Product } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface ProductSearchProps {
  products: Product[] | null;
  onProductSelect: (product: Product) => void;
  onScanClick: () => void;
  onAddNewProduct: (initialName: string) => void;
  inputRef?: React.RefObject<HTMLInputElement>;
  query: string;
  setQuery: (q: string) => void;
}

export function ProductSearch({ 
  products, 
  onProductSelect, 
  onScanClick, 
  onAddNewProduct, 
  inputRef,
  query,
  setQuery
}: ProductSearchProps) {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const internalInputRef = useRef<HTMLInputElement>(null);
  const activeInputRef = inputRef || internalInputRef;
  const containerRef = useRef<HTMLDivElement>(null);

  const quickPrice = useMemo(() => {
    const price = parseFloat(query);
    return isNaN(price) || price <= 0 ? null : price;
  }, [query]);

  const filteredProducts = useMemo(() => {
    if (!query || !products) return [];
    const lowerQuery = query.toLowerCase();
    
    if (quickPrice !== null) {
      return products.filter(p => p.price === quickPrice).slice(0, 15);
    }

    return products.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) || 
      (p.barcode && p.barcode.toLowerCase().includes(lowerQuery))
    ).slice(0, 20);
  }, [query, products, quickPrice]);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProductPick = (p: Product) => {
    onProductSelect(p);
    setQuery('');
    setSelectedIndex(-1);
    setIsFocused(false);
    activeInputRef.current?.focus();
  };

  const handleQuickAdd = () => {
    if (quickPrice) {
      const quickItem: Product = {
        id: `custom-${Date.now()}`,
        name: `Custom Item (₹${quickPrice})`,
        barcode: 'CUSTOM',
        price: quickPrice,
        costPrice: quickPrice * 0.8,
        category: 'General',
        isPopular: false
      };
      handleProductPick(quickItem);
    }
  };

  const handleSearchSubmit = () => {
    if (selectedIndex >= 0 && selectedIndex < filteredProducts.length) {
      handleProductPick(filteredProducts[selectedIndex]);
      return;
    }

    if (query.trim()) {
      if (filteredProducts.length > 0) {
        handleProductPick(filteredProducts[0]);
      } else if (quickPrice) {
        handleQuickAdd();
      } else {
        onAddNewProduct(query);
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
    } else if (e.key === 'Escape') {
      setIsFocused(false);
      activeInputRef.current?.blur();
    }
  };

  const showResults = isFocused && (query.trim() !== '' || quickPrice !== null);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            ref={activeInputRef}
            value={query}
            onFocus={() => setIsFocused(true)}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search Item or Enter Price..."
            className="pl-12 h-14 bg-white border border-slate-100 focus-visible:ring-2 focus-visible:ring-primary/20 text-lg font-bold rounded-2xl shadow-sm"
          />
          {query && (
            <button 
              onClick={() => { setQuery(''); setSelectedIndex(-1); }} 
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <button 
          onClick={onScanClick} 
          className="h-14 w-14 flex items-center justify-center rounded-2xl bg-white border border-slate-100 text-slate-500 shadow-sm hover:bg-slate-50"
        >
          <Scan className="h-6 w-6" />
        </button>
      </div>

      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 z-[50] bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <ScrollArea className="max-h-[400px]">
            <div className="p-3 space-y-1">
              {quickPrice !== null && (
                <button 
                  onClick={handleQuickAdd} 
                  className="w-full flex items-center justify-between p-4 bg-primary/5 hover:bg-primary/10 rounded-2xl border-2 border-primary/10 transition-all group mb-2"
                >
                  <div className="text-left">
                    <p className="text-[9px] font-black uppercase text-primary tracking-widest mb-1">Add Price Manually</p>
                    <p className="font-black text-lg text-secondary">Custom Item: ₹{quickPrice}</p>
                  </div>
                  <Plus className="h-6 w-6 text-primary" />
                </button>
              )}

              {filteredProducts.map((p, index) => (
                <button 
                  key={p.id} 
                  onClick={() => handleProductPick(p)} 
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-2xl transition-all outline-none border-2",
                    selectedIndex === index 
                      ? "bg-secondary text-white border-secondary shadow-lg" 
                      : "bg-white hover:bg-slate-50 border-transparent"
                  )}
                >
                  <div className="text-left flex items-center gap-3">
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center font-black text-[10px]", 
                      selectedIndex === index ? "bg-white/10" : "bg-slate-100 text-slate-400"
                    )}>
                      {p.category.slice(0, 1)}
                    </div>
                    <div>
                      <p className={cn("font-bold text-sm tracking-tight", selectedIndex === index ? "text-white" : "text-slate-900")}>{p.name}</p>
                      <p className={cn("text-[9px] font-bold uppercase tracking-widest", selectedIndex === index ? "text-slate-300" : "text-slate-400")}>{p.category} • {p.barcode || 'NO BARCODE'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-lg font-black tracking-tighter", selectedIndex === index ? "text-white" : "text-primary")}>₹{p.price}</p>
                  </div>
                </button>
              ))}

              {query.trim() && filteredProducts.length === 0 && !quickPrice && (
                <button 
                  onClick={() => onAddNewProduct(query)}
                  className="w-full py-6 text-center hover:bg-slate-50 transition-colors"
                >
                  <p className="text-secondary font-black uppercase text-xs">No matches found</p>
                  <p className="text-primary font-black text-[10px] uppercase mt-2 tracking-widest">Enroll "{query}" & Add to Bill</p>
                </button>
              )}
            </div>
          </ScrollArea>
          <div className="p-3 bg-slate-50 border-t flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-slate-400">
            <span>Arrow Keys to navigate • Enter to select</span>
            <span>{filteredProducts.length} Results</span>
          </div>
        </div>
      )}
    </div>
  );
}
