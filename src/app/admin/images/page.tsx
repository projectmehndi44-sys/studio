

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Image as ImageIcon, Upload, Trash2 } from 'lucide-react';
import NextImage from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminAuth } from '@/hooks/use-admin-auth';


// Mock data for existing images. In a real app, this would come from a database or file storage.
const initialGalleryImages = [
    { src: 'https://picsum.photos/600/400?random=101', alt: 'Intricate bridal mehndi' },
    { src: 'https://picsum.photos/600/400?random=102', alt: 'Glamorous makeup look' },
    { src: 'https://picsum.photos/600/400?random=103', alt: 'Arabic mehndi design' },
    { src: 'https://picsum.photos/600/400?random=107', alt: 'Full hand traditional mehndi' },
];

const initialBackgroundImages = [
  'https://picsum.photos/1200/800?random=201',
  'https://picsum.photos/1200/800?random=202',
  'https://picsum.photos/1200/800?random=203',
  'https://picsum.photos/1200/800?random=204',
];


export default function ImageManagementPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { hasPermission } = useAdminAuth();
    
    // State to manage images.
    const [galleryImages, setGalleryImages] = React.useState(initialGalleryImages);
    const [backgroundImages, setBackgroundImages] = React.useState(initialBackgroundImages);
    const [isUploading, setIsUploading] = React.useState(false);

    React.useEffect(() => {
        const isAdminAuthenticated = localStorage.getItem('isAdminAuthenticated');
        if (isAdminAuthenticated !== 'true') {
            router.push('/admin/login');
        }
    }, [router]);
    
    const handleImageUpload = (type: 'gallery' | 'background') => (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        // Mock upload process
        setTimeout(() => {
            const newImageUrls = Array.from(files).map(file => ({
                src: URL.createObjectURL(file),
                alt: 'Newly uploaded image'
            }));

            if (type === 'gallery') {
                setGalleryImages(prev => [...prev, ...newImageUrls]);
            } else {
                setBackgroundImages(prev => [...prev, ...newImageUrls.map(f => f.src)]);
            }

            toast({
                title: 'Upload Successful',
                description: `${files.length} image(s) have been added to the ${type}.`,
            });
            setIsUploading(false);
        }, 1500);
    };

    const handleImageDelete = (type: 'gallery' | 'background', index: number) => {
        // In a real app, you'd also delete the file from your storage bucket.
        if (type === 'gallery') {
            setGalleryImages(prev => prev.filter((_, i) => i !== index));
        } else {
            setBackgroundImages(prev => prev.filter((_, i) => i !== index));
        }
        toast({
            title: 'Image Deleted',
            description: `The selected image has been removed.`,
            variant: 'destructive'
        });
    };

    return (
        <>
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Site Image Management</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="w-6 h-6 text-primary"/> Image Management
                    </CardTitle>
                    <CardDescription>
                        Add or remove images displayed in the "Our Works" gallery and on the site's background.
                    </CardDescription>
                </CardHeader>
                    <CardContent>
                    <Tabs defaultValue="gallery">
                        <TabsList>
                            <TabsTrigger value="gallery">Gallery Images</TabsTrigger>
                            <TabsTrigger value="background">Background Images</TabsTrigger>
                        </TabsList>
                        <TabsContent value="gallery" className="mt-4">
                                <Card>
                                <CardHeader>
                                    <CardTitle>Gallery Images</CardTitle>
                                    <CardDescription>These images appear in the "Our Works" carousel on the homepage.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
                                        {galleryImages.map((image, index) => (
                                            <div key={index} className="relative group">
                                                <NextImage src={image.src} alt={image.alt} width={200} height={150} className="rounded-md object-cover w-full aspect-[4/3]"/>
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="destructive" size="icon" onClick={() => handleImageDelete('gallery', index)} disabled={!hasPermission('settings', 'edit')}>
                                                        <Trash2 className="h-4 w-4" />
                                                        <span className="sr-only">Delete Image</span>
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="relative border-2 border-dashed border-muted-foreground/50 rounded-lg p-6 text-center hover:border-accent">
                                        <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
                                        <p className="mt-2 text-muted-foreground">Click to upload or drag and drop</p>
                                        <Button asChild className="mt-2">
                                                <label htmlFor="gallery-upload">
                                                {isUploading ? 'Uploading...' : 'Add Gallery Images'}
                                                </label>
                                        </Button>
                                        <Input id="gallery-upload" type="file" className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer" multiple onChange={handleImageUpload('gallery')} disabled={isUploading || !hasPermission('settings', 'edit')} />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="background" className="mt-4">
                                <Card>
                                <CardHeader>
                                    <CardTitle>Background Images</CardTitle>
                                    <CardDescription>These images fade in and out as the background of the homepage.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
                                        {backgroundImages.map((src, index) => (
                                            <div key={index} className="relative group">
                                                <NextImage src={src} alt={`Background ${index + 1}`} width={200} height={150} className="rounded-md object-cover w-full aspect-[4/3]"/>
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="destructive" size="icon" onClick={() => handleImageDelete('background', index)} disabled={!hasPermission('settings', 'edit')}>
                                                        <Trash2 className="h-4 w-4" />
                                                        <span className="sr-only">Delete Image</span>
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="relative border-2 border-dashed border-muted-foreground/50 rounded-lg p-6 text-center hover:border-accent">
                                        <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
                                        <p className="mt-2 text-muted-foreground">Click to upload or drag and drop</p>
                                        <Button asChild className="mt-2">
                                                <label htmlFor="background-upload">
                                                {isUploading ? 'Uploading...' : 'Add Background Images'}
                                                </label>
                                        </Button>
                                        <Input id="background-upload" type="file" className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer" multiple onChange={handleImageUpload('background')} disabled={isUploading || !hasPermission('settings', 'edit')} />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </>
    );
}
