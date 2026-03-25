
"use client";

import { useState, useMemo } from 'react';
import { Search, Scan } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Product } from '@/lib/types';
import { MOCK_PRODUCTS } from '@/lib/mock-data';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ProductSearchProps {
  onProductSelect: (product: Product) => void;
  onScanClick: () => void;
}

export function ProductSearch({ onProductSelect, onScanClick }: ProductSearchProps) {
  const [query, setQuery] = useState('');

  const filteredProducts = useMemo(() => {
    if (!query) return [];
    const lowerQuery = query.toLowerCase();
    return MOCK_PRODUCTS.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) || 
      p.barcode.includes(lowerQuery)
    ).slice(0, 10);
  }, [query]);

  return (
    <div className="relative w-full">
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search items or barcode..."
            className="pl-10 h-12 bg-secondary border-none focus-visible:ring-1 focus-visible:ring-primary text-lg"
          />
        </div>
        <button
          onClick={onScanClick}
          className="h-12 w-12 flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Scan className="h-6 w-6" />
        </button>
      </div>

      {filteredProducts.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-card border border-border rounded-lg shadow-2xl overflow-hidden animate-scale-in">
          <ScrollArea className="max-h-72">
            {filteredProducts.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  onProductSelect(p);
                  setQuery('');
                }}
                className="w-full flex items-center justify-between p-4 hover:bg-muted transition-colors border-b last:border-none"
              >
                <div className="text-left">
                  <p className="font-semibold text-foreground">{p.name}</p>
                  <p className="text-sm text-muted-foreground">₹{p.price} • {p.barcode}</p>
                </div>
                <div className="text-right">
                  <Badge variant={p.stock < 10 ? "destructive" : "secondary"}>
                    Stock: {p.stock}
                  </Badge>
                </div>
              </button>
            ))}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
