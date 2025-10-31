
'use client';

import * as React from 'react';
import type { Customer } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/utsavlook/Header';
import { ClientOnly } from '@/components/ClientOnly';
import { Footer } from '@/components/utsavlook/Footer';

const PolicySection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <h2 className="text-2xl font-bold font-headline text-primary">{title}</h2>
    <div className="text-muted-foreground space-y-4">{children}</div>
  </div>
);

export default function TermsAndConditionsPage() {
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
                            Terms &amp; Conditions
                        </h1>
                        <p className="mx-auto max-w-[700px] text-foreground/80 md:text-xl mt-4">
                           Last Updated: October 26, 2025
                        </p>
                    </div>
                </section>

                <section className="w-full py-12 md:py-24 lg:py-32">
                    <div className="container max-w-4xl px-4 md:px-6">
                        <Card>
                            <CardContent className="p-6 md:p-8 space-y-8">
                                <PolicySection title="1. Acceptance of Terms">
                                    <p>By accessing and using the UtsavLook platform ("Service"), you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, you may not use the Service. These Terms apply to all visitors, users, and others who access or use the Service, including both customers and artists.</p>
                                </PolicySection>
                                <PolicySection title="2. The Service">
                                    <p>UtsavLook is a platform that connects customers seeking beauty and event services with independent, professional artists ("Artists"). UtsavLook acts as a facilitator for booking and payment, but we are not the employer of any Artist. The service contract is between the customer and the Artist.</p>
                                </PolicySection>
                                <PolicySection title="3. Bookings and Payments">
                                    <p>When you book a service, you agree to pay the total amount specified. An advance payment is required to confirm your booking instantly. Bookings made with the "Pay at Venue" option are considered requests and are not confirmed until our team contacts you for verification.</p>
                                    <p>All prices are inclusive of applicable taxes (GST). Additional charges, such as for travel or extra guest services, are to be discussed and settled directly with the Artist.</p>
                                </PolicySection>
                                <PolicySection title="4. Cancellation and Refunds">
                                    <p>Our cancellation policy is designed to be fair to both customers and artists whose schedules are reserved. Please refer to our dedicated <a href="/refund" className="underline text-primary">Refund &amp; Cancellation Policy</a> page for detailed information.</p>
                                </PolicySection>
                                <PolicySection title="5. User Responsibilities">
                                    <p>As a user of UtsavLook, you agree to:</p>
                                     <ul className="list-disc pl-6 space-y-2">
                                        <li>Provide accurate and complete information during registration and booking.</li>
                                        <li>Communicate respectfully and professionally with all parties.</li>
                                        <li>Not use the platform for any illegal or unauthorized purpose.</li>
                                        <li>Customers must provide a safe and suitable environment for the Artist to perform their services.</li>
                                    </ul>
                                </PolicySection>
                                <PolicySection title="6. Limitation of Liability">
                                    <p>UtsavLook is a platform for connecting users. While we vet our Artists and facilitate bookings, we are not responsible for the direct actions, quality of service provided, or conduct of any user. Any disputes arising from the service itself must be resolved directly between the customer and the Artist. UtsavLook will not be liable for any indirect, incidental, or consequential damages.</p>
                                </PolicySection>
                                <PolicySection title="7. Changes to Terms">
                                    <p>We reserve the right to modify these Terms at any time. We will notify you of any changes by posting the new Terms on this page. Your continued use of the Service after any such changes constitutes your acceptance of the new Terms.</p>
                                </PolicySection>
                            </CardContent>
                        </Card>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
