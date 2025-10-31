

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Artist, ServiceArea } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getAvailableLocations, updateArtist, uploadSiteImage, deleteSiteImage } from '@/lib/services';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Trash2, Upload, UserCircle, Briefcase, Tag, Lock, Image as ImageIcon, IndianRupee, Gift, PlusCircle, MapPin, Loader2, Eye } from 'lucide-react';
import NextImage from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useArtistPortal } from '../layout';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { v4 as uuidv4 } from 'uuid';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';

const serviceAreaSchema = z.object({
  id: z.string(),
  state: z.string().min(1, "State is required."),
  district: z.string().min(1, "District is required."),
  localities: z.string().min(1, "At least one locality is required."),
});

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  charges: z.object({
    mehndi: z.coerce.number().min(0).optional(),
    makeup: z.coerce.number().min(0).optional(),
    photography: z.coerce.number().min(0).optional(),
  }),
  services: z.array(z.string()).min(1, "At least one service must be selected."),
  styleTags: z.array(z.object({ value: z.string().min(1, "Tag cannot be empty.") })),
  password: z.string().optional().or(z.literal('')),
  confirmPassword: z.string().optional(),
  serviceAreas: z.array(serviceAreaSchema).min(1, "You must have at least one service area."),
  referralCode: z.string().optional(),
  referralDiscount: z.coerce.number().min(0).max(20).optional(),
  showContactInfo: z.boolean().default(true),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine(data => {
    if (data.services.includes('mehndi')) {
        return data.charges && data.charges.mehndi !== undefined && data.charges.mehndi > 0;
    }
    return true;
}, {
    message: "A base price is required for the Mehndi service.",
    path: ["charges.mehndi"],
}).refine(data => {
    if (data.services.includes('makeup')) {
        return data.charges && data.charges.makeup !== undefined && data.charges.makeup > 0;
    }
    return true;
}, {
    message: "A base price is required for the Makeup service.",
    path: ["charges.makeup"],
}).refine(data => {
    if (data.services.includes('photography')) {
        return data.charges && data.charges.photography !== undefined && data.charges.photography > 0;
    }
    return true;
}, {
    message: "A base price is required for the Photography service.",
    path: ["charges.photography"],
});


type ProfileFormValues = z.infer<typeof profileSchema>;

const serviceItems = [
    { id: 'mehndi', label: 'Mehndi' },
    { id: 'makeup', label: 'Makeup' },
    { id: 'photography', label: 'Photography' },
] as const;


export default function ArtistProfilePage() {
    const { artist, fetchData } = useArtistPortal();
    const router = useRouter();
    const { toast } = useToast();
    const [tagInput, setTagInput] = React.useState('');
    const [availableLocations, setAvailableLocations] = React.useState<Record<string, string[]>>({});
    const [isUploading, setIsUploading] = React.useState<Record<string, boolean>>({});
    
    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: '',
            charges: {
                mehndi: 0,
                makeup: 0,
                photography: 0,
            },
            services: [],
            styleTags: [],
            password: '',
            confirmPassword: '',
            serviceAreas: [],
            referralCode: '',
            referralDiscount: 10,
            showContactInfo: true,
        },
    });
    
    React.useEffect(() => {
        getAvailableLocations().then(setAvailableLocations);
    }, []);

    const { fields: styleTagFields, append: appendTag, remove: removeTag } = useFieldArray({
        control: form.control,
        name: "styleTags"
    });

    const { fields: serviceAreaFields, append: appendServiceArea, remove: removeServiceArea } = useFieldArray({
        control: form.control,
        name: "serviceAreas"
    });

    const watchServices = form.watch('services');
    const watchReferralDiscount = form.watch('referralDiscount');
    const availableStates = Object.keys(availableLocations);

    React.useEffect(() => {
        if (artist) {
            form.reset({
                name: artist.name,
                charges: artist.charges,
                services: artist.services || [],
                styleTags: (artist.styleTags || []).map(tag => ({ value: tag })),
                serviceAreas: artist.serviceAreas || [],
                referralCode: artist.referralCode || artist.name.split(' ')[0].toUpperCase() + '10',
                referralDiscount: artist.referralDiscount || 10,
                showContactInfo: artist.showContactInfo === undefined ? true : artist.showContactInfo,
            });
        }
    }, [artist, form]);

    const onSubmit: SubmitHandler<ProfileFormValues> = async (data) => {
        if (!artist) return;
        
        const firstServiceArea = data.serviceAreas[0];
        const locationString = `${firstServiceArea.localities.split(',')[0].trim()}, ${firstServiceArea.district}`;
        
        const dataToUpdate: Partial<Artist> = {
            name: data.name,
            location: locationString,
            charges: data.charges,
            services: data.services as ('mehndi' | 'makeup' | 'photography')[],
            styleTags: data.styleTags.map(tag => tag.value),
            serviceAreas: data.serviceAreas,
            referralCode: data.referralCode,
            referralDiscount: data.referralDiscount,
            showContactInfo: data.showContactInfo,
        };

        if (data.password) {
            // In a real app, you would handle password change through a secure backend function
            // For this example, we are just showing the logic
            console.log("Password change requested. This should be handled by a secure backend service.");
        }
        
        try {
            await updateArtist(artist.id, dataToUpdate);
            if (fetchData) await fetchData(artist.id);
            form.reset({ ...data, password: '', confirmPassword: '' });
            toast({
                title: "Profile Updated",
                description: "Your public profile has been successfully updated.",
            });
        } catch (error) {
            console.error("Failed to update profile:", error);
            toast({ title: 'Error', description: 'Could not update profile.', variant: 'destructive' });
        }
    };

    const handleFileUpload = async (file: File, uploadKey: string, artistId: string): Promise<string> => {
        setIsUploading(prev => ({...prev, [uploadKey]: true}));
        try {
            const uploadPath = `artists/${artistId}/${uploadKey}`;
            const downloadURL = await uploadSiteImage(file, uploadPath, true);
            toast({ title: "Upload successful!", description: "Image has been saved." });
            return downloadURL;
        } catch (error) {
            console.error("Upload failed", error);
            toast({ title: "Upload failed", description: "Could not upload the image.", variant: "destructive" });
            throw error;
        } finally {
            setIsUploading(prev => ({...prev, [uploadKey]: false}));
        }
    };
    
    const handleProfilePicUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && artist && fetchData) {
            try {
                const url = await handleFileUpload(file, 'profilePicture', artist.id);
                await updateArtist(artist.id, { profilePicture: url });
                await fetchData(artist.id);
            } catch (error) {
                // Error is already toasted in handleFileUpload
            }
        }
    };

    const handleCoverPhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && artist && fetchData) {
            try {
                const url = await handleFileUpload(file, 'coverPhoto', artist.id);
                await updateArtist(artist.id, { coverPhoto: url });
                await fetchData(artist.id);
            } catch (error) {
                // Error is already toasted in handleFileUpload
            }
        }
    };
    
    const handleGalleryUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0 || !artist || !fetchData) return;
    
        setIsUploading(prev => ({ ...prev, gallery: true }));
        try {
            const currentImages = artist.workImages || [];
            
            const uploadPromises = Array.from(files).map((file, index) => 
                handleFileUpload(file, `gallery-${Date.now()}-${index}`, artist.id)
            );
            
            const newUrls = await Promise.all(uploadPromises);
    
            if (newUrls.length > 0) {
                const updatedImages = [...currentImages, ...newUrls];
                await updateArtist(artist.id, { workImages: updatedImages });
                await fetchData(artist.id);
                toast({ title: `${newUrls.length} image(s) added to your gallery.` });
            }
        } catch (error) {
            // Error is already toasted in handleFileUpload
        } finally {
            setIsUploading(prev => ({ ...prev, gallery: false }));
        }
    };
    

    const handleAddTag = () => {
        if (tagInput.trim() !== '') {
            const currentTags = form.getValues('styleTags').map(tag => tag.value.toLowerCase());
            if (!currentTags.includes(tagInput.trim().toLowerCase())) {
                appendTag({ value: tagInput.trim() });
                setTagInput('');
            } else {
                toast({
                    title: "Tag exists",
                    description: "This style tag has already been added.",
                    variant: "destructive"
                });
            }
        }
    };

    const handleImageDelete = async (imageSrc: string) => {
        if (!artist || !artist.workImages || !fetchData) return;
        
        if (!window.confirm("Are you sure you want to delete this image?")) return;

        try {
            await deleteSiteImage(imageSrc);
            const updatedWorkImages = artist.workImages.filter(src => src !== imageSrc);
            await updateArtist(artist.id, { workImages: updatedWorkImages });
            await fetchData(artist.id);
            toast({ title: "Image deleted", variant: "destructive" });
        } catch(error) {
            toast({ title: "Deletion failed", description: "Could not delete image.", variant: "destructive" });
        }
    };


    if (!artist) {
        return <div className="flex items-center justify-center min-h-full">Loading Profile...</div>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Manage Your Profile</CardTitle>
                    <CardDescription>Keep your information up-to-date to attract more clients.</CardDescription>
                </CardHeader>
            </Card>
            
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <Accordion type="multiple" defaultValue={['item-1', 'item-7', 'item-2', 'item-5', 'item-6', 'item-privacy']} className="w-full space-y-4">
                        <AccordionItem value="item-1">
                            <Card>
                                <AccordionTrigger className="p-6 hover:no-underline">
                                    <CardTitle className="flex items-center gap-2 text-lg"><UserCircle /> Basic Information</CardTitle>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <CardContent className="grid md:grid-cols-2 gap-6 pt-2">
                                        <FormField control={form.control} name="name" render={({ field }) => (
                                            <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <div className="space-y-2">
                                            <Label>Email</Label>
                                            <Input value={artist.email} disabled />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Phone</Label>
                                            <Input value={artist.phone} disabled />
                                        </div>
                                    </CardContent>
                                </AccordionContent>
                            </Card>
                        </AccordionItem>
                        
                         <AccordionItem value="item-7">
                            <Card>
                                <AccordionTrigger className="p-6 hover:no-underline">
                                    <CardTitle className="flex items-center gap-2 text-lg"><MapPin /> Service Areas</CardTitle>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <CardHeader className="pt-0">
                                        <CardDescription>Define all the areas you're willing to travel to for work. Your primary location is derived from the first entry.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6 pt-2">
                                         <div className="space-y-4">
                                            {serviceAreaFields.map((field, index) => {
                                                const watchedState = form.watch(`serviceAreas.${index}.state`);
                                                const districtsForSelectedState = watchedState ? (availableLocations[watchedState] || []) : [];
                                                return (
                                                <Card key={field.id} className="p-4 bg-muted/50">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <h4 className="font-semibold text-primary">Service Area #{index + 1}</h4>
                                                        {serviceAreaFields.length > 1 && <Button type="button" size="icon" variant="ghost" onClick={() => removeServiceArea(index)}><Trash2 className="w-4 h-4 text-destructive"/></Button>}
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                         <FormField control={form.control} name={`serviceAreas.${index}.state`} render={({ field }) => (
                                                            <FormItem><FormLabel>State</FormLabel><Select onValueChange={(value) => { field.onChange(value); form.setValue(`serviceAreas.${index}.district`, ''); }} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select state"/></SelectTrigger></FormControl><SelectContent>{availableStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                                                        )} />
                                                         <FormField control={form.control} name={`serviceAreas.${index}.district`} render={({ field }) => (
                                                            <FormItem><FormLabel>District</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={!watchedState || districtsForSelectedState.length === 0}><FormControl><SelectTrigger><SelectValue placeholder="Select district"/></SelectTrigger></FormControl><SelectContent>{districtsForSelectedState.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                                                        )} />
                                                    </div>
                                                    <FormField control={form.control} name={`serviceAreas.${index}.localities`} render={({ field }) => (
                                                        <FormItem className="mt-4"><FormLabel>Localities Served</FormLabel><FormControl><Input placeholder="e.g., Bandra, Juhu, Andheri" {...field}/></FormControl><FormDescription>Enter a comma-separated list.</FormDescription><FormMessage /></FormItem>
                                                    )} />
                                                </Card>
                                            )})}
                                             <Button type="button" variant="outline" onClick={() => appendServiceArea({ id: uuidv4(), state: '', district: '', localities: '' })}>
                                                <PlusCircle className="mr-2 h-4 w-4"/> Add Another Service Area
                                            </Button>
                                            <FormMessage>{form.formState.errors.serviceAreas?.message}</FormMessage>
                                         </div>
                                    </CardContent>
                                </AccordionContent>
                            </Card>
                        </AccordionItem>

                        <AccordionItem value="item-2">
                             <Card>
                                <AccordionTrigger className="p-6 hover:no-underline">
                                    <CardTitle className="flex items-center gap-2 text-lg"><Briefcase /> Services & Pricing</CardTitle>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <CardContent className="space-y-6 pt-2">
                                        <FormField
                                            control={form.control}
                                            name="services"
                                            render={() => (
                                                <FormItem>
                                                    <FormLabel>Services Offered</FormLabel>
                                                    <div className="flex gap-4 items-center">
                                                        {serviceItems.map((item) => (
                                                        <FormField
                                                            key={item.id}
                                                            control={form.control}
                                                            name="services"
                                                            render={({ field }) => {
                                                            return (
                                                                <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                                                                <FormControl>
                                                                    <Checkbox
                                                                    checked={field.value?.includes(item.id)}
                                                                    onCheckedChange={(checked) => {
                                                                        return checked
                                                                        ? field.onChange([...(field.value || []), item.id])
                                                                        : field.onChange(
                                                                            (field.value || []).filter(
                                                                                (value) => value !== item.id
                                                                            )
                                                                            )
                                                                    }}
                                                                    />
                                                                </FormControl>
                                                                <FormLabel className="font-normal">
                                                                    {item.label}
                                                                </FormLabel>
                                                                </FormItem>
                                                            )
                                                            }}
                                                        />
                                                        ))}
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        
                                        <div className="grid md:grid-cols-2 gap-4">
                                            {watchServices.includes('mehndi') && (
                                                 <FormField control={form.control} name="charges.mehndi" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Base Price for Mehndi</FormLabel>
                                                        <div className="relative">
                                                            <IndianRupee className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                            <FormControl><Input type="number" placeholder="2500" {...field} /></FormControl>
                                                        </div>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />
                                            )}
                                           {watchServices.includes('makeup') && (
                                                <FormField control={form.control} name="charges.makeup" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Base Price for Makeup</FormLabel>
                                                        <div className="relative">
                                                            <IndianRupee className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                            <FormControl><Input type="number" placeholder="5000" {...field} /></FormControl>
                                                        </div>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />
                                          )}
                                          {watchServices.includes('photography') && (
                                                <FormField control={form.control} name="charges.photography" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Base Price for Photography</FormLabel>
                                                        <div className="relative">
                                                            <IndianRupee className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                            <FormControl><Input type="number" placeholder="10000" {...field} /></FormControl>
                                                        </div>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />
                                          )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">Note: Your base price should be inclusive of 18% GST.</p>
                                        
                                    </CardContent>
                                </AccordionContent>
                            </Card>
                        </AccordionItem>

                        <AccordionItem value="item-6">
                            <Card>
                                <AccordionTrigger className="p-6 hover:no-underline">
                                    <CardTitle className="flex items-center gap-2 text-lg"><Gift /> Referral Program</CardTitle>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <CardHeader className="pt-0">
                                        <CardDescription>Create a unique referral code to share with your clients. You can offer them a discount to encourage bookings, and we'll share the cost with you!</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4 pt-2">
                                        <FormField control={form.control} name="referralCode" render={({ field }) => (
                                            <FormItem><FormLabel>Your Unique Referral Code</FormLabel><FormControl><Input placeholder="e.g. YOURNAME10" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="referralDiscount" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Discount for Your Customers (%)</FormLabel>
                                                <FormControl>
                                                    <Slider
                                                        defaultValue={[field.value || 10]}
                                                        value={[field.value || 10]}
                                                        max={20}
                                                        step={1}
                                                        onValueChange={(value) => field.onChange(value[0])}
                                                    />
                                                </FormControl>
                                                <div className="text-center font-bold text-lg text-primary">{watchReferralDiscount}%</div>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <Alert>
                                            <AlertTitle>How It Works</AlertTitle>
                                            <AlertDescription>
                                                When a customer uses your code, we help cover the discount cost. UtsavLook will absorb a discount cost of up to 5% of the total booking value. Any discount you offer above 5% will be deducted from your final payout. For a balanced approach, we recommend setting a 10% discount.
                                            </AlertDescription>
                                        </Alert>
                                    </CardContent>
                                </AccordionContent>
                            </Card>
                        </AccordionItem>

                        <AccordionItem value="item-privacy">
                             <Card>
                                <AccordionTrigger className="p-6 hover:no-underline">
                                    <CardTitle className="flex items-center gap-2 text-lg"><Eye /> Privacy Settings</CardTitle>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <CardHeader className="pt-0">
                                        <CardDescription>Control what information is visible on your public profile.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                       <FormField
                                            control={form.control}
                                            name="showContactInfo"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                    <div className="space-y-0.5">
                                                        <FormLabel className="text-base">Show Contact Info</FormLabel>
                                                        <FormDescription>
                                                            If enabled, your phone and email will be visible on your public profile page.
                                                        </FormDescription>
                                                    </div>
                                                    <FormControl>
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </CardContent>
                                </AccordionContent>
                            </Card>
                        </AccordionItem>

                        <AccordionItem value="item-5">
                             <Card>
                                <AccordionTrigger className="p-6 hover:no-underline">
                                    <CardTitle className="flex items-center gap-2 text-lg"><ImageIcon /> Manage Images</CardTitle>
                                </AccordionTrigger>
                                <AccordionContent>
                                     <CardHeader className="pt-0">
                                        <CardDescription>Update your profile picture, cover photo, and work gallery.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-2">
                                            <Label>Profile Picture</Label>
                                            <div className="flex items-center gap-4">
                                                <NextImage src={artist.profilePicture} alt="Profile" width={80} height={80} className="rounded-full object-cover" />
                                                <Button asChild variant="outline" disabled={isUploading['profilePicture']}>
                                                    <label>
                                                        {isUploading['profilePicture'] ? <Loader2 className="mr-2 animate-spin"/> : <Upload className="mr-2"/>}
                                                        Change Picture
                                                        <Input type="file" className="sr-only" accept="image/*" onChange={handleProfilePicUpload} />
                                                    </label>
                                                </Button>
                                            </div>
                                        </div>
                                         <div className="space-y-2">
                                            <Label>Cover Photo</Label>
                                            <div className="flex items-center gap-4">
                                                <NextImage src={artist.coverPhoto || 'https://picsum.photos/seed/cover/200/80'} alt="Cover Photo" width={200} height={80} className="rounded-md object-cover" />
                                                <Button asChild variant="outline" disabled={isUploading['coverPhoto']}>
                                                    <label>
                                                        {isUploading['coverPhoto'] ? <Loader2 className="mr-2 animate-spin"/> : <Upload className="mr-2"/>}
                                                        Change Cover
                                                        <Input type="file" className="sr-only" accept="image/*" onChange={handleCoverPhotoUpload} />
                                                    </label>
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Work Gallery</Label>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {(artist.workImages || []).map((src, index) => (
                                                <div key={index} className="relative group">
                                                    <NextImage src={src} alt={`Work ${index + 1}`} width={200} height={150} className="rounded-md object-cover w-full aspect-[4/3]"/>
                                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button variant="destructive" size="icon" onClick={() => handleImageDelete(src)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                                <div className="relative border-2 border-dashed border-muted-foreground/50 rounded-lg aspect-[4/3] flex flex-col items-center justify-center text-center hover:border-accent">
                                                     <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                                                        {isUploading['gallery'] ? <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/> : <Upload className="h-8 w-8 text-muted-foreground" />}
                                                        <p className="mt-2 text-xs text-muted-foreground">Upload More</p>
                                                        <Input type="file" className="sr-only" multiple accept="image/*" onChange={handleGalleryUpload} />
                                                     </label>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </AccordionContent>
                            </Card>
                        </AccordionItem>
                        
                    </Accordion>
                    <Button type="submit" size="lg" disabled={form.formState.isSubmitting} className="w-full">Save Profile Changes</Button>
                </form>
            </Form>
        </div>
    );
}

    


