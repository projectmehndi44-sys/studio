"use client";

import { Trash2, Plus, Minus, ShoppingBag, Edit2 } from 'lucide-react';
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
        <p className="text-xl font-black text-slate-900">Cart is Empty</p>
        <p className="text-sm font-medium mt-1">Start scanning or tap items to bill</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-[32px] overflow-hidden border border-slate-200 shadow-sm">
      <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
        <h3 className="font-black text-xl text-slate-900 flex items-center gap-2">
          Current Bill
          <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">{items.length} items</span>
        </h3>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-destructive font-bold hover:bg-destructive/5"
          onClick={() => items.forEach(i => onRemoveItem(i.id))}
        >
          Clear All
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="divide-y divide-slate-100">
          {items.map((item) => (
            <div key={item.id} className="p-4 sm:p-6 hover:bg-slate-50 transition-colors group">
              <div className="flex justify-between items-start gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-lg text-slate-900 truncate leading-tight">{item.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    {editingId === item.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-400">₹</span>
                        <Input
                          type="number"
                          autoFocus
                          className="h-8 w-24 font-bold text-sm bg-white"
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
                      </div>
                    ) : (
                      <button 
                        onClick={() => setEditingId(item.id)}
                        className="flex items-center gap-1 text-slate-500 hover:text-primary transition-colors"
                      >
                        <span className="text-sm font-bold">₹{item.price}</span>
                        <Edit2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-xl text-primary">₹{(item.price * item.quantity).toFixed(2)}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 bg-slate-100 rounded-2xl p-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-xl hover:bg-white hover:shadow-sm"
                    onClick={() => onUpdateQuantity(item.id, -1)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <div className="w-12 text-center font-black text-lg">
                    {item.quantity}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-xl hover:bg-white hover:shadow-sm"
                    onClick={() => onUpdateQuantity(item.id, 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-slate-300 hover:text-destructive hover:bg-destructive/5 rounded-xl transition-all"
                  onClick={() => onRemoveItem(item.id)}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
