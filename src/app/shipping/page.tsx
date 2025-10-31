'use client';

import * as React from 'react';
import type { Customer } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Header } from '@/components/utsavlook/Header';
import { Package, MapPin } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ClientOnly } from '@/components/ClientOnly';
import { Footer } from '@/components/utsavlook/Footer';

export default function ShippingPolicyPage() {
    const [isCustomerLoggedIn, setIsCustomerLoggedIn] = React.useState(false);
    const [customer, setCustomer] = React.useState<Customer | null>(null);
    const [cartCount, setCartCount] = React.useState(0);

    // Placeholder auth logic for header
    React.useEffect(() => {
        const customerId = localStorage.getItem('currentCustomerId');
        if (customerId) {
            setIsCustomerLoggedIn(true);
            setCustomer({ id: customerId, name: 'User', phone: '' }); 
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('currentCustomerId');
        setIsCustomerLoggedIn(false);
        setCustomer(null);
    };

    return (
        <div className="flex min-h-screen w-full flex-col bg-background">
            <ClientOnly>
                <Header
                    isCustomerLoggedIn={isCustomerLoggedIn}
                    onCustomerLogout={handleLogout}
                    customer={customer}
                    cartCount={cartCount}
                />
            </ClientOnly>
            <main className="flex-1">
                <section className="w-full py-12 md:py-24 lg:py-32 bg-primary/10">
                    <div className="container px-4 md:px-6 text-center">
                        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl font-headline text-primary">
                            Shipping & Service Delivery
                        </h1>
                        <p className="mx-auto max-w-[700px] text-foreground/80 md:text-xl mt-4">
                           How our artists get to you.
                        </p>
                    </div>
                </section>

                <section className="w-full py-12 md:py-24 lg:py-32">
                    <div className="container max-w-4xl px-4 md:px-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Our Service Delivery Policy</CardTitle>
                                <CardDescription>
                                    UtsavLook is a platform for booking professional services, not physical products. This policy explains how our artists deliver their services to your chosen location.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 md:p-8 space-y-8">
                                <Alert variant="default" className="bg-blue-100 border-blue-300 text-blue-800 [&>svg]:text-blue-800">
                                    <Package className="h-4 w-4" />
                                    <AlertTitle className="font-semibold">No Physical Shipping</AlertTitle>
                                    <AlertDescription>
                                        As a service-based platform, we do not ship any physical goods. All services, including mehndi, makeup, and photography, are performed in-person by our artists.
                                    </AlertDescription>
                                </Alert>

                                <Alert variant="default" className="bg-green-100 border-green-300 text-green-800 [&>svg]:text-green-800">
                                    <MapPin className="h-4 w-4" />
                                    <AlertTitle className="font-semibold">Service at Your Venue</AlertTitle>
                                    <AlertDescription>
                                       Our artists travel to the venue address you provide during the booking process. It is your responsibility to ensure the address is accurate and the location is accessible for the artist on the scheduled date and time.
                                    </AlertDescription>
                                </Alert>

                                <div className="space-y-2 pt-6 border-t">
                                    <h2 className="text-2xl font-bold font-headline text-primary">Travel Charges</h2>
                                    <p className="text-muted-foreground">
                                        Some artists may apply a travel charge depending on the distance to your venue from their base location. This is especially common for bookings outside of the artist's primary service city or district.
                                    </p>
                                    <p className="text-muted-foreground">
                                        Any applicable travel charges are **not included** in the booking amount paid on UtsavLook. These charges are to be discussed, confirmed, and paid directly to the artist. The artist will typically contact you after a booking is confirmed to discuss travel arrangements and any associated costs.
                                    </p>
                                </div>
                                
                                <div className="space-y-2 pt-6 border-t">
                                    <h2 className="text-2xl font-bold font-headline text-primary">Confirmation & Communication</h2>
                                    <p className="text-muted-foreground">
                                       Once your booking is confirmed, you will be able to communicate directly with your assigned artist. We encourage you to discuss venue details, timings, and any potential travel logistics with them well in advance of the event date to ensure a smooth and punctual service delivery.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
