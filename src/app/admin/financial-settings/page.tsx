
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
import { Save, Percent, IndianRupee } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const settingsSchema = z.object({
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, { message: 'Invalid GSTIN format.' }).or(z.literal('')),
  platformFee: z.coerce.number().min(0, 'Fee cannot be negative.').max(100, 'Fee cannot exceed 100%.'),
  refundFee: z.coerce.number().min(0, 'Refund fee cannot be negative.'),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function FinancialSettingsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(false);

    const form = useForm<SettingsFormValues>({
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            gstin: '',
            platformFee: 10,
            refundFee: 500,
        },
    });

    React.useEffect(() => {
        const isAdminAuthenticated = localStorage.getItem('isAdminAuthenticated');
        if (isAdminAuthenticated !== 'true') {
            router.push('/admin/login');
        }

        // Load saved settings from localStorage
        const savedGstin = localStorage.getItem('platformGstin');
        const savedFee = localStorage.getItem('platformFeePercentage');
        const savedRefundFee = localStorage.getItem('platformRefundFee');
        
        form.reset({
            gstin: savedGstin || '',
            platformFee: savedFee ? parseFloat(savedFee) : 10,
            refundFee: savedRefundFee ? parseFloat(savedRefundFee) : 500,
        });

    }, [router, form]);

    const onSubmit: SubmitHandler<SettingsFormValues> = (data) => {
        setIsLoading(true);
        
        localStorage.setItem('platformGstin', data.gstin);
        localStorage.setItem('platformFeePercentage', data.platformFee.toString());
        localStorage.setItem('platformRefundFee', data.refundFee.toString());

        // Dispatch a storage event to notify other components if they need to update
        window.dispatchEvent(new Event('storage'));

        setTimeout(() => {
            toast({
                title: 'Settings Saved',
                description: 'Your financial settings have been updated successfully.',
            });
            setIsLoading(false);
        }, 1000);
    };

    return (
        <>
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Financial Settings</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Manage Financial Rules</CardTitle>
                    <CardDescription>
                        Set your platform's GST number, commission fees, and other financial parameters. These will be applied globally.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                           {/* Standard Settings */}
                            <div className="grid md:grid-cols-3 gap-6">
                                <FormField control={form.control} name="gstin" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Platform GSTIN</FormLabel>
                                        <FormControl><Input placeholder="e.g., 27ABCDE1234F1Z5" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="platformFee" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Platform Fee Percentage</FormLabel>
                                        <div className="relative">
                                            <FormControl><Input type="number" placeholder="10" {...field} className="pl-8" /></FormControl>
                                            <Percent className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="refundFee" render={({ field }) => (
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
                            
                            <Button type="submit" disabled={isLoading} className="w-full !mt-8">
                                    {isLoading ? 'Saving...' : <><Save className="mr-2 h-4 w-4"/> Save Changes</>}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </>
    );
}
