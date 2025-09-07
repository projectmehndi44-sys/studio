
'use client';

import * as React from 'react';
import type { ServicePackage, Artist } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface BookingSummaryProps {
    packages: ServicePackage[];
    artist: Artist | null;
    serviceDates: Date[];
}

export function BookingSummary({ packages, artist, serviceDates }: BookingSummaryProps) {
    const [increments, setIncrements] = React.useState<number[]>([]);

    React.useEffect(() => {
        const savedIncrements = localStorage.getItem('dailyPriceIncrements');
        setIncrements(savedIncrements ? JSON.parse(savedIncrements) : Array(10).fill(0));
    }, []);

    const packageBaseTotal = packages.reduce((sum, pkg) => sum + pkg.price, 0);
    const artistBaseTotal = artist ? artist.charge : 0;
    const initialBaseTotal = packageBaseTotal + artistBaseTotal;

    const numDays = serviceDates.length;

    // Calculate total price with daily increments
    const total = React.useMemo(() => {
        if (numDays <= 1) {
            return initialBaseTotal;
        }
        let total = 0;
        for (let i = 0; i < numDays; i++) {
            const incrementPercentage = increments[i] || increments[increments.length - 1] || 0;
            total += initialBaseTotal * (1 + incrementPercentage / 100);
        }
        return total;
    }, [numDays, initialBaseTotal, increments]);
    
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
                            <span>{pkg.name} (Base)</span>
                            <span>₹{pkg.price.toLocaleString()}</span>
                        </div>
                    ))}
                    {artist && (
                         <div className="flex justify-between">
                            <span>{artist.name} (Base Charge)</span>
                            <span>₹{artist.charge.toLocaleString()}</span>
                        </div>
                    )}
                     {numDays > 1 && (
                         <div className="flex justify-between">
                            <span>Number of Days</span>
                            <span>{numDays}</span>
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
                    <span>₹{total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
                 {numDays > 1 && (
                    <p className="text-xs text-muted-foreground text-center">
                        Multi-day pricing rules applied.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
