
'use client';

import * as React from 'react';
import type { Review } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { useArtistPortal } from '../layout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

export default function ArtistReviewsPage() {
    const { artist } = useArtistPortal();
    const [reviews, setReviews] = React.useState<Review[]>([]);

    React.useEffect(() => {
        if (artist?.reviews) {
            setReviews(artist.reviews);
        } else {
            // Mock data if no reviews are on the artist object yet
             const mockReviews: Review[] = [
                { id: 'rev_01', customerName: 'Priya Patel', rating: 5, comment: 'Absolutely stunning work! Made my wedding day perfect.' },
                { id: 'rev_02', customerName: 'Anjali Sharma', rating: 4, comment: 'Great makeup, but was a little late. Overall happy with the result.' },
            ];
            setReviews(mockReviews);
        }
    }, [artist]);
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Your Customer Reviews</CardTitle>
                <CardDescription>
                    Here's what your customers are saying about your work.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 {reviews.length > 0 ? (
                    reviews.map(review => (
                        <div key={review.id} className="border-l-4 border-accent p-4 rounded-r-lg bg-muted/40">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="font-semibold text-lg">{review.customerName}</p>
                                    <p className="text-sm text-muted-foreground italic mt-1">"{review.comment}"</p>
                                </div>
                                <div className="flex items-center gap-1 text-amber-500 shrink-0 ml-4">
                                    <span className="font-bold text-lg">{review.rating}</span>
                                    <Star className="w-5 h-5 fill-current"/>
                                </div>
                            </div>
                        </div>
                    ))
                 ) : (
                    <Alert>
                        <Terminal className="h-4 w-4" />
                        <AlertTitle>No Reviews Yet</AlertTitle>
                        <AlertDescription>
                            You haven't received any customer reviews yet. Complete more bookings to build your reputation!
                        </AlertDescription>
                    </Alert>
                 )}
            </CardContent>
        </Card>
    );
}
