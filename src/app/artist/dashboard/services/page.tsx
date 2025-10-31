
'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import type { Artist, MasterServicePackage, ArtistServiceOffering } from '@/lib/types';
import { getMasterServices, updateArtist } from '@/lib/services';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { IndianRupee, Save } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useArtistPortal } from '../layout';

export default function ArtistServicesPage() {
    const { artist, setArtist } = useArtistPortal();
    const { toast } = useToast();
    const [masterServices, setMasterServices] = React.useState<MasterServicePackage[]>([]);

    const form = useForm<{ offerings: ArtistServiceOffering[] }>();

    React.useEffect(() => {
        getMasterServices().then(setMasterServices);
    }, []);

    React.useEffect(() => {
        if (artist && masterServices.length > 0) {
            const offerings: ArtistServiceOffering[] = [];
            masterServices.forEach(service => {
                // Only create offerings if the artist has opted for the parent service (e.g., 'mehndi')
                if (artist.services.includes(service.service)) {
                    service.categories.forEach(category => {
                        const existingOffering = artist.serviceOfferings?.find(
                            o => o.masterPackageId === service.id && o.categoryName === category.name
                        );
                        offerings.push({
                            masterPackageId: service.id,
                            categoryName: category.name,
                            isEnabled: existingOffering?.isEnabled || false,
                            artistPrice: existingOffering?.artistPrice || category.basePrice,
                        });
                    });
                }
            });
            form.reset({ offerings });
        }
    }, [artist, masterServices, form]);

    const { fields } = useFieldArray({
        control: form.control,
        name: "offerings"
    });
    
    const onSubmit = async (data: { offerings: ArtistServiceOffering[] }) => {
        if (!artist || !setArtist) return;
        
        try {
            await updateArtist(artist.id, { serviceOfferings: data.offerings });
             if (setArtist) {
                setArtist(prev => prev ? { ...prev, serviceOfferings: data.offerings } : null);
            }
            toast({
                title: "Services Updated",
                description: "Your service offerings and prices have been saved.",
            });
        } catch (error) {
            console.error("Failed to update services:", error);
            toast({ title: 'Error', description: 'Could not update your services.', variant: 'destructive' });
        }
    };

    if (!artist) {
        return <div>Loading...</div>
    }

    // Filter master services based on the services the artist has signed up for in their profile
    const availableMasterServices = masterServices.filter(ms => artist.services.includes(ms.service));

    if (availableMasterServices.length === 0) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>My Service Offerings</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">You have not selected any primary service categories in your profile. Please go to your <a href="/artist/dashboard/profile" className="underline text-primary">profile</a> and select the services you offer (e.g., Mehndi, Makeup) to configure your packages here.</p>
                </CardContent>
            </Card>
        )
    }


    return (
        <Card>
            <CardHeader>
                <CardTitle>My Service Offerings</CardTitle>
                <CardDescription>
                    Enable the services you want to provide and set your price for each tier. Your price must be equal to or greater than the base price set by the platform.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <Accordion type="multiple" defaultValue={availableMasterServices.map(s => s.id)} className="w-full space-y-4">
                            {availableMasterServices.map((service) => (
                                <AccordionItem key={service.id} value={service.id}>
                                    <Card>
                                        <AccordionTrigger className="p-6 hover:no-underline text-left">
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold">{service.name}</h3>
                                                <p className="text-sm text-muted-foreground">{service.description}</p>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="px-6 pb-6 space-y-4">
                                                {service.categories.map(category => {
                                                    const fieldIndex = fields.findIndex(
                                                        f => f.masterPackageId === service.id && f.categoryName === category.name
                                                    );
                                                    
                                                    if(fieldIndex === -1) return null;

                                                    return (
                                                         <Card key={`${service.id}-${category.name}`} className="p-4 bg-background">
                                                            <div className="flex items-start justify-between">
                                                                <div>
                                                                    <h4 className="font-semibold text-primary">{category.name}</h4>
                                                                    <p className="text-sm text-muted-foreground">{category.description}</p>
                                                                </div>
                                                                 <FormField
                                                                    control={form.control}
                                                                    name={`offerings.${fieldIndex}.isEnabled`}
                                                                    render={({ field }) => (
                                                                        <FormItem className="flex flex-col items-center space-y-1">
                                                                            <FormLabel>Enabled</FormLabel>
                                                                            <FormControl>
                                                                                <Switch
                                                                                    checked={field.value}
                                                                                    onCheckedChange={field.onChange}
                                                                                />
                                                                            </FormControl>
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                            </div>
                                                            <div className="mt-2">
                                                                <FormField
                                                                    control={form.control}
                                                                    name={`offerings.${fieldIndex}.artistPrice`}
                                                                    rules={{ min: category.basePrice }}
                                                                    render={({ field }) => (
                                                                        <FormItem>
                                                                            <FormLabel>Your Price</FormLabel>
                                                                            <div className="relative">
                                                                                <IndianRupee className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"/>
                                                                                <FormControl>
                                                                                    <Input type="number" {...field} className="pl-8" disabled={!form.watch(`offerings.${fieldIndex}.isEnabled`)}/>
                                                                                </FormControl>
                                                                            </div>
                                                                            {form.watch(`offerings.${fieldIndex}.artistPrice`) < category.basePrice && <p className="text-sm font-medium text-destructive">Your price cannot be lower than the base price of ₹{category.basePrice}.</p>}
                                                                            <FormMessage/>
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                            </div>
                                                        </Card>
                                                    );
                                                })}
                                            </div>
                                        </AccordionContent>
                                    </Card>
                                </AccordionItem>
                            ))}
                        </Accordion>
                        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                            <Save className="mr-2 h-4 w-4"/>
                            Save My Services
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
