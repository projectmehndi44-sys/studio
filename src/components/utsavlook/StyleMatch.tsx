
'use client';

import * as React from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { fetchStyleMatch } from '@/app/actions';
import type { StyleMatchOutput } from '@/ai/flows/style-match';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Wand2, Upload } from 'lucide-react';
import Image from 'next/image';
import { MakeupIcon, MehndiIcon } from '../icons';
import { Input } from '../ui/input';

const styleMatchSchema = z.object({
  eventDescription: z.string().min(10, { message: "Please describe your event in a bit more detail." }),
  outfitPhoto: z
    .any()
    .refine((files) => files?.length === 1, "Please upload a photo of your outfit.")
});

type StyleMatchFormValues = z.infer<typeof styleMatchSchema>;

const fileToDataURI = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export function StyleMatch() {
  const [recommendations, setRecommendations] = React.useState<StyleMatchOutput | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<StyleMatchFormValues>({
    resolver: zodResolver(styleMatchSchema),
  });
  
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue('outfitPhoto', event.target.files);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const onSubmit: SubmitHandler<StyleMatchFormValues> = async (data) => {
    setIsLoading(true);
    setRecommendations(null);

    try {
      const imageFile = data.outfitPhoto[0];
      const photoDataUri = await fileToDataURI(imageFile);

      const result = await fetchStyleMatch({
        outfitPhoto: photoDataUri,
        eventDescription: data.eventDescription,
      });

      if (result) {
        setRecommendations(result);
      } else {
        throw new Error("AI could not generate a response.");
      }

    } catch (error) {
      console.error(error);
      toast({
        title: "Something went wrong",
        description: "We couldn't generate a style match at this time. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 p-4 md:p-6">
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
                <FormField
                control={form.control}
                name="outfitPhoto"
                render={() => (
                    <FormItem>
                        <FormLabel className="font-semibold">1. Upload Your Outfit Photo</FormLabel>
                            <div className="relative border-2 border-dashed border-muted-foreground/50 rounded-lg p-4 text-center hover:border-accent cursor-pointer aspect-square flex items-center justify-center">
                            {imagePreview ? (
                                    <Image src={imagePreview} alt="Outfit preview" fill className="object-contain rounded-md p-2"/>
                            ) : (
                                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                        <Upload className="h-10 w-10" />
                                        <p className="mt-2 text-sm">Click to upload or drag & drop</p>
                                        <p className="text-xs">PNG, JPG, WEBP up to 5MB</p>
                                    </div>
                            )}
                            <FormControl>
                                <Input 
                                    type="file" 
                                    className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                                    accept="image/png, image/jpeg, image/webp"
                                    onChange={handleImageChange}
                                />
                            </FormControl>
                        </div>
                        <FormMessage />
                    </FormItem>
                )}
            />
                <FormField
                control={form.control}
                name="eventDescription"
                render={({ field }) => (
                <FormItem>
                    <FormLabel className="font-semibold">2. Describe Your Event</FormLabel>
                    <FormControl>
                    <Textarea
                        placeholder="e.g., 'Attending my best friend's Sangeet at a palace hotel. The theme is royal and glamorous. I want my mehndi to be traditional but not too heavy.'"
                        {...field}
                        rows={5}
                    />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
                <Button type="submit" disabled={isLoading} size="lg" className="w-full bg-accent hover:bg-accent/90">
                {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Your Look...</>
                ) : (
                <><Sparkles className="mr-2 h-4 w-4" /> Get Style Recommendations</>
                )}
            </Button>
            </div>

            <div className="space-y-4">
            <h3 className="font-semibold text-center text-primary">Your Personalized Style Recommendations</h3>
                {isLoading ? (
                <div className="flex justify-center items-center py-16 flex-col gap-4 h-full">
                    <Loader2 className="h-12 w-12 animate-spin text-primary"/>
                    <p className="text-muted-foreground">Our AI is analyzing your style...</p>
                </div>
                ) : recommendations ? (
                    <div className="space-y-6">
                    <Card className="bg-primary/5">
                        <CardHeader className="flex flex-row items-center gap-3">
                            <MehndiIcon className="w-8 h-8 text-primary"/>
                            <CardTitle className="text-xl text-primary">Mehndi Style</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-base text-foreground/90">{recommendations.mehndiRecommendation}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-secondary/20">
                        <CardHeader className="flex flex-row items-center gap-3">
                            <MakeupIcon className="w-8 h-8 text-accent"/>
                            <CardTitle className="text-xl text-accent">Makeup Look</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-base text-foreground/90">{recommendations.makeupRecommendation}</p>
                        </CardContent>
                    </Card>
                    </div>
                ) : (
                <div className="flex items-center justify-center h-full rounded-lg bg-muted/50 p-8 text-center min-h-[200px]">
                    <p className="text-muted-foreground">Your recommendations will appear here once you submit your photo and event details.</p>
                </div>
                )}
            </div>
        </form>
        </Form>
    </div>
  );
}
