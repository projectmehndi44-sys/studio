
'use client';

import * as React from 'react';
import type { Customer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/utsavlook/Header';
import { Handshake, Sparkles, Heart, Users } from 'lucide-react';
import Link from 'next/link';
import { ClientOnly } from '@/components/ClientOnly';
import { Footer } from '@/components/utsavlook/Footer';
import Image from 'next/image';

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

    const philosophyPoints = [
        {
            icon: <Heart className="w-10 h-10 text-accent" />,
            title: "Celebrating Artistry",
            description: "From intricate bridal mehndi designs to flawless airbrush makeup and cinematic wedding photography, we believe in the power of art to make moments magical. We are a platform dedicated to the artists who create beauty."
        },
        {
            icon: <Users className="w-10 h-10 text-accent" />,
            title: "Empowering Professionals",
            description: "We provide talented makeup artists, mehndi artists, and photographers with the tools to grow their business. UtsavLook is more than a directory; it's a partnership for success."
        },
        {
            icon: <Sparkles className="w-10 h-10 text-accent" />,
            title: "Creating Joyful Experiences",
            description: "Finding the perfect artist for your 'utsav' should be as joyful as the celebration itself. Our platform ensures a seamless, transparent, and trustworthy booking experience from start to finish."
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
                <section className="relative w-full py-20 md:py-32 lg:py-40 bg-primary/10 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10"></div>
                     <Image
                        src="https://picsum.photos/seed/about-hero/1920/1080"
                        alt="A collage of beautiful mehndi, makeup, and photography"
                        layout="fill"
                        objectFit="cover"
                        className="opacity-20"
                        data-ai-hint="mehndi makeup photography"
                    />
                    <div className="container relative z-20 px-4 md:px-6 text-center">
                        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl font-headline text-primary title-3d-effect">
                           The Story of UtsavLook
                        </h1>
                        <p className="mx-auto max-w-[700px] text-foreground/80 md:text-xl mt-4">
                            More than a platform—we are a celebration of artistry, tradition, and the moments that matter.
                        </p>
                    </div>
                </section>
                
                <section className="w-full py-12 md:py-24 lg:py-32">
                    <div className="container max-w-4xl px-4 md:px-6 text-lg">
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline text-primary text-center">Our Journey</h2>
                        <div className="space-y-6 mt-8 text-muted-foreground">
                            <p>
                                UtsavLook began with a simple, frustrating experience: finding a great mehndi artist for a family wedding shouldn't be a matter of luck. It started from endless phone calls based on recommendations, scrolling through unverified social media profiles, and the gnawing uncertainty of booking a stranger for one of life's most important days. We saw a gap—a disconnect between incredible, local artistic talent and the customers who desperately wanted to find them with confidence.
                            </p>
                            <p>
                                We asked ourselves: What if there was a place where artistry was celebrated and verified? A platform where a bride could find the perfect "bridal makeup artist near me" with the same ease as booking a flight? A space where a talented photographer wasn't just another name in a directory but a celebrated professional with a trusted portfolio?
                            </p>
                            <p>
                                That vision became UtsavLook. We are here to bridge that gap. We envisioned a place where the most talented artists could showcase their work with pride and where anyone planning a celebration—be it a grand wedding, a sangeet, a festival, or a simple party—could find and book these professionals with absolute peace of mind. We are here to make every 'utsav' (celebration) look perfect.
                            </p>
                        </div>
                    </div>
                </section>

                 <section className="w-full py-12 md:py-24 lg:py-32 why-choose-us-bg">
                    <div className="container px-4 md:px-6">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-primary font-headline">Our Philosophy</h2>
                            <p className="mx-auto max-w-3xl text-muted-foreground md:text-xl mt-4">We are driven by three core principles that guide every decision we make, from the artists we feature to the packages we offer.</p>
                        </div>
                        <div className="grid gap-8 md:grid-cols-3">
                            {philosophyPoints.map(point => (
                                <div key={point.title} className="text-center flex flex-col items-center">
                                    <div className="bg-background p-4 rounded-full shadow-md mb-4">{point.icon}</div>
                                    <h3 className="text-xl font-bold">{point.title}</h3>
                                    <p className="text-muted-foreground mt-2">{point.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="w-full py-12 md:py-24 lg:py-32">
                    <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
                        <div className="space-y-3">
                            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight text-primary font-headline">
                                Find Your Perfect Look Today
                            </h2>
                            <p className="mx-auto max-w-[600px] text-foreground/80 md:text-xl/relaxed">
                                Whether you're searching for "makeup artists near me" or the latest "bridal mehndi designs," your search ends here. Browse our curated selection of top-rated artists.
                            </p>
                        </div>
                        <div className="mx-auto w-full max-w-sm flex flex-col sm:flex-row gap-4 justify-center">
                            <Button asChild size="lg" className="bg-accent hover:bg-accent/90">
                                <Link href="/services">Browse Services</Link>
                            </Button>
                             <Button asChild size="lg" variant="outline">
                                <Link href="/artists">Discover Artists</Link>
                            </Button>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
