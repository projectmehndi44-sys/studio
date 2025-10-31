

'use client';

import * as React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Tag, PlusCircle, Trash2, ToggleLeft, ToggleRight, Calendar as CalendarIcon } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { Promotion } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useAdminAuth } from '@/firebase/auth/use-admin-auth';
import { getPromotions, savePromotions } from '@/lib/services';

const promotionSchema = z.object({
  code: z.string().min(4, 'Code must be at least 4 characters').regex(/^[A-Z0-9]+$/, 'Code must be uppercase letters and numbers only.'),
  discount: z.coerce.number().min(1, 'Discount must be at least 1%').max(100, 'Discount cannot exceed 100%'),
  usageLimit: z.coerce.number().min(0, 'Usage limit must be a positive number. 0 for unlimited.'),
  expiryDate: z.date().optional(),
});

type PromotionFormValues = z.infer<typeof promotionSchema>;

export default function PromotionsPage() {
    const { toast } = useToast();
    const { hasPermission } = useAdminAuth();
    const [promotions, setPromotions] = React.useState<Promotion[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);

    const form = useForm<PromotionFormValues>({
        resolver: zodResolver(promotionSchema),
        defaultValues: { code: '', discount: 10, usageLimit: 1 },
    });
    
    const fetchPromotions = React.useCallback(async () => {
        setIsLoading(true);
        const promos = await getPromotions();
        setPromotions(promos);
        setIsLoading(false);
    }, []);

    React.useEffect(() => {
        fetchPromotions();
    }, [fetchPromotions]);
    
    const onSubmit: SubmitHandler<PromotionFormValues> = async (data) => {
        if (promotions.some(p => p.code === data.code)) {
            form.setError('code', { message: 'This code already exists.' });
            return;
        }

        const newPromotion: Promotion = {
            id: `promo_${Date.now()}`,
            code: data.code,
            discount: data.discount,
            usageLimit: data.usageLimit,
            isActive: true, // New codes are active by default
        };
        
        if (data.expiryDate) {
            newPromotion.expiryDate = format(data.expiryDate, 'yyyy-MM-dd');
            newPromotion.isActive = new Date(data.expiryDate) > new Date();
        }

        try {
            await savePromotions([newPromotion, ...promotions]);
            await fetchPromotions();
            toast({ title: 'Promotion Created', description: `Code ${data.code} has been added.` });
            form.reset({ code: '', discount: 10, usageLimit: 1, expiryDate: undefined });
        } catch (error: any) {
            toast({ title: 'Creation Failed', description: error.message || 'Could not create the promotion.', variant: 'destructive' });
        }
    };

    const toggleStatus = async (id: string) => {
        const updated = promotions.map(p => {
            if (p.id === id) {
                // If there's an expiry date and it's in the past, don't allow activation.
                if (!p.isActive && p.expiryDate && new Date(p.expiryDate) < new Date()) {
                    toast({
                        title: 'Cannot Activate Expired Code',
                        variant: 'destructive',
                    });
                    return p;
                }
                return { ...p, isActive: !p.isActive };
            }
            return p;
        });

        try {
            await savePromotions(updated);
            setPromotions(updated);
            toast({ title: 'Status Updated' });
        } catch (error: any) {
            toast({ title: 'Update Failed', description: error.message || 'Could not update the promotion status.', variant: 'destructive' });
        }
    };

    const deletePromotion = async (id: string) => {
        const updated = promotions.filter(p => p.id !== id);
        try {
            await savePromotions(updated);
            setPromotions(updated);
            toast({ title: 'Promotion Deleted', variant: 'destructive' });
        } catch (error: any) {
            toast({ title: 'Deletion Failed', description: error.message || 'Could not delete the promotion.', variant: 'destructive' });
        }
    };


    return (
        <>
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Promotions</h1>
            </div>
            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Tag className="w-6 h-6 text-primary"/>Create New Promotion</CardTitle>
                    </CardHeader>
                    <CardContent>
                            <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                                <FormField control={form.control} name="code" render={({ field }) => (
                                    <FormItem><FormLabel>Promo Code</FormLabel><FormControl><Input placeholder="E.g., SAVE10" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="discount" render={({ field }) => (
                                    <FormItem><FormLabel>Discount (%)</FormLabel><FormControl><Input type="number" placeholder="10" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="usageLimit" render={({ field }) => (
                                    <FormItem><FormLabel>Uses Per Customer</FormLabel><FormControl><Input type="number" placeholder="1 (0 for unlimited)" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                    <FormField control={form.control} name="expiryDate" render={({ field }) => (
                                    <FormItem><FormLabel>Expiry Date (Optional)</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date()} initialFocus />
                                            </PopoverContent>
                                        </Popover>
                                    <FormMessage /></FormItem>
                                )} />
                                <Button type="submit" className="md:col-span-1 w-full" disabled={form.formState.isSubmitting || !hasPermission('settings', 'edit')}><PlusCircle/>Create Code</Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Existing Promotions</CardTitle>
                    </CardHeader>
                    <CardContent>
                            <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Discount</TableHead>
                                    <TableHead>Usage Limit</TableHead>
                                    <TableHead>Expires On</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={6} className="text-center">Loading promotions...</TableCell></TableRow>
                                ) : promotions.map(promo => (
                                    <TableRow key={promo.id}>
                                        <TableCell className="font-mono">{promo.code}</TableCell>
                                        <TableCell>{promo.discount}%</TableCell>
                                        <TableCell>{promo.usageLimit === 0 ? 'Unlimited' : `${promo.usageLimit} per customer`}</TableCell>
                                        <TableCell>{promo.expiryDate ? format(new Date(promo.expiryDate), 'PPP') : 'Never'}</TableCell>
                                        <TableCell>
                                            <Badge variant={promo.isActive ? 'default' : 'destructive'}>{promo.isActive ? 'Active' : 'Inactive'}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                                <Button variant="ghost" size="icon" onClick={() => toggleStatus(promo.id)} title={promo.isActive ? 'Deactivate' : 'Activate'} disabled={!hasPermission('settings', 'edit')}>
                                                {promo.isActive ? <ToggleRight className="text-green-600"/> : <ToggleLeft className="text-muted-foreground"/>}
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => deletePromotion(promo.id)} title="Delete" disabled={!hasPermission('settings', 'edit')}>
                                                <Trash2 className="text-destructive"/>
                                                </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

