"use client";

import { Product } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface QuickTapGridProps {
  products: Product[] | null;
  onProductSelect: (product: Product) => void;
}

export function QuickTapGrid({ products, onProductSelect }: QuickTapGridProps) {
  const popularItems = (products || []).filter(p => p.isPopular).slice(0, 15);

  if (popularItems.length === 0) {
    return (
      <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-100 rounded-[32px] bg-slate-50/30">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-300">
          No Popular Items Marked
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="w-full h-full pb-4">
      <div className="flex gap-4 min-w-max pr-8">
        {popularItems.map((p) => (
          <button
            key={p.id}
            onClick={() => onProductSelect(p)}
            className="group active:scale-95 transition-all text-left"
          >
            <Card className="w-36 h-36 p-4 flex flex-col justify-between bg-white border-2 border-slate-50 group-hover:border-primary group-hover:shadow-lg transition-all rounded-[28px] relative overflow-hidden">
              <div className="absolute -top-4 -right-4 h-12 w-12 bg-primary/5 rounded-full group-hover:bg-primary/10 transition-colors" />
              
              <div className="relative z-10">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1 truncate">{p.category}</p>
                <p className="font-black text-sm text-slate-900 leading-tight line-clamp-2">{p.name}</p>
              </div>

              <div className="relative z-10 mt-auto">
                <p className="text-xl font-black text-primary tracking-tighter">₹{p.price}</p>
                {p.stock !== undefined && (
                  <div className={cn(
                    "h-1.5 w-12 rounded-full mt-2",
                    p.stock < 10 ? "bg-primary" : "bg-emerald-400"
                  )} />
                )}
              </div>
            </Card>
          </button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
