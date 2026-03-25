"use client";

import { useState, useMemo } from 'react';
import { Search, Scan, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Product } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

interface ProductSearchProps {
  products: Product[] | null;
  onProductSelect: (product: Product) => void;
  onScanClick: () => void;
}

export function ProductSearch({ products, onProductSelect, onScanClick }: ProductSearchProps) {
  const [query, setQuery] = useState('');

  const filteredProducts = useMemo(() => {
    if (!query || !products) return [];
    const lowerQuery = query.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) || 
      p.barcode.includes(lowerQuery)
    ).slice(0, 10);
  }, [query, products]);

  // Check if query is a numeric value (Calculator Mode)
  const quickPrice = useMemo(() => {
    const price = parseFloat(query);
    return isNaN(price) || price <= 0 ? null : price;
  }, [query]);

  const handleQuickAdd = () => {
    if (quickPrice) {
      const quickItem: Product = {
        id: `quick-${Date.now()}`,
        name: `Quick Item (₹${quickPrice})`,
        barcode: 'QUICK',
        price: quickPrice,
        costPrice: quickPrice * 0.8, // Estimate
        category: 'Custom',
        isPopular: false
      };
      onProductSelect(quickItem);
      setQuery('');
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && quickPrice && handleQuickAdd()}
            placeholder="Type price or search items..."
            className="pl-10 h-14 bg-secondary border-none focus-visible:ring-2 focus-visible:ring-primary text-xl font-bold"
          />
        </div>
        {quickPrice ? (
          <Button
            onClick={handleQuickAdd}
            className="h-14 px-6 bg-primary text-primary-foreground font-black text-lg animate-in scale-in"
          >
            <Plus className="h-6 w-6 mr-2" /> ADD ₹{quickPrice}
          </Button>
        ) : (
          <button
            onClick={onScanClick}
            className="h-14 w-14 flex items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-95 shadow-lg"
          >
            <Scan className="h-6 w-6" />
          </button>
        )}
      </div>

      {filteredProducts.length > 0 && !quickPrice && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
          <ScrollArea className="max-h-80">
            {filteredProducts.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  onProductSelect(p);
                  setQuery('');
                }}
                className="w-full flex items-center justify-between p-4 hover:bg-muted transition-colors border-b last:border-none group"
              >
                <div className="text-left">
                  <p className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">{p.name}</p>
                  <p className="text-sm text-muted-foreground">₹{p.price} • {p.barcode}</p>
                </div>
                <div className="text-right">
                  {p.stock !== undefined ? (
                    <Badge variant={p.stock < 10 ? "destructive" : "secondary"}>
                      Stock: {p.stock}
                    </Badge>
                  ) : (
                    <Badge variant="outline">Untracked</Badge>
                  )}
                </div>
              </button>
            ))}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
