'use client';

import * as React from 'react';
import { useUser } from '@/firebase';
import { getCustomer } from '@/lib/services';
import type { Artist, Customer, CartItem, MasterServicePackage } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles, LogOut, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { Header } from '@/components/utsavlook/Header';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StyleMatch } from '@/components/utsavlook/StyleMatch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import ServicesPageContent from '../services/page';
import ArtistsPageContent from '../artists/page';
import { PwaInstallBanner } from '@/components/utsavlook/PwaInstallBanner';

export default function AccountPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const auth = useAuth();
    const { toast } = useToast();
    const [customer, setCustomer] = React.useState<Customer | null>(null);
    const [cartCount, setCartCount] = React.useState(0);

    React.useEffect(() => {
        if (!isUserLoading) {
            if (user) {
                getCustomer(user.uid).then(customerData => {
                    if (customerData) {
                        setCustomer(customerData);
                        const storedCart = localStorage.getItem(`cart_${user.uid}`);
                        setCartCount(storedCart ? JSON.parse(storedCart).length : 0);
                    } else {
                        // This case might happen if DB record creation failed after auth
                        router.push('/login');
                    }
                });
            } else {
                router.push('/login');
            }
        }
    }, [user, isUserLoading, router]);

    const handleLogout = () => {
        signOut(auth);
        toast({ title: 'Logged Out' });
        router.push('/');
    };

    if (isUserLoading || !customer) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
             <PwaInstallBanner />
            <Header
                isCustomerLoggedIn={true}
                onCustomerLogout={handleLogout}
                customer={customer}
                cartCount={cartCount}
            />
            <main className="flex-1">
                <div className="container mx-auto px-4 md:px-6 py-8">
                     <div className="mb-8 text-center">
                        <h1 className="text-3xl md:text-4xl font-bold font-headline text-primary">Welcome, {customer.name}!</h1>
                        <p className="text-muted-foreground">Your personalized dashboard for all things UtsavLook.</p>
                     </div>

                     <Tabs defaultValue="services" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 max-w-4xl mx-auto">
                            <TabsTrigger value="ai-tools">AI Style Advisor</TabsTrigger>
                            <TabsTrigger value="services">Browse Services</TabsTrigger>
                            <TabsTrigger value="artists">Find Artists</TabsTrigger>
                        </TabsList>
                        <TabsContent value="ai-tools" className="mt-6">
                            <Accordion type="single" collapsible className="w-full max-w-4xl mx-auto">
                                <AccordionItem value="item-1">
                                    <AccordionTrigger className="text-lg font-semibold bg-background p-4 rounded-lg shadow-sm">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="w-6 h-6 text-accent"/>
                                            AI-Powered Style Match
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <StyleMatch />
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </TabsContent>
                        <TabsContent value="services">
                           <ServicesPageContent />
                        </TabsContent>
                        <TabsContent value="artists">
                           <ArtistsPageContent />
                        </TabsContent>
                     </Tabs>
                </div>
            </main>
        </div>
    );
}
