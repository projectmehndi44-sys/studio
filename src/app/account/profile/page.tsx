
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAccount } from '../layout';
import { updateCustomer } from '@/lib/services';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserCircle2 } from 'lucide-react';

const profileSchema = z.object({
  name: z.string().min(2, "Name is required."),
  email: z.string().email("Please enter a valid email."),
  phone: z.string().regex(/^\d{10}$/, "Phone number must be 10 digits."),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
    const { customer, fetchData } = useAccount();
    const { toast } = useToast();
    
    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: customer?.name || '',
            email: customer?.email || '',
            phone: customer?.phone || '',
        },
    });

    React.useEffect(() => {
        if (customer) {
            form.reset({
                name: customer.name,
                email: customer.email || '',
                phone: customer.phone,
            });
        }
    }, [customer, form]);

    const onSubmit = async (data: ProfileFormValues) => {
        if (!customer) return;

        try {
            await updateCustomer(customer.id, data);
            await fetchData(); // Refetch data to update layout
            toast({
                title: "Profile Updated",
                description: "Your details have been successfully saved.",
            });
        } catch (error) {
            toast({
                title: "Update Failed",
                description: "Could not save your profile. Please try again.",
                variant: "destructive",
            });
        }
    };

    if (!customer) return <div>Loading...</div>;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><UserCircle2 /> My Profile</CardTitle>
                <CardDescription>Manage your personal and contact information.</CardDescription>
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
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email Address</FormLabel>
                                        <FormControl>
                                            <Input type="email" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone Number</FormLabel>
                                        <FormControl>
                                            <Input {...field} disabled />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
