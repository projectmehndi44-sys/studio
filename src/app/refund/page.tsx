
'use client';

import * as React from 'react';
import type { Customer } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Header } from '@/components/utsavlook/Header';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ClientOnly } from '@/components/ClientOnly';
import { Footer } from '@/components/utsavlook/Footer';

export default function RefundPolicyPage() {
    const [isCustomerLoggedIn, setIsCustomerLoggedIn] = React.useState(false);
    const [customer, setCustomer] = React.useState<Customer | null>(null);
    const [cartCount, setCartCount] = React.useState(0);

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
                            Refund &amp; Cancellation Policy
                        </h1>
                        <p className="mx-auto max-w-[700px] text-foreground/80 md:text-xl mt-4">
                           Clear, fair, and simple.
                        </p>
                    </div>
                </section>

                <section className="w-full py-12 md:py-24 lg:py-32">
                    <div className="container max-w-4xl px-4 md:px-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Our Policy</CardTitle>
                                <CardDescription>
                                    Our policy is designed to be fair to both our valued customers and our professional artists, who reserve their time exclusively for your booking.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 md:p-8 space-y-8">
                                <Alert variant="default" className="bg-green-100 border-green-300 text-green-800 [&>svg]:text-green-800">
                                    <CheckCircle className="h-4 w-4" />
                                    <AlertTitle className="font-semibold">Full Refund Window</AlertTitle>
                                    <AlertDescription>
                                        Cancellations made **more than 72 hours** before the scheduled event date and time are eligible for a full refund of the advance payment, minus a small processing fee.
                                    </AlertDescription>
                                </Alert>

                                <Alert variant="destructive" className="bg-red-100 border-red-300 text-red-800 [&>svg]:text-red-800">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle className="font-semibold">Non-Refundable Window</AlertTitle>
                                    <AlertDescription>
                                        Cancellations made **within 72 hours** of the scheduled event date and time are not eligible for a refund of the advance payment. This is because the artist has reserved this time slot for you and has likely turned down other work.
                                    </AlertDescription>
                                </Alert>

                                <div className="space-y-2 pt-6 border-t">
                                    <h2 className="text-2xl font-bold font-headline text-primary">How to Cancel</h2>
                                    <p className="text-muted-foreground">
                                        To cancel your booking, please log in to your account, navigate to the "My Bookings" section, and click the "Cancel" button on the relevant booking. The system will automatically determine your refund eligibility based on the time of cancellation.
                                    </p>
                                </div>
                                
                                <div className="space-y-2 pt-6 border-t">
                                    <h2 className="text-2xl font-bold font-headline text-primary">Platform-Initiated Cancellations</h2>
                                    <p className="text-muted-foreground">
                                       In the rare event that an artist has to cancel a confirmed booking due to an emergency, or if we are unable to confirm your "Pay at Venue" booking request, we will notify you immediately. If an advance was paid, you will receive a 100% full refund, including any processing fees.
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
