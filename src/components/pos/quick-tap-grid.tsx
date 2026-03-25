"use client";

import Image from 'next/image';
import { Product } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface QuickTapGridProps {
  products: Product[] | null;
  onProductSelect: (product: Product) => void;
  showAll?: boolean;
}

export function QuickTapGrid({ products, onProductSelect, showAll = false }: QuickTapGridProps) {
  const safeProducts = products || [];
  const items = showAll ? safeProducts : safeProducts.filter(p => p.isPopular);

  return (
    <ScrollArea className="h-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-8">
        {items.map((p) => (
          <button
            key={p.id}
            onClick={() => onProductSelect(p)}
            className="group transition-transform active:scale-95 text-left"
          >
            <Card className="relative h-44 overflow-hidden bg-white border border-slate-200 group-hover:border-primary transition-all shadow-sm group-hover:shadow-md rounded-2xl">
              {p.image ? (
                <div className="relative h-28 w-full">
                  <Image
                    src={p.image}
                    alt={p.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    data-ai-hint="product retail"
                  />
                </div>
              ) : (
                <div className="h-28 w-full bg-slate-100 flex items-center justify-center text-slate-300">
                  <span className="font-black text-2xl opacity-20">S9+</span>
                </div>
              )}
              <div className="p-3">
                <p className="font-black text-sm truncate text-slate-900">{p.name}</p>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-primary font-black text-lg">₹{p.price}</p>
                  {p.stock !== undefined && (
                    <p className="text-[10px] font-bold text-slate-400">QTY: {p.stock}</p>
                  )}
                </div>
              </div>
              {p.stock !== undefined && p.stock < 5 && (
                <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-destructive text-[9px] text-white font-black uppercase shadow-lg">
                  LOW
                </div>
              )}
            </Card>
          </button>
        ))}
        
        {(!products || items.length === 0) && (
          <div className="col-span-full py-12 text-center text-slate-400">
            <p className="font-bold">
              {!products ? "Loading catalog..." : (showAll ? "No items in catalog." : "No top sellers found.")}
            </p>
            <p className="text-sm">
              {!products ? "Please wait while we sync with the cloud." : "Add items via the search bar or mark them as popular."}
            </p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
