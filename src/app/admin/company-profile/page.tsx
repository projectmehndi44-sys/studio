
'use client';

import * as React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Save, Building } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { getCompanyProfile, saveCompanyProfile } from '@/lib/services';

const profileSchema = z.object({
  companyName: z.string().min(1, 'Company Name is required.'),
  ownerName: z.string().min(1, 'Owner Name is required.'),
  address: z.string().min(1, 'Address is required.'),
  phone: z.string().min(1, 'Phone number is required.'),
  email: z.string().email('Invalid email address.'),
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, { message: 'Invalid GSTIN format.' }).or(z.literal('')),
  website: z.string().url('Invalid URL.').or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function CompanyProfilePage() {
    const { toast } = useToast();
    const { hasPermission } = useAdminAuth();
    const [isLoading, setIsLoading] = React.useState(false);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            companyName: '',
            ownerName: '',
            address: '',
            phone: '',
            email: '',
            gstin: '',
            website: '',
        },
    });

    React.useEffect(() => {
        getCompanyProfile().then(profile => {
            if (profile) {
                form.reset(profile);
            }
        });
    }, [form]);

    const onSubmit: SubmitHandler<ProfileFormValues> = async (data) => {
        setIsLoading(true);
        
        try {
            await saveCompanyProfile(data);
            toast({
                title: 'Company Profile Saved',
                description: 'Your company details have been updated successfully.',
            });
        } catch (error) {
             toast({
                title: 'Error Saving Profile',
                description: 'Could not update your company details.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Company Profile</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Building /> Manage Company Information</CardTitle>
                    <CardDescription>
                        This information will be used on invoices and other official documents.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <div className="grid md:grid-cols-2 gap-6">
                                <FormField control={form.control} name="companyName" render={({ field }) => (
                                    <FormItem><FormLabel>Company Name</FormLabel><FormControl><Input placeholder="UtsavLook" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="ownerName" render={({ field }) => (
                                    <FormItem><FormLabel>Owner Name</FormLabel><FormControl><Input placeholder="Your Name" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>

                             <FormField control={form.control} name="address" render={({ field }) => (
                                <FormItem><FormLabel>Company Address</FormLabel><FormControl><Textarea placeholder="123 Business Rd, City, State, ZIP" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />

                            <div className="grid md:grid-cols-2 gap-6">
                                 <FormField control={form.control} name="phone" render={({ field }) => (
                                    <FormItem><FormLabel>Contact Phone</FormLabel><FormControl><Input placeholder="+91 12345 67890" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="email" render={({ field }) => (
                                    <FormItem><FormLabel>Contact Email</FormLabel><FormControl><Input type="email" placeholder="contact@company.com" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="gstin" render={({ field }) => (
                                    <FormItem><FormLabel>Platform GSTIN</FormLabel><FormControl><Input placeholder="e.g., 27ABCDE1234F1Z5" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="website" render={({ field }) => (
                                    <FormItem><FormLabel>Website URL</FormLabel><FormControl><Input placeholder="https://www.yourcompany.com" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                            
                            <Button type="submit" disabled={isLoading || !hasPermission('settings', 'edit')} className="w-full !mt-8">
                                    {isLoading ? 'Saving...' : <><Save className="mr-2 h-4 w-4"/> Save Changes</>}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </>
    );
}
