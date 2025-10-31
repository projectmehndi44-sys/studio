'use client';

import * as React from 'react';
import type { CartItem } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Info } from 'lucide-react';

interface BookingSummaryProps {
    items: CartItem[];
    serviceDates: Date[];
}

export function BookingSummaryModal({ items, serviceDates }: BookingSummaryProps) {
    const total = items.reduce((sum, item) => sum + item.price, 0);
    
    // Assuming 18% GST is included in the price
    const subtotal = total / 1.18;
    const taxes = total - subtotal;

    const isMultiDay = serviceDates.length > 1;

    return (
        <Card className="bg-muted/50">
            <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                    {items.map(item => (
                        <div key={item.id} className="flex justify-between">
                            <span>{item.servicePackage.name} ({item.selectedTier.name}) {item.artist ? ` - ${item.artist.name}`: ''}</span>
                            <span>₹{item.price.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
                <Separator />
                 <div className="space-y-2 text-sm">
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal (Pre-tax)</span>
                        <span>₹{subtotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">GST (18% included)</span>
                        <span>₹{taxes.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    </div>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                    <span>Total Amount</span>
                    <span>₹{total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
                {isMultiDay && (
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Multi-Day Booking</AlertTitle>
                        <AlertDescription>
                           You have chosen multiple days. An admin or artist will contact you to decide the final price. Please proceed by paying the base price to confirm your booking.
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
}
