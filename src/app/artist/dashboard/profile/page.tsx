
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Artist } from '@/types';
import { artists as initialArtists } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Trash2, Upload, UserCircle, Briefcase, Tag, Lock, Image as ImageIcon } from 'lucide-react';
import NextImage from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';


const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  location: z.string().min(2, "Location is required."),
  charge: z.number().min(0),
  services: z.array(z.string()).min(1, "At least one service must be selected."),
  styleTags: z.array(z.object({ value: z.string().min(1, "Tag cannot be empty.") })),
  password: z.string().optional().or(z.literal('')),
  confirmPassword: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ArtistProfilePageProps {
    artist: Artist; // Passed from layout
}

export default function ArtistProfilePage({ artist: initialArtistData }: ArtistProfilePageProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [artist, setArtist] = React.useState<Artist | null>(initialArtistData);
    const [tagInput, setTagInput] = React.useState('');
    
    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: '',
            location: '',
            charge: 0,
            services: [],
            styleTags: [],
            password: '',
            confirmPassword: ''
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "styleTags"
    });

    const getArtists = (): Artist[] => {
         const storedArtists = localStorage.getItem('artists');
         const localArtists: Artist[] = storedArtists ? JSON.parse(storedArtists) : [];
         const allArtistsMap = new Map<string, Artist>();
         initialArtists.forEach(a => allArtistsMap.set(a.id, a));
         localArtists.forEach(a => allArtistsMap.set(a.id, a));
         return Array.from(allArtistsMap.values());
    }
    
    const saveArtists = (artists: Artist[]) => {
        const artistsToStore = artists.filter(a => {
            const initialArtist = initialArtists.find(ia => ia.id === a.id);
            if (!initialArtist) return true;
            return JSON.stringify(initialArtist) !== JSON.stringify(a);
        });

        localStorage.setItem('artists', JSON.stringify(artistsToStore));
        window.dispatchEvent(new Event('storage'));
    };

    React.useEffect(() => {
        if (artist) {
            form.reset({
                name: artist.name,
                location: artist.location,
                charge: artist.charge,
                services: artist.services,
                styleTags: artist.styleTags.map(tag => ({ value: tag })),
            });
        } else {
             router.push('/artist/login');
        }
    }, [artist, router, form]);

    const onSubmit = (data: ProfileFormValues) => {
        if (!artist) return;
        
        const allArtists = getArtists();
        const artistIndex = allArtists.findIndex(a => a.id === artist.id);

        if (artistIndex === -1) {
            toast({ title: 'Error', description: 'Could not find your profile to update.', variant: 'destructive' });
            return;
        }

        const updatedArtist: Artist = {
            ...allArtists[artistIndex],
            name: data.name,
            location: data.location,
            charge: data.charge,
            services: data.services as ('mehndi' | 'makeup')[],
            styleTags: data.styleTags.map(tag => tag.value),
        };
        
        if (data.password) {
            updatedArtist.password = data.password;
        }
        
        allArtists[artistIndex] = updatedArtist;
        saveArtists(allArtists);
        setArtist(updatedArtist);
        
        form.reset({ ...data, password: '', confirmPassword: '' });
        
        toast({
            title: "Profile Updated",
            description: "Your public profile has been successfully updated.",
        });
    };

    const handleProfilePicUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && artist) {
            const newProfilePicUrl = URL.createObjectURL(file);
            const allArtists = getArtists();
            const artistIndex = allArtists.findIndex(a => a.id === artist.id);
            if (artistIndex === -1) return;

            const updatedArtist = { ...allArtists[artistIndex], profilePicture: newProfilePicUrl };
            allArtists[artistIndex] = updatedArtist;

            saveArtists(allArtists);
            setArtist(updatedArtist);

            toast({ title: "Profile picture updated!" });
        }
    };
    
    const handleAddTag = () => {
        if (tagInput.trim() !== '') {
            const currentTags = form.getValues('styleTags').map(tag => tag.value.toLowerCase());
            if (!currentTags.includes(tagInput.trim().toLowerCase())) {
                append({ value: tagInput.trim() });
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

    const handleImageDelete = (imageSrc: string) => {
        if (!artist) return;
    
        const updatedWorkImages = artist.workImages.filter(src => src !== imageSrc);
        
        const allArtists = getArtists();
        const artistIndex = allArtists.findIndex(a => a.id === artist.id);
        if (artistIndex === -1) return;

        const updatedArtist = { ...allArtists[artistIndex], workImages: updatedWorkImages };
        allArtists[artistIndex] = updatedArtist;

        saveArtists(allArtists);
        setArtist(updatedArtist);
        
        toast({ title: "Image deleted", variant: "destructive" });
    };

    const handleGalleryUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0 && artist) {
            const newImageUrls = Array.from(files).map(file => URL.createObjectURL(file));

            const allArtists = getArtists();
            const artistIndex = allArtists.findIndex(a => a.id === artist.id);
            if (artistIndex === -1) return;
            
            const updatedWorkImages = [...artist.workImages, ...newImageUrls];
            const updatedArtist = { ...allArtists[artistIndex], workImages: updatedWorkImages };
            allArtists[artistIndex] = updatedArtist;
            
            saveArtists(allArtists);
setArtist(updatedArtist);

            toast({ title: `${files.length} image(s) added to your gallery.` });
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
                    <Accordion type="multiple" defaultValue={['item-1', 'item-2']} className="w-full space-y-4">
                        <AccordionItem value="item-1">
                            <Card>
                                <CardHeader>
                                    <AccordionTrigger className="w-full justify-between p-0 hover:no-underline">
                                        <CardTitle className="flex items-center gap-2 text-lg"><UserCircle /> Basic Information</CardTitle>
                                    </AccordionTrigger>
                                </CardHeader>
                                <AccordionContent>
                                    <CardContent className="grid md:grid-cols-2 gap-6 pt-2">
                                        <FormField control={form.control} name="name" render={({ field }) => (
                                            <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="location" render={({ field }) => (
                                            <FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
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
                        
                        <AccordionItem value="item-2">
                             <Card>
                                <CardHeader>
                                    <AccordionTrigger className="w-full justify-between p-0 hover:no-underline">
                                        <CardTitle className="flex items-center gap-2 text-lg"><Briefcase /> Services & Pricing</CardTitle>
                                    </AccordionTrigger>
                                </CardHeader>
                                <AccordionContent>
                                    <CardContent className="space-y-6 pt-2">
                                        <FormField control={form.control} name="services" render={() => (
                                            <FormItem><FormLabel>Services Offered</FormLabel>
                                                <div className="flex gap-4 items-center">
                                                    <FormField control={form.control} name="services" render={({ field }) => (
                                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                                            <FormControl><Checkbox checked={field.value?.includes('mehndi')} onCheckedChange={(checked) => { return checked ? field.onChange([...field.value, 'mehndi']) : field.onChange(field.value?.filter(v => v !== 'mehndi')) }} /></FormControl>
                                                            <FormLabel className="font-normal">Mehndi</FormLabel>
                                                        </FormItem>
                                                    )} />
                                                    <FormField control={form.control} name="services" render={({ field }) => (
                                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                                            <FormControl><Checkbox checked={field.value?.includes('makeup')} onCheckedChange={(checked) => { return checked ? field.onChange([...field.value, 'makeup']) : field.onChange(field.value?.filter(v => v !== 'makeup')) }} /></FormControl>
                                                            <FormLabel className="font-normal">Makeup</FormLabel>
                                                        </FormItem>
                                                    )} />
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="charge" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Base Charge (per session): ₹{field.value?.toLocaleString()}</FormLabel>
                                                <FormControl><Slider min={500} max={20000} step={500} value={[field.value]} onValueChange={(vals) => field.onChange(vals[0])} /></FormControl>
                                            </FormItem>
                                        )} />
                                    </CardContent>
                                </AccordionContent>
                            </Card>
                        </AccordionItem>

                        <AccordionItem value="item-3">
                             <Card>
                                <CardHeader>
                                     <AccordionTrigger className="w-full justify-between p-0 hover:no-underline">
                                        <CardTitle className="flex items-center gap-2 text-lg"><Tag /> Style Tags</CardTitle>
                                     </AccordionTrigger>
                                    <CardDescription>Add tags that describe your work (e.g., 'bridal', 'minimalist').</CardDescription>
                                </CardHeader>
                                <AccordionContent>
                                    <CardContent className="space-y-4 pt-2">
                                        <div className="flex items-center gap-2">
                                            <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Add a new tag" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }} />
                                            <Button type="button" onClick={handleAddTag}>Add Tag</Button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {fields.map((field, index) => (
                                                <Badge key={field.id} variant="secondary" className="flex items-center gap-1">
                                                    {field.value}
                                                    <button type="button" onClick={() => remove(index)} className="rounded-full hover:bg-muted-foreground/20 p-0.5">
                                                    <Trash2 className="h-3 w-3" />
                                                    </button>
                                                </Badge>
                                            ))}
                                        </div>
                                    </CardContent>
                                </AccordionContent>
                            </Card>
                        </AccordionItem>

                        <AccordionItem value="item-4">
                             <Card>
                                <CardHeader>
                                    <AccordionTrigger className="w-full justify-between p-0 hover:no-underline">
                                        <CardTitle className="flex items-center gap-2 text-lg"><Lock /> Change Password</CardTitle>
                                    </AccordionTrigger>
                                     <CardDescription>Leave blank to keep your current password.</CardDescription>
                                </CardHeader>
                                <AccordionContent>
                                    <CardContent className="grid md:grid-cols-2 gap-6 pt-2">
                                        <FormField control={form.control} name="password" render={({ field }) => (
                                            <FormItem><FormLabel>New Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                                            <FormItem><FormLabel>Confirm New Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </CardContent>
                                </AccordionContent>
                            </Card>
                        </AccordionItem>

                    </Accordion>
                    <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>Save Profile Changes</Button>
                </form>
            </Form>
            
            <Separator />

             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ImageIcon /> Manage Images</CardTitle>
                    <CardDescription>Update your profile picture and work gallery.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>Profile Picture</Label>
                        <div className="flex items-center gap-4">
                            <NextImage src={artist.profilePicture} alt="Profile" width={80} height={80} className="rounded-full object-cover" />
                            <Button asChild variant="outline">
                                <label>
                                    <Upload className="mr-2"/> Change Picture
                                    <Input type="file" className="sr-only" accept="image/*" onChange={handleProfilePicUpload} />
                                </label>
                            </Button>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label>Work Gallery</Label>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                           {artist.workImages.map((src, index) => (
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
                                <Upload className="h-8 w-8 text-muted-foreground" />
                                <p className="mt-2 text-xs text-muted-foreground">Upload More</p>
                                <Input type="file" className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer" multiple accept="image/*" onChange={handleGalleryUpload} />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

        </div>
    );
}
