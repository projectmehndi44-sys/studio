

'use client';

import * as React from 'react';
import type { Artist } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { IndianRupee, MapPin, Star, X, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { MakeupIcon, MehndiIcon, PhotographyIcon } from '@/components/icons';

interface ArtistProfileModalProps {
  artist: Artist | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const getServiceIcon = (service: Artist['services'][number]) => {
    switch (service) {
        case 'mehndi':
            return <MehndiIcon className="w-3.5 h-3.5" />;
        case 'makeup':
            return <MakeupIcon className="w-3.5 h-3.5" />;
        case 'photography':
            return <PhotographyIcon className="w-3.5 h-3.5" />;
        default:
            return null;
    }
}

export function ArtistProfileModal({ artist, isOpen, onOpenChange }: ArtistProfileModalProps) {
  if (!artist) return null;

  const primaryService = artist.services[0];
  const baseCharge = artist.charges?.[primaryService] || artist.charges?.mehndi || artist.charges?.makeup || artist.charges?.photography || artist.charge;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0">
        <div className="flex flex-col group">
          <Carousel className="w-full">
            <CarouselContent>
              {artist.workImages.map((src, index) => (
                <CarouselItem key={index}>
                  <div className="aspect-w-16 aspect-h-9">
                     <Image
                        src={src}
                        alt={`${artist.name}'s work ${index + 1}`}
                        width={800}
                        height={450}
                        className="object-cover w-full h-full rounded-t-lg"
                        data-ai-hint="mehndi makeup"
                      />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CarouselNext className="right-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Carousel>
          <div className="p-6">
            <DialogHeader>
                <div className="flex justify-between items-start">
                    <DialogTitle className="text-2xl font-bold text-primary mb-2">{artist.name}</DialogTitle>
                    <div className="flex flex-col gap-1 items-end">
                        {artist.verified && (
                             <Badge className="bg-green-600 text-white pl-2">
                                <CheckCircle className="w-3.5 h-3.5 mr-1"/>
                                UtsavLook Verified
                            </Badge>
                        )}
                         {artist.isFoundersClubMember && (
                            <Badge className="bg-amber-500 text-white pl-2">
                                <Star className="w-3.5 h-3.5 mr-1 fill-current"/>
                                Founder's Club
                            </Badge>
                        )}
                    </div>
                </div>
            </DialogHeader>
            <div className="flex items-center text-sm text-muted-foreground mb-3">
              <MapPin className="w-4 h-4 mr-1.5 text-accent" />
              <span>{artist.location}</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {artist.services.map((service) => (
                <Badge key={service} variant="secondary" className="gap-1.5 pl-2">
                  {getServiceIcon(service)}
                  <span className="capitalize">{service}</span>
                </Badge>
              ))}
            </div>
             <div className="flex items-center text-amber-500">
                <Star className="w-4 h-4 mr-1 fill-current" />
                <span className="font-bold text-sm">{artist.rating} rating</span>
            </div>
          </div>
          <DialogFooter className="p-6 pt-0 bg-background/50 flex sm:justify-between items-center w-full">
             <div className="text-lg font-bold text-primary">
                <span className="text-xs font-normal text-muted-foreground">Base charge from </span>
                <span className="flex items-center">
                    <IndianRupee className="w-4 h-4 mr-1" />
                    <span>{baseCharge.toLocaleString()}</span>
                </span>
            </div>
            <DialogClose asChild>
                <Button type="button" variant="secondary">
                   Close
                </Button>
            </DialogClose>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
