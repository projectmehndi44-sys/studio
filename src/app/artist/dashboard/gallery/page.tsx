'use client';

import * as React from 'react';
import { useArtistPortal } from '../layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Image as ImageIcon, Upload, Trash2, Loader2 } from 'lucide-react';
import NextImage from 'next/image';
import { updateArtist, uploadSiteImage, deleteSiteImage } from '@/lib/services';
import { Input } from '@/components/ui/input';
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


export default function ArtistGalleryPage() {
    const { artist } = useArtistPortal();
    const { toast } = useToast();
    const [workImages, setWorkImages] = React.useState<string[]>([]);
    const [isUploading, setIsUploading] = React.useState(false);
    const [imageToDelete, setImageToDelete] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (artist?.workImages) {
            setWorkImages(artist.workImages);
        }
    }, [artist]);

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!artist) return;
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const downloadURL = await uploadSiteImage(file, `artists/${artist.id}/work`, true);
            const updatedImages = [...workImages, downloadURL];
            await updateArtist(artist.id, { workImages: updatedImages });
            setWorkImages(updatedImages);
            toast({ title: "Image Uploaded", description: "Your new work has been added to the gallery." });
        } catch (error: any) {
            toast({ title: "Upload Failed", description: error.message || "Could not upload image.", variant: "destructive" });
        } finally {
            setIsUploading(false);
        }
    };
    
    const handleDeleteImage = async () => {
        if (!artist || !imageToDelete) return;
        
        try {
            await deleteSiteImage(imageToDelete);
            const updatedImages = workImages.filter(url => url !== imageToDelete);
            await updateArtist(artist.id, { workImages: updatedImages });
            setWorkImages(updatedImages);
            toast({ title: "Image Deleted", description: "The image has been removed from your gallery.", variant: "destructive" });
        } catch (error: any) {
            toast({ title: "Deletion Failed", description: error.message || "Could not delete the image.", variant: "destructive" });
        } finally {
            setImageToDelete(null);
        }
    };


    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ImageIcon className="w-6 h-6 text-primary"/>Manage Your Gallery</CardTitle>
                    <CardDescription>Showcase your best work. Upload high-quality images to attract more clients. You can upload up to 12 images.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {workImages.map((imageUrl) => (
                            <div key={imageUrl} className="relative group aspect-square">
                                <NextImage src={imageUrl} alt="Artist work" fill className="rounded-md object-cover"/>
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button variant="destructive" size="icon" onClick={() => setImageToDelete(imageUrl)}>
                                        <Trash2 className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                         {workImages.length < 12 && (
                             <div className="relative border-2 border-dashed border-muted-foreground/50 rounded-lg p-4 text-center hover:border-accent flex items-center justify-center aspect-square">
                                {isUploading ? (
                                    <Loader2 className="h-8 w-8 text-muted-foreground animate-spin"/>
                                ) : (
                                    <>
                                        <div className="flex flex-col items-center gap-1 text-muted-foreground">
                                            <Upload className="h-8 w-8"/>
                                            <p className="text-sm">Upload Image</p>
                                        </div>
                                        <Input
                                            id="image-upload"
                                            type="file"
                                            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            disabled={isUploading}
                                        />
                                    </>
                                )}
                            </div>
                         )}
                    </div>
                </CardContent>
            </Card>

             <AlertDialog open={!!imageToDelete} onOpenChange={() => setImageToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will permanently delete this image from your gallery. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteImage} className="bg-destructive hover:bg-destructive/90">
                            Yes, Delete Image
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
