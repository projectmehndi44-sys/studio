
"use client";

import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { CartItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface CartListProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
}

export function CartList({ items, onUpdateQuantity, onRemoveItem }: CartListProps) {
  if (items.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
        <div className="bg-secondary p-6 rounded-full mb-4">
          <ShoppingBag className="h-12 w-12 opacity-20" />
        </div>
        <p className="text-xl font-medium">Cart is empty</p>
        <p className="text-sm">Scan or select items to start billing</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background/50 rounded-xl overflow-hidden border border-border/50">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="font-bold text-lg text-primary flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" />
          Order Items ({items.length})
        </h3>
        <Button variant="ghost" size="sm" onClick={() => items.forEach(i => onRemoveItem(i.id))}>
          Clear
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="divide-y divide-border/30">
          {items.map((item) => (
            <div key={item.id} className="p-4 hover:bg-secondary/30 transition-colors group">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold text-lg leading-tight">{item.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">₹{item.price} per unit</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-primary">₹{(item.price * item.quantity).toFixed(2)}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-xl font-bold rounded-md hover:bg-background"
                    onClick={() => onUpdateQuantity(item.id, -1)}
                  >
                    <Minus className="h-5 w-5" />
                  </Button>
                  <div className="w-12 text-center font-bold text-xl">
                    {item.quantity}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-xl font-bold rounded-md hover:bg-background"
                    onClick={() => onUpdateQuantity(item.id, 1)}
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
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
