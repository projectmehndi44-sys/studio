
'use client';

import * as React from 'react';
import type { MehndiPackage } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface BookingSummaryProps {
    packages: MehndiPackage[];
}

export function BookingSummary({ packages }: BookingSummaryProps) {
    const subtotal = packages.reduce((sum, pkg) => sum + pkg.price, 0);
    const taxes = subtotal * 0.18; // 18% GST
    const total = subtotal + taxes;

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
                </div>
                <Separator />
                <div className="space-y-2 text-sm">
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>₹{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Taxes & Fees (GST)</span>
                        <span>₹{taxes.toLocaleString()}</span>
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
