'use client';

import * as React from 'react';
import { useArtistPortal } from '../layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Settings, Save, Loader2, IndianRupee } from 'lucide-react';
import { getMasterServices, updateArtist } from '@/lib/services';
import type { MasterServicePackage, ArtistServiceOffering } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function ArtistServicesPage() {
    const { artist } = useArtistPortal();
    const { toast } = useToast();
    const [masterServices, setMasterServices] = React.useState<MasterServicePackage[]>([]);
    const [artistOfferings, setArtistOfferings] = React.useState<ArtistServiceOffering[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);
    
    React.useEffect(() => {
        setIsLoading(true);
        getMasterServices().then(services => {
            setMasterServices(services);
            if (artist?.serviceOfferings) {
                setArtistOfferings(artist.serviceOfferings);
            }
            setIsLoading(false);
        });
    }, [artist]);

    const handlePriceChange = (masterPackageId: string, categoryName: string, newPrice: number) => {
        setArtistOfferings(prev => {
            const existingIndex = prev.findIndex(o => o.masterPackageId === masterPackageId && o.categoryName === categoryName);
            const newOfferings = [...prev];
            
            if (existingIndex > -1) {
                newOfferings[existingIndex] = { ...newOfferings[existingIndex], artistPrice: newPrice };
            } else {
                 newOfferings.push({ masterPackageId, categoryName, artistPrice: newPrice, isEnabled: true });
            }
            return newOfferings;
        });
    };

    const handleToggleService = (masterPackageId: string, isEnabled: boolean) => {
         setArtistOfferings(prev => {
            const masterService = masterServices.find(ms => ms.id === masterPackageId);
            if (!masterService) return prev;

            let newOfferings = [...prev];
            
            masterService.categories.forEach(category => {
                 const existingIndex = newOfferings.findIndex(o => o.masterPackageId === masterPackageId && o.categoryName === category.name);
                 
                 if (existingIndex > -1) {
                     newOfferings[existingIndex].isEnabled = isEnabled;
                 } else if (isEnabled) {
                     // If enabling and it doesn't exist, create it.
                     newOfferings.push({
                         masterPackageId,
                         categoryName: category.name,
                         artistPrice: category.basePrice, // Start with base price
                         isEnabled: true,
                     });
                 }
            });

            return newOfferings;
        });
    };
    
    const isServiceEnabled = (masterPackageId: string) => {
        return artistOfferings.some(o => o.masterPackageId === masterPackageId && o.isEnabled);
    }
    
    const getArtistPriceForCategory = (masterPackageId: string, categoryName: string) => {
        const offering = artistOfferings.find(o => o.masterPackageId === masterPackageId && o.categoryName === categoryName);
        return offering?.artistPrice;
    }

    const handleSaveChanges = async () => {
        if (!artist) return;
        setIsSaving(true);
        
        // Validation check
        for (const offering of artistOfferings) {
            const masterService = masterServices.find(ms => ms.id === offering.masterPackageId);
            if (!masterService) continue;
            const category = masterService.categories.find(c => c.name === offering.categoryName);
            if (category && offering.artistPrice < category.basePrice) {
                toast({
                    title: "Invalid Price",
                    description: `Your price for "${masterService.name} - ${category.name}" cannot be lower than the base price of ₹${category.basePrice}.`,
                    variant: "destructive"
                });
                setIsSaving(false);
                return;
            }
        }
        
        try {
            await updateArtist(artist.id, { serviceOfferings: artistOfferings });
            toast({
                title: "Services Updated",
                description: "Your service offerings and prices have been saved."
            });
        } catch (error) {
             toast({
                title: "Error",
                description: "Could not save your service settings.",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };


    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin w-8 h-8 text-primary"/></div>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Settings className="w-6 h-6 text-primary"/>Services &amp; Pricing</CardTitle>
                    <CardDescription>
                        Choose which services you want to offer from the platform's catalog and set your own prices for each tier. Your price must be equal to or above the base price.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <Accordion type="multiple" className="w-full" defaultValue={masterServices.map(s => s.id)}>
                        {masterServices.map(service => (
                            <AccordionItem value={service.id} key={service.id}>
                                <div className="flex items-center justify-between border-b p-4">
                                     <AccordionTrigger className="text-lg font-semibold flex-grow hover:no-underline">{service.name}</AccordionTrigger>
                                     <Switch 
                                        checked={isServiceEnabled(service.id)}
                                        onCheckedChange={(checked) => handleToggleService(service.id, checked)}
                                        className="ml-4"
                                    />
                                </div>
                                <AccordionContent className="p-4 bg-muted/30">
                                    {isServiceEnabled(service.id) ? (
                                        <div className="grid md:grid-cols-3 gap-4">
                                        {service.categories.map(category => (
                                            <Card key={category.name}>
                                                <CardHeader>
                                                    <CardTitle className="text-base text-primary">{category.name}</CardTitle>
                                                    <CardDescription className="text-xs">Base Price: ₹{category.basePrice}</CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-2">
                                                        <Label htmlFor={`price-${service.id}-${category.name}`}>Your Price</Label>
                                                        <div className="relative">
                                                            <IndianRupee className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"/>
                                                            <Input
                                                                id={`price-${service.id}-${category.name}`}
                                                                type="number"
                                                                className="pl-8"
                                                                value={getArtistPriceForCategory(service.id, category.name) ?? category.basePrice}
                                                                onChange={(e) => handlePriceChange(service.id, category.name, Number(e.target.value))}
                                                                min={category.basePrice}
                                                            />
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                    ) : (
                                        <div className="text-center text-muted-foreground p-4">
                                            Enable this service to set your prices.
                                        </div>
                                    )}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
                 <CardFooter>
                    <Button onClick={handleSaveChanges} disabled={isSaving} className="w-full">
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                        Save Changes
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
