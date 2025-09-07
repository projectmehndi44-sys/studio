
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
    const [discounts, setDiscounts] = React.useState<number[]>([]);

    React.useEffect(() => {
        const savedIncrements = localStorage.getItem('dailyPriceIncrements');
        setIncrements(savedIncrements ? JSON.parse(savedIncrements) : Array(10).fill(0));
        
        const savedDiscounts = localStorage.getItem('multiDayDiscounts');
        setDiscounts(savedDiscounts ? JSON.parse(savedDiscounts) : Array(9).fill(0));
    }, []);

    const packageBaseTotal = packages.reduce((sum, pkg) => sum + pkg.price, 0);
    const artistBaseTotal = artist ? artist.charge : 0;
    const initialBaseTotal = packageBaseTotal + artistBaseTotal;

    const numDays = serviceDates.length;

    // Calculate total price with daily increments
    const totalBeforeDiscount = React.useMemo(() => {
        if (numDays === 0) return 0;
        if (numDays === 1) return initialBaseTotal;
        
        let total = 0;
        // Day 1 is always the base price (0% increment)
        total += initialBaseTotal; 

        for (let i = 1; i < numDays; i++) {
            // increment index for Day 2 is 0, for Day 3 is 1, etc.
            // The increments array is for Day 2, Day 3,... up to Day 11
            const incrementPercentage = increments[i - 1] || 0;
            total += initialBaseTotal * (1 + incrementPercentage / 100);
        }
        return total;
    }, [numDays, initialBaseTotal, increments]);
    
    const discountPercentage = React.useMemo(() => {
        if (numDays <= 1) return 0;
        // discount index for 2 days is 0, for 3 days is 1...
        return discounts[numDays - 2] || 0;
    }, [numDays, discounts]);

    const discountAmount = totalBeforeDiscount * (discountPercentage / 100);
    const total = totalBeforeDiscount - discountAmount;
    
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
                        <>
                            <div className="flex justify-between">
                                <span>Number of Days</span>
                                <span>{numDays}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Total w/ Daily Increments</span>
                                <span>₹{totalBeforeDiscount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                            </div>
                             <div className="flex justify-between text-green-600">
                                <span>Multi-Day Discount ({discountPercentage}%)</span>
                                <span>- ₹{discountAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                            </div>
                        </>
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
