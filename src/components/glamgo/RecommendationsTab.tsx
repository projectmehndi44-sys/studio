'use client';

import * as React from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { fetchRecommendations } from '@/app/actions';
import type { Artist } from '@/types';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ArtistCard } from './ArtistCard';
import { Loader2, Sparkles, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const recommendationSchema = z.object({
  stylePreferences: z.string().min(10, { message: "Please describe your style in a bit more detail." }),
  location: z.string().optional(),
});

type RecommendationFormValues = z.infer<typeof recommendationSchema>;

interface RecommendationsTabProps {
  onBookingRequest: (artist: Artist) => void;
  isCustomerLoggedIn: boolean;
  onLoginRequest: () => void;
}

export function RecommendationsTab({ onBookingRequest, isCustomerLoggedIn, onLoginRequest }: RecommendationsTabProps) {
  const [recommendedArtists, setRecommendedArtists] = React.useState<Artist[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<RecommendationFormValues>({
    resolver: zodResolver(recommendationSchema),
    defaultValues: {
      stylePreferences: '',
      location: '',
    },
  });

  const onSubmit: SubmitHandler<RecommendationFormValues> = async (data) => {
    setIsLoading(true);
    setRecommendedArtists([]);
    try {
      const results = await fetchRecommendations({
        userHistory: 'The user has previously booked bridal mehndi and has liked glam makeup styles.', // Mocked history
        stylePreferences: data.stylePreferences,
        location: data.location,
      });
      setRecommendedArtists(results);
      if (results.length === 0) {
        toast({
          title: "No specific recommendations found",
          description: "Try broadening your search criteria. Meanwhile, check out our general listings!",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Something went wrong",
        description: "We couldn't fetch recommendations at this time. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isCustomerLoggedIn) {
    return (
        <div className="text-center py-16 text-card-foreground bg-card rounded-lg shadow-md max-w-lg mx-auto mt-4">
            <Sparkles className="mx-auto h-12 w-12 text-primary mb-4" />
            <h2 className="text-2xl font-bold mb-2">Get Personalized AI Recommendations!</h2>
            <p className="text-muted-foreground mb-6">Log in to get artist suggestions tailored just for you.</p>
            <Button onClick={onLoginRequest}>
                <LogIn className="mr-2 h-4 w-4" />
                Login to Get Recommendations
            </Button>
        </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="max-w-3xl mx-auto shadow-lg border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl font-bold text-primary">
            <Sparkles className="w-6 h-6 text-accent" />
            Personalized Recommendations
          </CardTitle>
          <CardDescription>
            Describe your desired style, and our AI will find the perfect artists for you. The more detail, the better!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="stylePreferences"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Style & Occasion</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., 'A simple, elegant mehndi for a sangeet ceremony' or 'Bold, glamorous makeup for a wedding reception with a red lehenga.'"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Location (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 'South Mumbai'" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full bg-accent hover:bg-accent/90">
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Finding Artists...</>
                ) : (
                  'Get Recommendations'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex justify-center items-center py-16 flex-col gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary"/>
            <p className="text-muted-foreground">Our AI is curating your matches...</p>
        </div>
      )}

      {recommendedArtists.length > 0 && (
         <>
          <h2 className="text-center font-headline text-5xl text-primary">Your Matches</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recommendedArtists.map((artist) => (
              <ArtistCard key={artist.id} artist={artist} onBookingRequest={onBookingRequest} />
            ))}
          </div>
         </>
      )}
    </div>
  );
}
