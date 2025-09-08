

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Save, Percent, IndianRupee, Building, Mail, Phone, Globe } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

const financialSchema = z.object({
  platformFee: z.coerce.number().min(0, 'Fee cannot be negative.').max(100, 'Fee cannot exceed 100%.'),
  refundFee: z.coerce.number().min(0, 'Refund fee cannot be negative.'),
});

const companySchema = z.object({
  companyName: z.string().min(1, 'Company Name is required.'),
  address: z.string().min(1, 'Address is required.'),
  phone: z.string().min(1, 'Phone number is required.'),
  email: z.string().email('Invalid email address.'),
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, { message: 'Invalid GSTIN format.' }).or(z.literal('')),
  website: z.string().url('Invalid URL.').or(z.literal('')),
});

type FinancialFormValues = z.infer<typeof financialSchema>;
type CompanyFormValues = z.infer<typeof companySchema>;

export default function SettingsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { hasPermission } = useAdminAuth();
    const [isLoading, setIsLoading] = React.useState(false);

    const financialForm = useForm<FinancialFormValues>({
        resolver: zodResolver(financialSchema),
        defaultValues: {
            platformFee: 10,
            refundFee: 500,
        },
    });

    const companyForm = useForm<CompanyFormValues>({
        resolver: zodResolver(companySchema),
         defaultValues: {
            companyName: 'MehendiFy Platform',
            address: '123 Glamour Lane, Mumbai, MH, 400001',
            phone: '+91 98765 43210',
            email: 'contact@mehendify.com',
            gstin: '',
            website: 'https://www.mehendify.com',
        },
    });

    React.useEffect(() => {
        const savedFee = localStorage.getItem('platformFeePercentage');
        const savedRefundFee = localStorage.getItem('platformRefundFee');
        financialForm.reset({
            platformFee: savedFee ? parseFloat(savedFee) : 10,
            refundFee: savedRefundFee ? parseFloat(savedRefundFee) : 500,
        });

        const savedProfile = localStorage.getItem('companyProfile');
        if (savedProfile) {
            companyForm.reset(JSON.parse(savedProfile));
        }
    }, [financialForm, companyForm]);

    const onFinancialSubmit: SubmitHandler<FinancialFormValues> = (data) => {
        setIsLoading(true);
        localStorage.setItem('platformFeePercentage', data.platformFee.toString());
        localStorage.setItem('platformRefundFee', data.refundFee.toString());
        window.dispatchEvent(new Event('storage'));
        setTimeout(() => {
            toast({ title: 'Financial Settings Saved' });
            setIsLoading(false);
        }, 1000);
    };

    const onCompanySubmit: SubmitHandler<CompanyFormValues> = (data) => {
        setIsLoading(true);
        localStorage.setItem('companyProfile', JSON.stringify(data));
        window.dispatchEvent(new Event('storage'));
        setTimeout(() => {
            toast({ title: 'Company Profile Saved' });
            setIsLoading(false);
        }, 1000);
    };

    return (
        <>
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Platform Settings</h1>
            </div>
            <Tabs defaultValue="financial">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="financial">Financial Rules</TabsTrigger>
                    <TabsTrigger value="company">Company Profile</TabsTrigger>
                </TabsList>
                <TabsContent value="financial">
                    <Card>
                        <CardHeader>
                            <CardTitle>Manage Financial Rules</CardTitle>
                            <CardDescription>
                                Set your platform's commission fees, and other financial parameters. These will be applied globally.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Form {...financialForm}>
                                <form onSubmit={financialForm.handleSubmit(onFinancialSubmit)} className="space-y-8">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <FormField control={financialForm.control} name="platformFee" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Platform Fee Percentage</FormLabel>
                                                <div className="relative">
                                                    <FormControl><Input type="number" placeholder="10" {...field} className="pl-8" /></FormControl>
                                                    <Percent className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={financialForm.control} name="refundFee" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Refund Processing Fee</FormLabel>
                                                <div className="relative">
                                                    <FormControl><Input type="number" placeholder="500" {...field} className="pl-8" /></FormControl>
                                                    <IndianRupee className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
                                    <Button type="submit" disabled={isLoading || !hasPermission('settings', 'edit')} className="w-full !mt-8">
                                            {isLoading ? 'Saving...' : <><Save className="mr-2 h-4 w-4"/> Save Financials</>}
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="company">
                     <Card>
                        <CardHeader>
                            <CardTitle>Manage Company Information</CardTitle>
                            <CardDescription>
                                This information will be used on invoices and other official documents.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Form {...companyForm}>
                                <form onSubmit={companyForm.handleSubmit(onCompanySubmit)} className="space-y-8">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <FormField control={companyForm.control} name="companyName" render={({ field }) => (
                                            <FormItem><FormLabel><Building className="inline-block mr-2 h-4 w-4"/>Company Name</FormLabel><FormControl><Input placeholder="MehendiFy" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={companyForm.control} name="gstin" render={({ field }) => (
                                            <FormItem><FormLabel><IndianRupee className="inline-block mr-2 h-4 w-4"/>Platform GSTIN</FormLabel><FormControl><Input placeholder="e.g., 27ABCDE1234F1Z5" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </div>
                                    <FormField control={companyForm.control} name="address" render={({ field }) => (
                                        <FormItem><FormLabel>Company Address</FormLabel><FormControl><Textarea placeholder="123 Business Rd, City, State, ZIP" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <div className="grid md:grid-cols-3 gap-6">
                                        <FormField control={companyForm.control} name="phone" render={({ field }) => (
                                            <FormItem><FormLabel><Phone className="inline-block mr-2 h-4 w-4"/>Contact Phone</FormLabel><FormControl><Input placeholder="+91 12345 67890" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={companyForm.control} name="email" render={({ field }) => (
                                            <FormItem><FormLabel><Mail className="inline-block mr-2 h-4 w-4"/>Contact Email</FormLabel><FormControl><Input type="email" placeholder="contact@company.com" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={companyForm.control} name="website" render={({ field }) => (
                                            <FormItem><FormLabel><Globe className="inline-block mr-2 h-4 w-4"/>Website URL</FormLabel><FormControl><Input placeholder="https://www.yourcompany.com" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </div>
                                    <Button type="submit" disabled={isLoading || !hasPermission('settings', 'edit')} className="w-full !mt-8">
                                            {isLoading ? 'Saving...' : <><Save className="mr-2 h-4 w-4"/> Save Company Profile</>}
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </>
    );
}
