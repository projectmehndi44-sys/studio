
'use client';

import * as React from 'react';
import { useArtistPortal } from '../layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Download, Copy, Share2, Upload } from 'lucide-react';
import NextImage from 'next/image';
import { Input } from '@/components/ui/input';
import { PromoImageTemplate, type PromoImageTemplateProps } from '@/components/utsavlook/PromoImageTemplate';
import { toPng } from 'html-to-image';


type ImageObject = {
  url: string;
  type: 'gallery' | 'local';
};

// Helper to convert a file to a data URI
const fileToDataURI = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};


export default function PromotePage() {
  const { artist } = useArtistPortal();
  const { toast } = useToast();

  const [selectedImages, setSelectedImages] = React.useState<ImageObject[]>([]);
  const [finalImage, setFinalImage] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const finalImageRef = React.useRef<HTMLDivElement>(null);


  const handleImageSelection = (imageUrl: string) => {
    setSelectedImages((prev) => {
      const existingIndex = prev.findIndex(img => img.url === imageUrl);
      if (existingIndex > -1) {
        return prev.filter((_, index) => index !== existingIndex);
      }
      if (prev.length >= 4) {
        toast({
          title: 'Maximum 4 images allowed',
          description: 'Please unselect an image to choose a new one.',
          variant: 'destructive',
        });
        return prev;
      }
      return [...prev, { url: imageUrl, type: 'gallery' }];
    });
  };

  const handleLocalImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    if (selectedImages.length + files.length > 4) {
      toast({
        title: 'Maximum 4 images allowed',
        description: `You can only upload ${4 - selectedImages.length} more image(s).`,
        variant: 'destructive',
      });
      return;
    }

    const dataUris = await Promise.all(Array.from(files).map(fileToDataURI));
    const newImages: ImageObject[] = dataUris.map(uri => ({ url: uri, type: 'local' }));
    
    setSelectedImages(prev => [...prev, ...newImages]);
  };


  const generatePromo = async () => {
    if (!artist || selectedImages.length === 0) {
      toast({
        title: 'Please select 1 to 4 images',
        variant: 'destructive',
      });
      return;
    }
    if (!finalImageRef.current) {
        toast({ title: 'Error', description: 'Template not ready.', variant: 'destructive'});
        return;
    }

    setIsLoading(true);
    setFinalImage(null);

    // The entire generation logic is now on the client
    setTimeout(() => {
        toPng(finalImageRef.current!, { cacheBust: true, pixelRatio: 2 })
        .then((dataUrl) => {
          setFinalImage(dataUrl);
          toast({
            title: 'Your promo image is ready!',
            description: 'You can now download or share it.',
          });
        })
        .catch((err) => {
          console.error(err);
          toast({ title: 'Error', description: 'Could not render final image.', variant: 'destructive'});
        })
        .finally(() => {
            setIsLoading(false);
        });
    }, 100); // Small timeout to ensure DOM is ready
  };


  const shareText = React.useMemo(() => {
    if (!artist) return '';
    return `Book my ${artist.services.join(' & ')} services on UtsavLook! Use my referral code ${artist.referralCode} for a ${artist.referralDiscount}% discount. Visit my profile: ${window.location.origin}/artist/${artist.id}`;
  }, [artist]);

  
  const handleDownload = () => {
      if (!finalImage) return;
      const link = document.createElement('a');
      link.download = `utsavlook-promo-${artist?.name.replace(/\s+/g, '-')}.png`;
      link.href = finalImage;
      link.click();
  }

  const handleShare = async () => {
     if (!finalImage) return;
    
     try {
        const response = await fetch(finalImage);
        const blob = await response.blob();
        const file = new File([blob], `utsavlook-promo.png`, { type: 'image/png' });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
             await navigator.share({
                files: [file],
                title: 'UtsavLook Artist Promotion',
                text: shareText,
            });
        } else {
            handleDownload();
            navigator.clipboard.writeText(shareText);
            toast({
                title: 'Ready to Share!',
                description: 'Image downloaded and text copied to clipboard.',
                duration: 5000,
            });
        }

     } catch (error) {
         console.error('Share failed:', error);
         toast({
            title: 'Share Failed',
            description: 'Could not open share dialog. Downloading image and copying text instead.',
            variant: 'destructive',
         });
         handleDownload();
         navigator.clipboard.writeText(shareText);
     }
  }

  if (!artist) {
    return <p>Loading...</p>;
  }

  const primaryService = artist.services[0];
  const templateProps: PromoImageTemplateProps = {
    workImages: selectedImages.map(img => img.url),
    artistName: artist.name,
    artistServices: artist.services.join(' • '),
    artistRating: artist.rating,
    baseCharge: artist.charges?.[primaryService] || artist.charge || 0,
    artistProfilePic: artist.profilePicture,
  };


  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Hidden div for rendering */}
      <div className="fixed -left-[9999px] top-0">
          <div ref={finalImageRef}>
            <PromoImageTemplate {...templateProps} />
          </div>
      </div>
        
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">1. Select Your Best Work</CardTitle>
            <CardDescription>Choose 1 to 4 images from your gallery or upload new ones.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
              {(artist.workImages || []).map((src, index) => (
                <div key={index} className="relative cursor-pointer group" onClick={() => handleImageSelection(src)}>
                  <NextImage
                    src={src}
                    alt={`Work ${index + 1}`}
                    width={200}
                    height={150}
                    className="rounded-md object-cover w-full aspect-[4/3]"
                  />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Checkbox
                      checked={selectedImages.some(img => img.url === src)}
                      className="h-6 w-6 border-white bg-white/20 data-[state=checked]:bg-primary"
                    />
                  </div>
                  {selectedImages.some(img => img.url === src) && (
                     <div className="absolute inset-0 border-4 border-primary rounded-md pointer-events-none"/>
                  )}
                </div>
              ))}
               {/* Display locally selected images */}
              {selectedImages.filter(img => img.type === 'local').map((image, index) => (
                <div key={`local-${index}`} className="relative cursor-pointer group" onClick={() => handleImageSelection(image.url)}>
                  <NextImage
                    src={image.url}
                    alt={`Local Upload ${index + 1}`}
                    width={200}
                    height={150}
                    className="rounded-md object-cover w-full aspect-[4/3]"
                  />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Checkbox checked={true} className="h-6 w-6 border-white bg-white/20 data-[state=checked]:bg-primary" />
                  </div>
                  <div className="absolute inset-0 border-4 border-primary rounded-md pointer-events-none"/>
                </div>
              ))}
            </div>
             <Button asChild variant="outline" className="w-full mt-4">
                <label>
                  <Upload className="mr-2 h-4 w-4"/>
                  Upload from Device
                  <Input type="file" className="sr-only" multiple accept="image/*" onChange={handleLocalImageUpload} />
                </label>
            </Button>
            <Button onClick={generatePromo} disabled={isLoading || selectedImages.length === 0} className="w-full mt-2">
              {isLoading ? <><Loader2 className="mr-2 animate-spin" /> Generating...</> : <><Sparkles className="mr-2" /> Generate My Promo</>}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">2. Share Your Promo</CardTitle>
                <CardDescription>Here is your personalized promotional image. Download it or share it directly to social media.</CardDescription>
            </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="aspect-[4/5] w-full flex flex-col items-center justify-center bg-muted rounded-lg">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="mt-4 text-muted-foreground">Rendering your graphic...</p>
              </div>
            ) : finalImage ? (
              <NextImage src={finalImage} alt="Generated promo" width={1080} height={1350} className="rounded-lg w-full" />
            ) : (
                <div className="aspect-[4/5] w-full flex flex-col items-center justify-center bg-muted rounded-lg">
                    <p className="text-muted-foreground">Your generated image will appear here.</p>
                </div>
            )}
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <Button onClick={handleShare} disabled={!finalImage} className="sm:col-span-2 w-full">
                    <Share2 className="mr-2"/> Share Now
                </Button>
                <Button onClick={handleDownload} disabled={!finalImage} variant="outline">
                    <Download className="mr-2"/> Download
                </Button>
            </div>
             <div className="relative mt-4">
                <Input value={shareText} readOnly className="pr-10"/>
                <Button size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => { navigator.clipboard.writeText(shareText); toast({ title: 'Copied promotional text!' }); }}><Copy className="h-4 w-4"/></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
