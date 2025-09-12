

'use client';

import * as React from 'react';
import type { ServicePackage, Artist } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Info } from 'lucide-react';

interface BookingSummaryProps {
    packages: ServicePackage[];
    artist: Artist | null;
    serviceDates: Date[];
}

export function BookingSummary({ packages, artist, serviceDates }: BookingSummaryProps) {
    const primaryServiceType = artist ? artist.services[0] : (packages.length > 0 ? packages[0].service : null);
    const packageBaseTotal = packages.reduce((sum, pkg) => sum + pkg.price, 0);
    const artistBaseTotal = artist && primaryServiceType ? (artist.charges?.[primaryServiceType] || artist.charge) : 0;
    const total = packageBaseTotal + artistBaseTotal;
    
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
                    {packages.map(pkg => (
                        <div key={pkg.id} className="flex justify-between">
                            <span>{pkg.name} (Base)</span>
                            <span>₹{pkg.price.toLocaleString()}</span>
                        </div>
                    ))}
                    {artist && (
                         <div className="flex justify-between">
                            <span>{artist.name} (Base Charge)</span>
                            <span>₹{artistBaseTotal.toLocaleString()}</span>
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
