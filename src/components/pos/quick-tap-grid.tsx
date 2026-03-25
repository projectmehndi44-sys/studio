
"use client";

import Image from 'next/image';
import { Product } from '@/lib/types';
import { MOCK_PRODUCTS } from '@/lib/mock-data';
import { Card } from '@/components/ui/card';

interface QuickTapGridProps {
  onProductSelect: (product: Product) => void;
}

export function QuickTapGrid({ onProductSelect }: QuickTapGridProps) {
  const popularItems = MOCK_PRODUCTS.filter(p => p.isPopular);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {popularItems.map((p) => (
        <button
          key={p.id}
          onClick={() => onProductSelect(p)}
          className="group transition-transform active:scale-95 text-left"
        >
          <Card className="relative h-40 overflow-hidden bg-secondary border-none group-hover:ring-2 ring-primary transition-all shadow-lg">
            {p.image ? (
              <div className="relative h-24 w-full">
                <Image
                  src={p.image}
                  alt={p.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                  data-ai-hint="product retail"
                />
              </div>
            ) : (
              <div className="h-24 w-full bg-muted flex items-center justify-center text-muted-foreground">
                No Image
              </div>
            )}
            <div className="p-2">
              <p className="font-bold text-sm truncate text-foreground">{p.name}</p>
              <div className="flex justify-between items-center mt-1">
                <p className="text-primary font-bold text-lg">₹{p.price}</p>
                <p className="text-[10px] text-muted-foreground">Qty: {p.stock}</p>
              </div>
            </div>
            {p.stock < 5 && (
              <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-sm bg-destructive text-[8px] text-destructive-foreground font-bold uppercase">
                Low Stock
              </div>
            )}
          </Card>
        </button>
      ))}
    </div>
  );
}
