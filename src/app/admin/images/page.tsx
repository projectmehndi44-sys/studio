

'use client';

import * as React from 'react';
import { useForm, useFieldArray, SubmitHandler } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Image as ImageIcon, Upload, Trash2, Save, PlusCircle, Gift, Megaphone, Loader2, Text, SlidersHorizontal } from 'lucide-react';
import NextImage from 'next/image';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { ImagePlaceholder, BenefitImage, HeroSettings } from '@/lib/types';
import { getPlaceholderImages, savePlaceholderImages, getBenefitImages, saveBenefitImages, getPromotionalImage, savePromotionalImage, uploadSiteImage, deleteSiteImage, getHeroSettings, saveHeroSettings } from '@/lib/services';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


const imageSchema = z.object({
    id: z.string(),
    description: z.string().min(1, 'Description is required'),
    imageUrl: z.string().url('Must be a valid URL'),
    imageHint: z.string().min(1, 'AI Hint is required'),
});

const formSchema = z.object({
    images: z.array(imageSchema),
});


const benefitImageSchema = z.object({
  id: z.string(),
  title: z.string(),
  imageUrl: z.string().url('Must be a valid URL'),
  description: z.string(),
});

const benefitFormSchema = z.object({
    benefitImages: z.array(benefitImageSchema)
});

const heroSettingsSchema = z.object({
  slideshowText: z.string().min(1, "Slideshow text is required."),
});

type DeleteDialogState = {
    index: number;
    imageUrl: string;
    arrayName: 'hero-slideshow' | 'gallery' | 'background';
} | null;


export default function ImageManagementPage() {
    const { toast } = useToast();
    const { hasPermission } = useAdminAuth();
    const [isLoading, setIsLoading] = React.useState(true);
    const [isUploading, setIsUploading] = React.useState<Record<string, boolean>>({});
    const [imageToDelete, setImageToDelete] = React.useState<DeleteDialogState>(null);
    const [promoImage, setPromoImage] = React.useState<string | null>(null);
    const [isSavingPromo, setIsSavingPromo] = React.useState(false);

    const placeholderForm = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { images: [] }
    });
    
    const benefitsForm = useForm<z.infer<typeof benefitFormSchema>>({
        resolver: zodResolver(benefitFormSchema),
        defaultValues: { benefitImages: [] }
    });

    const heroSettingsForm = useForm<z.infer<typeof heroSettingsSchema>>({
        resolver: zodResolver(heroSettingsSchema),
        defaultValues: { slideshowText: "" }
    });
    
    const { fields: placeholderFields, append: appendPlaceholder, remove: removePlaceholder } = useFieldArray({ control: placeholderForm.control, name: "images" });
    const { fields: benefitFields, replace } = useFieldArray({
        control: benefitsForm.control,
        name: "benefitImages"
    });


    React.useEffect(() => {
        setIsLoading(true);
        Promise.all([
            getPlaceholderImages(),
            getBenefitImages(),
            getPromotionalImage(),
            getHeroSettings()
        ]).then(([placeholderData, benefitData, promoData, heroData]) => {
            placeholderForm.reset({ images: placeholderData || [] });
            replace(benefitData || []);
            if (promoData) setPromoImage(promoData.imageUrl);
            heroSettingsForm.reset(heroData);
            setIsLoading(false);
        }).catch(err => {
            console.error("Error loading image data:", err);
            toast({ title: "Error", description: "Could not load site image data.", variant: "destructive"});
            setIsLoading(false);
        });
    }, [placeholderForm, replace, heroSettingsForm, toast]);
    
    const getFieldsForCategory = (category: string) => {
        const allFields = placeholderForm.getValues('images');
        return allFields.map((img, index) => ({...img, originalIndex: index})).filter(img => img.id.startsWith(category));
    };

    const onPlaceholderSubmit = async (data: z.infer<typeof formSchema>) => {
        try {
            await savePlaceholderImages(data.images);
            toast({ title: 'Placeholder Images Saved', description: 'Your image library has been updated.' });
        } catch (error: any) {
            console.error("Failed to save images:", error);
            toast({ title: 'Error Saving Images', description: error.message || 'Could not update the image library.', variant: 'destructive' });
        }
    };
    
    const onBenefitSubmit: SubmitHandler<z.infer<typeof benefitFormSchema>> = async (data) => {
        try {
            await saveBenefitImages(data.benefitImages);
            toast({ title: 'Benefit Images Saved', description: 'The artist benefits images have been updated successfully.' });
        } catch (error: any) {
            console.error("Failed to save images:", error);
            toast({ title: 'Error Saving Images', description: error.message || 'Could not update the benefit images.', variant: 'destructive' });
        }
    };

    const onHeroSettingsSubmit = async (data: z.infer<typeof heroSettingsSchema>) => {
        try {
            await saveHeroSettings(data);
            toast({ title: "Hero Settings Saved", description: "The homepage hero text has been updated."});
        } catch (error: any) {
            console.error("Failed to save hero settings", error);
            toast({ title: 'Error Saving Settings', description: error.message || "Could not save settings.", variant: 'destructive'});
        }
    }

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, uploadPath: string, uploadKey: string, onUploadComplete: (url: string) => void, compress: boolean) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(prev => ({...prev, [uploadKey]: true}));
        try {
            const downloadURL = await uploadSiteImage(file, uploadPath, compress);
            onUploadComplete(downloadURL);
            toast({ title: "Upload successful!", description: "Image has been uploaded." });
        } catch (error) {
            console.error("Upload failed", error);
            toast({ title: "Upload failed", description: "Could not upload the image.", variant: "destructive" });
        } finally {
            setIsUploading(prev => ({...prev, [uploadKey]: false}));
        }
    };
    
    const handleBenefitImageUpload = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const uploadKey = `benefit-${index}`;
        handleImageUpload(event, 'site-images/benefits', uploadKey, (url) => {
            benefitsForm.setValue(`benefitImages.${index}.imageUrl`, url, { shouldDirty: true });
        }, false);
    };

    const handlePlaceholderImageUpload = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
         const uploadKey = `placeholder-${index}`;
         handleImageUpload(event, 'site-images/placeholders', uploadKey, (url) => {
            placeholderForm.setValue(`images.${index}.imageUrl`, url, { shouldDirty: true });
        }, true);
    };
    
    const handlePromoImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const uploadKey = 'promo';
        handleImageUpload(event, 'site-images/promo', uploadKey, (url) => {
            setPromoImage(url);
        }, false);
    };

    const handleSavePromoImage = async () => {
        if (!promoImage) return;
        setIsSavingPromo(true);
        try {
            await savePromotionalImage({ imageUrl: promoImage });
            toast({ title: 'Promotional Image Saved', description: 'The main artist benefits promo image has been updated.' });
        } catch (error: any) {
            console.error("Failed to save promo image:", error);
            toast({ title: 'Error', description: error.message || 'Could not save the promotional image.', variant: 'destructive' });
        } finally {
            setIsSavingPromo(false);
        }
    };

    const confirmDelete = async () => {
        if (!imageToDelete) return;
        const { index, imageUrl } = imageToDelete;

        try {
            await deleteSiteImage(imageUrl);
            removePlaceholder(index);
            
            toast({ title: "Image Deleted", description: "The image has been permanently deleted. Save changes to update the list." });
        } catch (error) {
            console.error("Deletion failed:", error);
            toast({ title: "Deletion Failed", description: "Could not delete the image from storage.", variant: 'destructive' });
        } finally {
            setImageToDelete(null);
        }
    };
    
    const renderPlaceholderCategory = (category: string, title: string, description: string) => {
        const fields = getFieldsForCategory(category);
        return (
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="w-6 h-6 text-primary"/> {title}
                    </CardTitle>
                    <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {fields.map((field) => (
                        <Card key={field.id} className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                            <div className="md:col-span-1 space-y-2">
                                <NextImage src={field.imageUrl} alt={field.id} width={200} height={150} className="rounded-md object-cover w-full aspect-[4/3]"/>
                                <div className="relative border-2 border-dashed border-muted-foreground/50 rounded-lg p-2 text-center hover:border-accent">
                                    {isUploading[`placeholder-${field.originalIndex}`] ? <Loader2 className="h-6 w-6 text-muted-foreground animate-spin"/> : <Upload className="mx-auto h-6 w-6 text-muted-foreground" />}
                                     <p className="mt-1 text-xs text-muted-foreground">Click to upload</p>
                                    <Input 
                                        id={`placeholder-upload-${field.originalIndex}`} 
                                        type="file" 
                                        className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer" 
                                        accept="image/*" 
                                        onChange={(e) => handlePlaceholderImageUpload(e, field.originalIndex)} 
                                        disabled={isUploading[`placeholder-${field.originalIndex}`]}
                                    />
                                </div>
                            </div>
                            <div className="md:col-span-2 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={placeholderForm.control} name={`images.${field.originalIndex}.id`} render={({ field }) => (
                                        <FormItem><FormLabel>Image ID</FormLabel><FormControl><Input {...field} disabled /></FormControl></FormItem>
                                    )} />
                                    <FormField control={placeholderForm.control} name={`images.${field.originalIndex}.imageHint`} render={({ field }) => (
                                        <FormItem><FormLabel>AI Hint</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                    )} />
                                </div>
                                 <FormField control={placeholderForm.control} name={`images.${field.originalIndex}.imageUrl`} render={({ field }) => (
                                    <FormItem><FormLabel>Image URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>
                                )} />
                                <FormField control={placeholderForm.control} name={`images.${field.originalIndex}.description`} render={({ field }) => (
                                    <FormItem><FormLabel>Description</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>
                                )} />
                                 <Button type="button" variant="destructive" size="sm" onClick={() => setImageToDelete({index: field.originalIndex, imageUrl: placeholderForm.getValues(`images.${field.originalIndex}.imageUrl`), arrayName: 'gallery' })} disabled={!hasPermission('settings', 'edit')}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </Button>
                            </div>
                        </Card>
                    ))}
                     <Button type="button" variant="outline" onClick={() => appendPlaceholder({ id: `${category}-${Date.now()}`, description: '', imageUrl: 'https://picsum.photos/800/600', imageHint: '' })}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add New Image to {title}
                    </Button>
                </CardContent>
            </Card>
        )
    }

    if (isLoading) {
        return <p>Loading images...</p>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Site Image Management</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><SlidersHorizontal />Homepage Hero Settings</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...heroSettingsForm}>
                        <form onSubmit={heroSettingsForm.handleSubmit(onHeroSettingsSubmit)} className="space-y-4">
                            <FormField control={heroSettingsForm.control} name="slideshowText" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Slideshow Overlay Text</FormLabel>
                                    <FormControl><Input placeholder="e.g. Artistry for Every Occasion" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <Button type="submit" disabled={heroSettingsForm.formState.isSubmitting || !hasPermission('settings', 'edit')}>
                                <Save className="mr-2 h-4 w-4" /> Save Hero Text
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Megaphone className="w-6 h-6 text-primary"/> Artist Benefits Promotional Image
                    </CardTitle>
                    <CardDescription>
                        Upload the single, high-quality promotional image that will be used for the "Share Benefits" feature on the "For Artists" page.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        <div className="space-y-2">
                            {promoImage ? (
                                <NextImage src={promoImage} alt="Promotional Image Preview" width={1080} height={1080} className="rounded-md object-contain w-full border-4 border-accent p-1" />
                            ) : (
                                <div className="aspect-square w-full bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                                    <p>No image uploaded</p>
                                </div>
                            )}
                        </div>
                        <div className="relative border-2 border-dashed border-muted-foreground/50 rounded-lg p-8 text-center hover:border-accent flex flex-col items-center justify-center">
                            {isUploading['promo'] ? <Loader2 className="h-12 w-12 text-muted-foreground animate-spin"/> : <Upload className="mx-auto h-12 w-12 text-muted-foreground" /> }
                            <p className="mt-4 text-sm text-muted-foreground">Click to upload or drag & drop</p>
                             <p className="text-xs text-muted-foreground">Recommended size: 1080x1080px</p>
                            <Input 
                                id="promo-image-upload" 
                                type="file" 
                                className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer" 
                                accept="image/*" 
                                onChange={handlePromoImageUpload}
                                disabled={isUploading['promo']}
                            />
                        </div>
                    </div>
                     <Button onClick={handleSavePromoImage} className="w-full" disabled={isSavingPromo || !hasPermission('settings', 'edit')}>
                        <Save className="mr-2 h-4 w-4" /> 
                        {isSavingPromo ? 'Saving...' : 'Save Promotional Image'}
                    </Button>
                </CardContent>
            </Card>
            
            {/* New Artist Benefits Image Management */}
             <Form {...benefitsForm}>
                <form onSubmit={benefitsForm.handleSubmit(onBenefitSubmit)}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Gift className="w-6 h-6 text-primary"/> Artist Benefits Images
                            </CardTitle>
                            <CardDescription>
                                Update the images shown on the "For Artists" page for each benefit category.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {benefitFields.map((field, index) => (
                                <Card key={field.id} className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                    <div className="md-col-span-1 space-y-2">
                                        <NextImage src={benefitsForm.watch(`benefitImages.${index}.imageUrl`)} alt={field.id} width={300} height={225} className="rounded-md object-cover w-full aspect-[4/3]"/>
                                        <div className="relative border-2 border-dashed border-muted-foreground/50 rounded-lg p-4 text-center hover:border-accent">
                                            {isUploading[`benefit-${index}`] ? <Loader2 className="h-8 w-8 text-muted-foreground animate-spin"/> : <Upload className="mx-auto h-8 w-8 text-muted-foreground" />}
                                            <p className="mt-2 text-xs text-muted-foreground">Click to upload new image</p>
                                            <Input 
                                                id={`image-upload-${index}`} 
                                                type="file" 
                                                className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer" 
                                                accept="image/*" 
                                                onChange={(e) => handleBenefitImageUpload(e, index)} 
                                                disabled={isUploading[`benefit-${index}`]}
                                            />
                                        </div>
                                    </div>
                                    <div className="md:col-span-2 space-y-4">
                                         <FormField control={benefitsForm.control} name={`benefitImages.${index}.id`} render={({ field }) => (
                                            <FormItem><FormLabel>Benefit ID</FormLabel><FormControl><Input {...field} disabled /></FormControl></FormItem>
                                        )} />
                                        <FormField control={benefitsForm.control} name={`benefitImages.${index}.title`} render={({ field }) => (
                                            <FormItem><FormLabel>Benefit Title</FormLabel><FormControl><Input {...field} disabled /></FormControl></FormItem>
                                        )} />
                                        <FormField control={benefitsForm.control} name={`benefitImages.${index}.description`} render={({ field }) => (
                                            <FormItem><FormLabel>Description</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>
                                        )} />
                                    </div>
                                </Card>
                            ))}
                        </CardContent>
                    </Card>
                     <div className="mt-6">
                        <Button type="submit" className="w-full" disabled={benefitsForm.formState.isSubmitting || !hasPermission('settings', 'edit')}>
                            <Save className="mr-2 h-4 w-4" /> Save Benefit Images
                        </Button>
                    </div>
                </form>
            </Form>
            
            
             <Form {...placeholderForm}>
                <form onSubmit={placeholderForm.handleSubmit(onPlaceholderSubmit)}>
                    
                     {renderPlaceholderCategory('hero-slideshow', 'Hero Slideshow Images', 'Images for the main hero section slideshow.')}
                     {renderPlaceholderCategory('our-work', 'Our Works Gallery Images', 'Images for the "Our Works" section.')}
                     
                    <div className="mt-6">
                        <Button type="submit" className="w-full" disabled={placeholderForm.formState.isSubmitting || !hasPermission('settings', 'edit')}>
                            <Save className="mr-2 h-4 w-4" /> Save All Placeholder Changes
                        </Button>
                    </div>
                </form>
            </Form>
            <AlertDialog open={!!imageToDelete} onOpenChange={() => setImageToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will permanently delete the image file from the server. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                            Yes, Delete Permanently
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
