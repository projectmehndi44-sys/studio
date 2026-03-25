"use client";

import { Trash2, Plus, Minus, ShoppingBag, Edit2, Check } from 'lucide-react';
import { CartItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface CartListProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onUpdatePrice: (id: string, newPrice: number) => void;
  onRemoveItem: (id: string) => void;
}

export function CartList({ items, onUpdateQuantity, onUpdatePrice, onRemoveItem }: CartListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100">
        <div className="bg-slate-50 p-6 rounded-full mb-4">
          <ShoppingBag className="h-12 w-12 text-slate-300" />
        </div>
        <p className="text-xl font-black text-slate-900">Terminal Ready</p>
        <p className="text-sm font-medium mt-1">Start searching to add items to bill</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-[32px] overflow-hidden border border-slate-200 shadow-sm">
      <div className="p-4 px-6 border-b flex justify-between items-center bg-slate-50/50">
        <h3 className="font-black text-sm uppercase tracking-widest text-slate-900">
          Items ({items.length})
        </h3>
        <button 
          className="text-destructive font-black text-[10px] uppercase tracking-widest hover:underline"
          onClick={() => items.forEach(i => onRemoveItem(i.id))}
        >
          Clear Bill
        </button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="divide-y divide-slate-100">
          {items.map((item) => (
            <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors">
              <div className="flex justify-between items-center gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-base text-slate-900 truncate tracking-tight">{item.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    {editingId === item.id ? (
                      <div className="flex items-center gap-2 bg-white rounded-lg px-2 border border-primary/30">
                        <span className="text-xs font-black text-primary">₹</span>
                        <Input
                          type="number"
                          autoFocus
                          className="h-8 w-20 font-black text-sm border-none shadow-none focus-visible:ring-0 p-0"
                          defaultValue={item.price}
                          onBlur={(e) => {
                            onUpdatePrice(item.id, parseFloat(e.target.value) || 0);
                            setEditingId(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              onUpdatePrice(item.id, parseFloat((e.target as HTMLInputElement).value) || 0);
                              setEditingId(null);
                            }
                          }}
                        />
                        <Check className="h-4 w-4 text-emerald-500 cursor-pointer" onClick={() => setEditingId(null)} />
                      </div>
                    ) : (
                      <button 
                        onClick={() => setEditingId(item.id)}
                        className="flex items-center gap-1.5 text-slate-400 hover:text-primary transition-colors group"
                      >
                        <span className="text-sm font-bold tracking-tight">₹{item.price} / unit</span>
                        <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-xl text-primary tracking-tighter">₹{(item.price * item.quantity).toFixed(0)}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg hover:bg-white"
                    onClick={() => onUpdateQuantity(item.id, -1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <div className="w-10 text-center font-black text-sm">
                    {item.quantity}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg hover:bg-white"
                    onClick={() => onUpdateQuantity(item.id, 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-slate-300 hover:text-destructive hover:bg-destructive/5 rounded-xl h-8 w-8"
                  onClick={() => onRemoveItem(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
