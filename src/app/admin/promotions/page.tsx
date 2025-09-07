
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
import { Tag, PlusCircle, Trash2, ToggleLeft, ToggleRight, Calendar as CalendarIcon } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { Promotion } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

const promotionSchema = z.object({
  code: z.string().min(4, 'Code must be at least 4 characters').regex(/^[A-Z0-9]+$/, 'Code must be uppercase letters and numbers only.'),
  discount: z.coerce.number().min(1, 'Discount must be at least 1%').max(100, 'Discount cannot exceed 100%'),
  expiryDate: z.date({ required_error: 'An expiry date is required.'}),
});

type PromotionFormValues = z.infer<typeof promotionSchema>;

const initialPromotions: Promotion[] = [
    { id: 'promo_1', code: 'WELCOME10', discount: 10, expiryDate: '2024-12-31', isActive: true },
    { id: 'promo_2', code: 'FESTIVE20', discount: 20, expiryDate: '2024-10-31', isActive: true },
    { id: 'promo_3', code: 'SUMMER15', discount: 15, expiryDate: '2024-06-30', isActive: false },
];

export default function PromotionsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [promotions, setPromotions] = React.useState<Promotion[]>([]);

    const form = useForm<PromotionFormValues>({
        resolver: zodResolver(promotionSchema),
        defaultValues: { code: '', discount: 10 },
    });

    React.useEffect(() => {
        const isAdminAuthenticated = localStorage.getItem('isAdminAuthenticated');
        if (isAdminAuthenticated !== 'true') {
            router.push('/admin/login');
        }
        
        const storedPromos = localStorage.getItem('promotions');
        setPromotions(storedPromos ? JSON.parse(storedPromos) : initialPromotions);
    }, [router]);
    
    const savePromotions = (updatedPromos: Promotion[]) => {
        setPromotions(updatedPromos);
        localStorage.setItem('promotions', JSON.stringify(updatedPromos));
    }

    const onSubmit: SubmitHandler<PromotionFormValues> = (data) => {
        if (promotions.some(p => p.code === data.code)) {
            form.setError('code', { message: 'This code already exists.' });
            return;
        }

        const newPromotion: Promotion = {
            id: `promo_${Date.now()}`,
            ...data,
            expiryDate: format(data.expiryDate, 'yyyy-MM-dd'),
            isActive: new Date(data.expiryDate) > new Date(),
        };

        savePromotions([newPromotion, ...promotions]);
        toast({ title: 'Promotion Created', description: `Code ${data.code} has been added.` });
        form.reset({ code: '', discount: 10 });
    };

    const toggleStatus = (id: string) => {
        const updated = promotions.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p);
        savePromotions(updated);
        toast({ title: 'Status Updated' });
    };

    const deletePromotion = (id: string) => {
        const updated = promotions.filter(p => p.id !== id);
        savePromotions(updated);
        toast({ title: 'Promotion Deleted', variant: 'destructive' });
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
                            <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                <FormField control={form.control} name="code" render={({ field }) => (
                                    <FormItem><FormLabel>Promo Code</FormLabel><FormControl><Input placeholder="E.g., SAVE10" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="discount" render={({ field }) => (
                                    <FormItem><FormLabel>Discount (%)</FormLabel><FormControl><Input type="number" placeholder="10" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                    <FormField control={form.control} name="expiryDate" render={({ field }) => (
                                    <FormItem><FormLabel>Expiry Date</FormLabel>
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
                                <Button type="submit" className="md:col-span-1 w-full" disabled={form.formState.isSubmitting}><PlusCircle/>Create Code</Button>
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
                                    <TableHead>Expires On</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {promotions.map(promo => (
                                    <TableRow key={promo.id}>
                                        <TableCell className="font-mono">{promo.code}</TableCell>
                                        <TableCell>{promo.discount}%</TableCell>
                                        <TableCell>{format(new Date(promo.expiryDate), 'PPP')}</TableCell>
                                        <TableCell>
                                            <Badge variant={promo.isActive ? 'default' : 'destructive'}>{promo.isActive ? 'Active' : 'Inactive'}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                                <Button variant="ghost" size="icon" onClick={() => toggleStatus(promo.id)} title={promo.isActive ? 'Deactivate' : 'Activate'}>
                                                {promo.isActive ? <ToggleRight className="text-green-600"/> : <ToggleLeft className="text-muted-foreground"/>}
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => deletePromotion(promo.id)} title="Delete">
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

