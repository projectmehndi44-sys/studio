
'use client';

import * as React from 'react';
import type { Customer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Header } from '@/components/utsavlook/Header';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, Phone, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ClientOnly } from '@/components/ClientOnly';
import { Footer } from '@/components/utsavlook/Footer';

export default function ContactUsPage() {
    const { toast } = useToast();
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: "Message Sent!",
            description: "Thank you for contacting us. We will get back to you shortly.",
        });
        // In a real app, you would handle form submission here.
        (e.target as HTMLFormElement).reset();
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
                            Contact Us
                        </h1>
                        <p className="mx-auto max-w-[700px] text-foreground/80 md:text-xl mt-4">
                            Have questions? We're here to help. Reach out to us anytime.
                        </p>
                    </div>
                </section>
                
                <section className="w-full py-12 md:py-24 lg:py-32">
                    <div className="container px-4 md:px-6 grid gap-12 lg:grid-cols-2">
                        <div className="space-y-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Contact Information</CardTitle>
                                    <CardDescription>Our support team is available during business hours.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <Mail className="w-6 h-6 text-accent"/>
                                        <div>
                                            <h3 className="font-semibold">Email</h3>
                                            <a href="mailto:support@utsavlook.com" className="text-muted-foreground hover:text-primary">support@utsavlook.com</a>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Phone className="w-6 h-6 text-accent"/>
                                        <div>
                                            <h3 className="font-semibold">Phone</h3>
                                            <p className="text-muted-foreground">+91 98765 43210</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Clock className="w-6 h-6 text-accent"/>
                                        <div>
                                            <h3 className="font-semibold">Operating Hours</h3>
                                            <p className="text-muted-foreground">Monday - Saturday, 10:00 AM - 7:00 PM IST</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        <div>
                             <Card>
                                <CardHeader>
                                    <CardTitle>Send Us a Message</CardTitle>
                                    <CardDescription>Fill out the form and we'll get back to you.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="name">Name</Label>
                                                <Input id="name" placeholder="Your Name" required />
                                            </div>
                                             <div className="space-y-2">
                                                <Label htmlFor="email">Email</Label>
                                                <Input id="email" type="email" placeholder="your@email.com" required />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="subject">Subject</Label>
                                            <Input id="subject" placeholder="e.g., Question about a booking" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="message">Message</Label>
                                            <Textarea id="message" placeholder="Your message here..." required />
                                        </div>
                                        <Button type="submit" className="w-full bg-accent hover:bg-accent/90">Send Message</Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
