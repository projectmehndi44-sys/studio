'use client';

import * as React from 'react';
import { useUser } from '@/firebase';
import { getCustomer, updateCustomer } from '@/lib/services';
import type { Customer } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Loader2, User as UserIcon, Save, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/utsavlook/Header';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const profileSchema = z.object({
  name: z.string().min(2, { message: 'Name is required.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }).optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function MyProfilePage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const auth = useAuth();
    const { toast } = useToast();

    const [customer, setCustomer] = React.useState<Customer | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: { name: '', email: '' }
    });

    React.useEffect(() => {
        if (!isUserLoading) {
            if (user) {
                getCustomer(user.uid).then(customerData => {
                    if (customerData) {
                        setCustomer(customerData);
                        form.reset({
                            name: customerData.name || '',
                            email: customerData.email || '',
                        });
                        setIsLoading(false);
                    } else {
                        router.push('/login');
                    }
                });
            } else {
                router.push('/login');
            }
        }
    }, [user, isUserLoading, router, form]);

    const handleLogout = () => {
        signOut(auth);
        toast({ title: 'Logged Out' });
        router.push('/');
    };
    
    const onSubmit = async (data: ProfileFormValues) => {
        if (!customer) return;

        try {
            await updateCustomer(customer.id, data);
            setCustomer(prev => prev ? {...prev, ...data} : null);
            toast({
                title: "Profile Updated",
                description: "Your details have been successfully saved.",
            });
        } catch (error) {
            console.error("Profile update error:", error);
            toast({
                title: "Update Failed",
                description: "Could not save your profile. Please try again.",
                variant: "destructive"
            });
        }
    }

    if (isLoading || isUserLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
             <Header
                isCustomerLoggedIn={!!user}
                onCustomerLogout={handleLogout}
                customer={customer}
                cartCount={0} 
            />
            <main className="flex-1 py-8">
                 <div className="container mx-auto px-4 md:px-6 max-w-2xl">
                    <div className="flex items-center gap-4 mb-8">
                        <Button variant="outline" size="icon" onClick={() => router.push('/account')}><ArrowLeft className="h-4 w-4" /></Button>
                        <h1 className="text-3xl font-bold font-headline text-primary">My Profile</h1>
                    </div>
                     <Card>
                        <CardHeader>
                            <CardTitle>Account Information</CardTitle>
                            <CardDescription>Manage your personal details.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                     <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Full Name</FormLabel>
                                                <FormControl><Input {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email Address</FormLabel>
                                                <FormControl><Input type="email" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormItem>
                                        <FormLabel>Phone Number</FormLabel>
                                        <FormControl><Input value={customer?.phone} disabled /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    
                                     <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                                        {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                                        Save Changes
                                     </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                 </div>
            </main>
        </div>
    );
}