
import type { Artist } from '@/types';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { DollarSign, MapPin, Paintbrush, Star } from 'lucide-react';
import { MehndiIcon } from '@/components/icons';

interface ArtistCardProps {
  artist: Artist;
  onBookingRequest: (artist: Artist) => void;
}

export function ArtistCard({ artist, onBookingRequest }: ArtistCardProps) {
  return (
    <Card className="overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-2xl hover:border-accent">
      <CardHeader className="p-0">
        <Carousel className="w-full">
          <CarouselContent>
            {artist.workImages.map((src, index) => (
              <CarouselItem key={index}>
                <div className="aspect-w-4 aspect-h-3">
                   <Image
                      src={src}
                      alt={`${artist.name}'s work ${index + 1}`}
                      width={600}
                      height={400}
                      className="object-cover w-full h-full"
                      data-ai-hint="mehndi makeup"
                    />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CarouselNext className="right-4 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Carousel>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-xl font-bold text-primary mb-2">{artist.name}</CardTitle>
        <div className="flex items-center text-sm text-muted-foreground mb-3">
          <MapPin className="w-4 h-4 mr-1.5 text-accent" />
          <span>{artist.location}</span>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {artist.services.map((service) => (
            <Badge key={service} variant="secondary" className="gap-1.5 pl-2">
              {service === 'mehndi' ? <MehndiIcon className="w-3.5 h-3.5" /> : <Paintbrush className="w-3.5 h-3.5" />}
              <span className="capitalize">{service}</span>
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="p-4 bg-background/50 flex justify-between items-center">
        <div className="flex flex-col">
            <div className="flex items-center text-lg font-bold text-primary">
                <DollarSign className="w-4 h-4 mr-1" />
                <span>₹{artist.charge.toLocaleString()}</span>
            </div>
            <div className="flex items-center text-amber-500">
                <Star className="w-4 h-4 mr-1 fill-current" />
                <span className="font-bold text-sm">{artist.rating}</span>
            </div>
        </div>
        <Button onClick={() => onBookingRequest(artist)} className="bg-accent hover:bg-accent/90">Book Now</Button>
      </CardFooter>
    </Card>
  );
}
