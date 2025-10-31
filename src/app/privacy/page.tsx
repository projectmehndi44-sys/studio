
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

export default function PrivacyPolicyPage() {
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
                            Privacy Policy
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
                                <PolicySection title="1. Introduction">
                                    <p>Welcome to UtsavLook. We are committed to protecting your privacy and ensuring that your personal information is handled in a safe and responsible manner. This Privacy Policy outlines how we collect, use, and protect your information when you use our platform.</p>
                                </PolicySection>
                                <PolicySection title="2. Information We Collect">
                                    <p>We collect information that you provide directly to us, such as when you create an account, make a booking, or contact customer support. This may include:</p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li><strong>Personal Identification Information:</strong> Name, email address, phone number.</li>
                                        <li><strong>Booking Information:</strong> Event type, date, location, service selections, and notes.</li>
                                        <li><strong>Communication Information:</strong> Any correspondence between you and UtsavLook or between you and artists through our platform.</li>
                                    </ul>
                                </PolicySection>
                                <PolicySection title="3. How We Use Your Information">
                                    <p>We use the information we collect to:</p>
                                     <ul className="list-disc pl-6 space-y-2">
                                        <li>Provide, operate, and maintain our services.</li>
                                        <li>Process your bookings and facilitate communication with artists.</li>
                                        <li>Improve, personalize, and expand our services.</li>
                                        <li>Communicate with you, including for customer service and promotional purposes.</li>
                                        <li>Process payments and prevent fraudulent transactions.</li>
                                    </ul>
                                </PolicySection>
                                <PolicySection title="4. Information Sharing and Disclosure">
                                    <p>We do not sell your personal information. We may share your information only in the following circumstances:</p>
                                     <ul className="list-disc pl-6 space-y-2">
                                        <li><strong>With Artists:</strong> We share necessary booking details (your name, event details, contact information) with the artist you book to enable them to provide the service.</li>
                                        <li><strong>For Legal Reasons:</strong> We may disclose your information if required by law or in response to valid requests by public authorities.</li>
                                    </ul>
                                </PolicySection>
                                <PolicySection title="5. Data Security">
                                    <p>We implement a variety of security measures to maintain the safety of your personal information. Your data is stored on secure servers, and all payment information is encrypted using secure socket layer technology (SSL).</p>
                                </PolicySection>
                                <PolicySection title="6. Your Rights">
                                    <p>You have the right to access, update, or delete your personal information at any time through your account dashboard. If you have any questions or concerns about your privacy, please contact us at <a href="mailto:support@utsavlook.com" className="underline text-primary">support@utsavlook.com</a>.</p>
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
