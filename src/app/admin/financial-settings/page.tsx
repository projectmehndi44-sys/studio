
'use client';

import * as React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Save, Percent, IndianRupee } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { getFinancialSettings, saveFinancialSettings } from '@/lib/services';

const settingsSchema = z.object({
  platformFeePercentage: z.coerce.number().min(0, 'Fee cannot be negative.').max(100, 'Fee cannot exceed 100%.'),
  platformRefundFee: z.coerce.number().min(0, 'Refund fee cannot be negative.'),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function FinancialSettingsPage() {
    const { toast } = useToast();
    const { hasPermission } = useAdminAuth();
    const [isLoading, setIsLoading] = React.useState(false);

    const form = useForm<SettingsFormValues>({
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            platformFeePercentage: 10,
            platformRefundFee: 500,
        },
    });

    React.useEffect(() => {
        getFinancialSettings().then(settings => {
            if (settings) {
                form.reset(settings);
            }
        });
    }, [form]);

    const onSubmit: SubmitHandler<SettingsFormValues> = async (data) => {
        setIsLoading(true);
        
        try {
            await saveFinancialSettings(data);
            toast({
                title: 'Settings Saved',
                description: 'Your financial settings have been updated successfully.',
            });
        } catch (error) {
            toast({
                title: 'Error Saving Settings',
                description: 'Could not update your financial settings.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
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
                        Set your platform's commission fees, and other financial parameters. These will be applied globally.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                           {/* Standard Settings */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <FormField control={form.control} name="platformFeePercentage" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Platform Fee Percentage</FormLabel>
                                        <div className="relative">
                                            <FormControl><Input type="number" placeholder="10" {...field} className="pl-8" /></FormControl>
                                            <Percent className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="platformRefundFee" render={({ field }) => (
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
                                    {isLoading ? 'Saving...' : <><Save className="mr-2 h-4 w-4"/> Save Changes</>}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </>
    );
}
