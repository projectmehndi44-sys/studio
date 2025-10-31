
'use client';

import * as React from 'react';
import type { Customer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/utsavlook/Header';
import { Award, Handshake, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { ClientOnly } from '@/components/ClientOnly';
import { Footer } from '@/components/utsavlook/Footer';

export default function AboutUsPage() {
    const [isCustomerLoggedIn, setIsCustomerLoggedIn] = React.useState(false);
    const [customer, setCustomer] = React.useState<Customer | null>(null);
    const [cartCount, setCartCount] = React.useState(0);

    // This is placeholder logic to make the Header component work.
    // A real implementation would use a proper auth context.
    React.useEffect(() => {
        const customerId = localStorage.getItem('currentCustomerId');
        if (customerId) {
            setIsCustomerLoggedIn(true);
            // In a real app, you'd fetch customer data here.
            setCustomer({ id: customerId, name: 'User', phone: '' }); 
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('currentCustomerId');
        setIsCustomerLoggedIn(false);
        setCustomer(null);
    };

    const features = [
        {
            icon: <Award className="w-10 h-10 text-accent" />,
            title: "Verified Professionals",
            description: "Every artist on our platform is hand-vetted for quality, professionalism, and skill. You can book with confidence, knowing you're getting the best."
        },
        {
            icon: <Sparkles className="w-10 h-10 text-accent" />,
            title: "AI-Powered Style Matching",
            description: "Not sure what you want? Upload a photo of your outfit and let our advanced AI recommend the perfect mehndi and makeup styles to complete your look."
        },
        {
            icon: <Handshake className="w-10 h-10 text-accent" />,
            title: "Transparent & Fair",
            description: "We believe in empowering artists and providing clarity to customers. Enjoy transparent pricing and a direct connection to the talent that makes your day special."
        }
    ];

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
                            About UtsavLook
                        </h1>
                        <p className="mx-auto max-w-[700px] text-foreground/80 md:text-xl mt-4">
                            Celebrating artistry and tradition, one booking at a time.
                        </p>
                    </div>
                </section>
                
                <section className="w-full py-12 md:py-24 lg:py-32">
                    <div className="container px-4 md:px-6">
                        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
                            <div className="space-y-4">
                                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline text-primary">Our Mission</h2>
                                <p className="text-muted-foreground text-lg">
                                    Our mission is to bridge the gap between talented mehndi and makeup artists and the clients who seek them. We believe that finding the perfect artist for your special occasion—be it a wedding, festival, or any celebration—should be a seamless and joyful experience. UtsavLook was born from a desire to celebrate the rich heritage of traditional artistry while embracing the convenience of modern technology.
                                </p>
                                <p className="text-muted-foreground text-lg">
                                    We are dedicated to creating a platform that is fair, transparent, and beneficial for everyone. We empower artists by giving them the tools to manage their business and showcase their talent, and we provide customers with a trusted, reliable way to discover and book the perfect professional for their needs.
                                </p>
                            </div>
                             <div className="space-y-4">
                                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline text-primary">The UtsavLook Difference</h2>
                                <div className="grid gap-6">
                                    {features.map(feature => (
                                        <div key={feature.title} className="flex items-start gap-4">
                                            <div className="bg-accent/10 p-3 rounded-full">{feature.icon}</div>
                                            <div>
                                                <h3 className="text-lg font-bold">{feature.title}</h3>
                                                <p className="text-muted-foreground">{feature.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="w-full py-12 md:py-24 lg:py-32 bg-primary/10">
                    <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
                        <div className="space-y-3">
                            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight text-primary font-headline">
                                Ready to Find Your Perfect Look?
                            </h2>
                            <p className="mx-auto max-w-[600px] text-foreground/80 md:text-xl/relaxed">
                                Browse our curated selection of top-rated artists and book your appointment today.
                            </p>
                        </div>
                        <div className="mx-auto w-full max-w-sm">
                            <Button asChild size="lg" className="bg-accent hover:bg-accent/90">
                                <Link href="/#services">Browse Services</Link>
                            </Button>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
