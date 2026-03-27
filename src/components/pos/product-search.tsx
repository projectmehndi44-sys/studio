"use client";

import { useState, useMemo, useEffect, KeyboardEvent, useRef } from 'react';
import { Search, Scan, Plus, X, ArrowLeft } from 'lucide-react';
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
  const [isFocused, setIsFocused] = useState(false);
  const internalInputRef = useRef<HTMLInputElement>(null);
  const activeInputRef = inputRef || internalInputRef;

  // Logical Quick Price Detection
  const quickPrice = useMemo(() => {
    const price = parseFloat(query);
    return isNaN(price) || price <= 0 ? null : price;
  }, [query]);

  const filteredProducts = useMemo(() => {
    if (!query || !products) return [];
    const lowerQuery = query.toLowerCase();
    
    // If input is a price, show inventory items matching that price
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

  const handleProductPick = (p: Product) => {
    onProductSelect(p);
    setQuery('');
    // Keep focus for rapid multi-item entry unless mobile
    if (window.innerWidth > 768) {
      activeInputRef.current?.focus();
    } else {
      setIsFocused(false);
      activeInputRef.current?.blur();
    }
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
        // Ghost Enrollment
        onAddNewProduct(query, true);
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

  return (
    <>
      <div className="relative w-full">
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
          </div>
          <button onClick={onScanClick} className="h-14 w-14 flex items-center justify-center rounded-2xl bg-white border border-slate-100 text-slate-500 shadow-sm"><Scan className="h-6 w-6" /></button>
        </div>
      </div>

      {/* SEARCH OVERLAY - Solves Keyboard Obstruction */}
      {isFocused && (
        <div className="fixed inset-0 z-[100] bg-white md:bg-slate-900/40 md:backdrop-blur-sm animate-in fade-in duration-200">
          <div className="max-w-4xl mx-auto w-full h-full md:h-[80vh] md:mt-10 bg-white md:rounded-[40px] shadow-2xl flex flex-col overflow-hidden">
            <header className="p-6 md:p-8 border-b flex items-center gap-4 shrink-0">
              <Button variant="ghost" size="icon" onClick={() => setIsFocused(false)} className="md:hidden">
                <ArrowLeft className="h-6 w-6" />
              </Button>
              <div className="relative flex-1">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-primary" />
                <Input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter name, price or barcode..."
                  className="pl-16 h-16 bg-slate-50 border-none rounded-[24px] text-xl font-black placeholder:text-slate-300 focus-visible:ring-primary/10"
                />
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsFocused(false)} className="hidden md:flex h-12 w-12 rounded-2xl">
                <X className="h-6 w-6" />
              </Button>
            </header>

            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 md:p-8 space-y-2">
                  {quickPrice !== null && (
                     <button 
                       onClick={handleQuickAdd} 
                       className="w-full flex items-center justify-between p-6 bg-primary/5 hover:bg-primary/10 rounded-[24px] border-2 border-primary/10 transition-all group"
                     >
                       <div className="text-left">
                         <p className="text-[10px] font-black uppercase text-primary tracking-[0.2em] mb-1">Custom Entry Detected</p>
                         <p className="font-black text-2xl text-secondary">Add Item: ₹{quickPrice}</p>
                       </div>
                       <Plus className="h-8 w-8 text-primary group-active:scale-90 transition-transform" />
                     </button>
                  )}

                  <div className="grid grid-cols-1 gap-2">
                    {filteredProducts.map((p, index) => (
                      <button 
                        key={p.id} 
                        onClick={() => handleProductPick(p)} 
                        className={cn(
                          "w-full flex items-center justify-between p-5 rounded-[24px] transition-all outline-none border-2",
                          selectedIndex === index 
                            ? "bg-secondary text-white border-secondary shadow-xl -translate-y-1" 
                            : "bg-white hover:bg-slate-50 border-transparent"
                        )}
                      >
                        <div className="text-left flex items-center gap-4">
                          <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center font-black text-xs", selectedIndex === index ? "bg-white/10" : "bg-slate-100 text-slate-400")}>
                            {p.category.slice(0, 1)}
                          </div>
                          <div>
                            <p className={cn("font-black text-lg tracking-tight", selectedIndex === index ? "text-white" : "text-slate-900")}>{p.name}</p>
                            <p className={cn("text-[10px] font-bold uppercase tracking-widest", selectedIndex === index ? "text-slate-300" : "text-slate-400")}>{p.category} • {p.barcode || 'NO BARCODE'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={cn("text-2xl font-black tracking-tighter", selectedIndex === index ? "text-white" : "text-primary")}>₹{p.price}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {query.trim() && filteredProducts.length === 0 && !quickPrice && (
                    <div className="py-20 text-center animate-in zoom-in-95">
                      <div className="mx-auto w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center mb-4">
                        <Plus className="h-10 w-10 text-slate-200" />
                      </div>
                      <h3 className="text-lg font-black text-secondary uppercase tracking-tight">Product Not Found</h3>
                      <p className="text-slate-400 font-bold text-xs uppercase mt-2">Press Enter to Quick Enroll "{query}"</p>
                    </div>
                  )}

                  {!query.trim() && (
                    <div className="py-20 text-center text-slate-300">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em]">Type to explore Krishna's Catalog</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            <footer className="p-6 bg-slate-50 border-t shrink-0 hidden md:block">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                <div className="flex gap-6">
                  <span className="flex items-center gap-2"><Badge variant="outline" className="h-5 px-1.5 rounded-md text-[9px]">ENTER</Badge> Select Item</span>
                  <span className="flex items-center gap-2"><Badge variant="outline" className="h-5 px-1.5 rounded-md text-[9px]">↑ ↓</Badge> Navigate List</span>
                  <span className="flex items-center gap-2"><Badge variant="outline" className="h-5 px-1.5 rounded-md text-[9px]">ESC</Badge> Close Search</span>
                </div>
                <p>Showing {filteredProducts.length} results</p>
              </div>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
