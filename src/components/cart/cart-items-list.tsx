'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CartItem } from "@/lib/types";
import Image from "next/image";
import { Button } from "../ui/button";
import { Trash2 } from "lucide-react";
import { Badge } from "../ui/badge";

interface CartItemsListProps {
    items: CartItem[];
    onRemoveItem: (id: string) => void;
}

export const CartItemsList = ({ items, onRemoveItem }: CartItemsListProps) => {

    return (
        <Card className="shadow-lg rounded-lg">
            <CardHeader>
                <CardTitle>Selected Services</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {items.map(item => (
                        <div key={item.id} className="flex gap-4 items-center p-2 rounded-md hover:bg-primary/5">
                            <Image 
                                src={item.selectedTier.image || item.servicePackage.image || 'https://picsum.photos/seed/cartitem/100/100'}
                                alt={item.servicePackage.name}
                                width={80}
                                height={80}
                                className="rounded-md object-cover"
                            />
                            <div className="flex-grow">
                                <h3 className="font-semibold text-primary">{item.servicePackage.name}</h3>
                                <p className="text-sm text-muted-foreground">{item.artist ? `Artist: ${item.artist.name}` : 'Express Booking'}</p>
                                <Badge variant="outline" className="mt-1">{item.selectedTier.name}</Badge>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-lg text-primary">₹{item.price.toLocaleString()}</p>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onRemoveItem(item.id)}>
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Remove</span>
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};
