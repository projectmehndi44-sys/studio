

'use client';

import * as React from 'react';
import type { ServicePackage, Artist } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface BookingSummaryProps {
    packages: ServicePackage[];
    artist: Artist | null;
}

export function BookingSummary({ packages, artist }: BookingSummaryProps) {
    const packageTotal = packages.reduce((sum, pkg) => sum + pkg.price, 0);
    const artistTotal = artist ? artist.charge : 0;
    const total = packageTotal + artistTotal;
    
    // Assuming 18% GST is included in the price
    const subtotal = total / 1.18;
    const taxes = total - subtotal;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                    {packages.map(pkg => (
                        <div key={pkg.id} className="flex justify-between">
                            <span>{pkg.name}</span>
                            <span>₹{pkg.price.toLocaleString()}</span>
                        </div>
                    ))}
                    {artist && (
                         <div className="flex justify-between">
                            <span>{artist.name} (Base Charge)</span>
                            <span>₹{artist.charge.toLocaleString()}</span>
                        </div>
                    )}
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
                    <span>₹{total.toLocaleString()}</span>
                </div>
            </CardContent>
        </Card>
    );
}
