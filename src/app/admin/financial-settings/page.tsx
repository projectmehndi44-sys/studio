
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Save, Percent, IndianRupee } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';

const settingsSchema = z.object({
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, { message: 'Invalid GSTIN format.' }).or(z.literal('')),
  platformFee: z.coerce.number().min(0, 'Fee cannot be negative.').max(100, 'Fee cannot exceed 100%.'),
  refundFee: z.coerce.number().min(0, 'Refund fee cannot be negative.'),
  multiDayDiscounts: z.array(z.coerce.number().min(0).max(100)).length(10),
  dailyPriceIncrements: z.array(z.coerce.number().min(0).max(100)).length(10),
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
            multiDayDiscounts: Array(10).fill(0),
            dailyPriceIncrements: Array(10).fill(0),
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
        const savedDiscounts = localStorage.getItem('multiDayDiscounts');
        const savedIncrements = localStorage.getItem('dailyPriceIncrements');
        
        form.reset({
            gstin: savedGstin || '',
            platformFee: savedFee ? parseFloat(savedFee) : 10,
            refundFee: savedRefundFee ? parseFloat(savedRefundFee) : 500,
            multiDayDiscounts: savedDiscounts ? JSON.parse(savedDiscounts) : Array(10).fill(0).map((_, i) => (i + 1) * 1.5), // Example default logic
            dailyPriceIncrements: savedIncrements ? JSON.parse(savedIncrements) : Array(10).fill(0),
        });

    }, [router, form]);

    const onSubmit: SubmitHandler<SettingsFormValues> = (data) => {
        setIsLoading(true);
        
        localStorage.setItem('platformGstin', data.gstin);
        localStorage.setItem('platformFeePercentage', data.platformFee.toString());
        localStorage.setItem('platformRefundFee', data.refundFee.toString());
        localStorage.setItem('multiDayDiscounts', JSON.stringify(data.multiDayDiscounts));
        localStorage.setItem('dailyPriceIncrements', JSON.stringify(data.dailyPriceIncrements));


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
                            
                            <Separator />

                            {/* Multi-day Discounts */}
                            <div>
                                <h3 className="text-lg font-medium">Multi-Day Booking Discounts</h3>
                                <p className="text-sm text-muted-foreground">Set a discount percentage based on the number of days booked. Day 1 has no discount.</p>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                                    {Array.from({ length: 9 }, (_, i) => i + 1).map((dayIndex) => (
                                        <FormField
                                            key={`discount-${dayIndex}`}
                                            control={form.control}
                                            name={`multiDayDiscounts.${dayIndex}`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Day {dayIndex + 1}</FormLabel>
                                                    <div className="relative">
                                                        <FormControl><Input type="number" {...field} className="pl-8"/></FormControl>
                                                        <Percent className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    ))}
                                </div>
                            </div>
                            
                            <Separator />

                            {/* Daily Price Increments */}
                            <div>
                                <h3 className="text-lg font-medium">Daily Price Increments</h3>
                                <p className="text-sm text-muted-foreground">Increase the base price by a percentage for each subsequent day of a multi-day booking. Day 1 uses the base price (0% increment).</p>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                                     {Array.from({ length: 10 }, (_, i) => i).map((dayIndex) => (
                                        <FormField
                                            key={`increment-${dayIndex}`}
                                            control={form.control}
                                            name={`dailyPriceIncrements.${dayIndex}`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Day {dayIndex + 1}</FormLabel>
                                                    <div className="relative">
                                                        <FormControl><Input type="number" {...field} className="pl-8"/></FormControl>
                                                        <Percent className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    ))}
                                </div>
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
