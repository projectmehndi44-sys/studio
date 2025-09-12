
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/glamgo/Header';
import { Award, BarChart, CalendarCheck, IndianRupee, Sparkles, UserPlus } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const benefits = [
    {
        icon: <BarChart className="w-10 h-10 text-primary" />,
        title: "Set Your Own Price",
        description: "You know the value of your art. On UtsavLook, you're in control. Set your own prices for each service tier, no unfair fixed rates. Your talent, your price.",
        image: "https://picsum.photos/seed/price/600/400",
        aiHint: "artist pricing"
    },
    {
        icon: <Award className="w-10 h-10 text-primary" />,
        title: "'UtsavLook Verified' Badge",
        description: "Don't get lost in the crowd. Our 'UtsavLook Verified' badge shows customers you're a trusted professional, leading to more high-quality bookings and better clients.",
        aiHint: "verified badge"
    },
    {
        icon: <CalendarCheck className="w-10 h-10 text-primary" />,
        title: "Intelligent Scheduling",
        description: "Stop the back-and-forth phone calls. Our smart calendar lets you mark unavailable dates, so you only get booking requests for when you're actually free.",
        aiHint: "schedule management"
    },
    {
        icon: <Sparkles className="w-10 h-10 text-primary" />,
        title: "Your Own Referral Code",
        description: "Turn your happy clients into your sales team. We provide a unique referral code. When a new customer uses it, they get a discount, and you get another confirmed booking.",
        aiHint: "referral program"
    },
    {
        icon: <IndianRupee className="w-10 h-10 text-primary" />,
        title: "Transparent Payouts",
        description: "Get a professional dashboard to track all your bookings, earnings, and reviews in one place. With our clear and timely payouts, the accounting is always clean and simple.",
        aiHint: "payment dashboard"
    },
    {
        icon: <UserPlus className="w-10 h-10 text-primary" />,
        title: "0% Commission Welcome",
        description: "We're invested in your success from day one. To welcome you, we take zero commission on your first 5 bookings through the platform. It's all yours.",
        aiHint: "welcome offer"
    }
];

export default function ArtistHomePage() {
    const router = useRouter();

    // These states are added for header compatibility, but the main logic is for non-logged-in artists.
    const [isCustomerLoggedIn, setIsCustomerLoggedIn] = React.useState(false);
    const [customer, setCustomer] = React.useState(null);
    const [cartCount, setCartCount] = React.useState(0);

    return (
        <div className="flex min-h-screen w-full flex-col bg-sand">
             <Header
                isCustomerLoggedIn={isCustomerLoggedIn}
                onCustomerLogout={() => {}}
                customer={customer}
                cartCount={cartCount}
            />
            <main className="flex-1">
                {/* Hero Section */}
                <section className="w-full py-12 md:py-24 lg:py-32 bg-primary/10 text-center">
                    <div className="container px-4 md:px-6">
                        <div className="grid gap-6 lg:grid-cols-1 items-center">
                            <div className="flex flex-col justify-center space-y-4">
                                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline text-primary">
                                    Join UtsavLook & Grow Your Artistry Business
                                </h1>
                                <p className="max-w-[600px] text-foreground/80 md:text-xl mx-auto">
                                    We provide the tools, you provide the talent. Get discovered by more customers, manage your business professionally, and increase your earnings.
                                </p>
                                <div className="w-full max-w-sm mx-auto space-x-4">
                                     <Link href="/artist/register">
                                        <Button size="lg" className="bg-accent hover:bg-accent/90">
                                            Register Now
                                        </Button>
                                    </Link>
                                    <Link href="/artist/login">
                                        <Button size="lg" variant="outline">
                                            Artist Login
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Benefits Section */}
                <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
                    <div className="container px-4 md:px-6">
                        <h2 className="text-3xl font-bold tracking-tighter text-center sm:text-5xl text-primary font-headline mb-12">
                            Why Artists Love UtsavLook
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {benefits.map((benefit, index) => (
                                <Card key={index} className="overflow-hidden hover:shadow-2xl transition-shadow duration-300">
                                     <div className="relative w-full aspect-video">
                                        <Image
                                            src={benefit.image}
                                            alt={benefit.title}
                                            layout="fill"
                                            className="object-cover"
                                            data-ai-hint={benefit.aiHint}
                                        />
                                    </div>
                                    <CardHeader className="flex flex-row items-start gap-4">
                                        {benefit.icon}
                                        <div>
                                            <CardTitle>{benefit.title}</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">
                                            {benefit.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                 {/* Call to Action Section */}
                <section className="w-full py-12 md:py-24 lg:py-32 bg-primary/10">
                    <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
                        <div className="space-y-3">
                        <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight text-primary font-headline">
                            Ready to Elevate Your Career?
                        </h2>
                        <p className="mx-auto max-w-[600px] text-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                            Stop waiting for clients to find you. Join a platform that actively works to grow your business.
                        </p>
                        </div>
                        <div className="mx-auto w-full max-w-sm space-y-2">
                            <Link href="/artist/register">
                                <Button size="lg" className="w-full bg-accent hover:bg-accent/90">
                                    Become a UtsavLook Artist Today
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
