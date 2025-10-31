
'use client';

import * as React from 'react';
import type { Artist } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import { IndianRupee, MapPin, Star, CheckCircle, Sparkles } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';

interface ArtistProfileModalProps {
  artist: Artist | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function ArtistProfileModal({ artist, isOpen, onOpenChange }: ArtistProfileModalProps) {

  if (!artist) {
    return null;
  }

  const coverPhoto = artist.coverPhoto || artist.workImages?.[0] || 'https://picsum.photos/seed/cover/1200/400';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="sr-only">Artist Profile: {artist.name}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[85vh] overflow-y-auto">
            <div className="relative h-40 md:h-48 w-full">
              <Image src={coverPhoto} alt={`${artist.name}'s cover photo`} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>
            <div className="px-6 -mt-16 md:-mt-20 relative z-10">
                <div className="flex items-end gap-4">
                     <Avatar className="w-32 h-32 md:w-36 md:h-36 border-4 border-white shadow-lg shrink-0">
                        <AvatarImage src={artist.profilePicture} alt={artist.name} />
                        <AvatarFallback>{artist.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold font-headline text-primary">
                            {artist.name}
                        </h1>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                            <div className="flex items-center text-amber-500">
                                <Star className="w-4 h-4 mr-1 fill-current" />
                                <span className="font-bold text-sm">{artist.rating.toFixed(1)}</span>
                            </div>
                            <div className="flex items-center text-muted-foreground text-sm">
                                <MapPin className="w-4 h-4 mr-1" />
                                <span>{artist.location}</span>
                            </div>
                        </div>
                    </div>
                </div>
                 <div className="flex flex-wrap gap-2 mt-3">
                    {artist.verified && <Badge className="bg-green-100 text-green-800 border-green-300 text-xs px-2 py-0.5"><CheckCircle className="w-3 h-3 mr-1"/>UtsavLook Verified</Badge>}
                    {artist.isFoundersClubMember && <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs"><Sparkles className="w-3 h-3 mr-1"/>Founder's Club</Badge>}
                </div>
            </div>

             <div className="p-6 space-y-6">
                 {artist.reviews && artist.reviews.length > 0 && (
                     <Card>
                        <CardHeader><CardTitle className="text-lg">Recent Reviews</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {artist.reviews.slice(0,2).map((review, index) => (
                                <div key={index} className="flex gap-3">
                                    <div className="flex-grow">
                                        <div className="flex items-center justify-between">
                                            <p className="font-semibold text-sm">{review.customerName}</p>
                                            <div className="flex items-center gap-1 text-amber-500">
                                                <span className="font-bold text-xs">{review.rating}</span>
                                                <Star className="w-3 h-3 fill-current"/>
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground italic">"{review.comment}"</p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                 <Card>
                    <CardHeader><CardTitle className="text-lg">Work Gallery</CardTitle></CardHeader>
                    <CardContent>
                         <Carousel opts={{ align: "start", loop: false }} className="w-full">
                            <CarouselContent className="-ml-2">
                                {(artist.workImages || []).map((src, index) => (
                                    <CarouselItem key={index} className="pl-2 basis-1/2 md:basis-1/3">
                                        <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
                                            <Image src={src} alt={`${artist.name}'s work ${index + 1}`} fill className="object-cover" />
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                         </Carousel>
                    </CardContent>
                </Card>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
