
import type { Artist } from '@/lib/types';
import Image from 'next/image';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IndianRupee, Star, CheckCircle } from 'lucide-react';
import { MakeupIcon, MehndiIcon, PhotographyIcon } from '@/components/icons';
import Link from 'next/link';

interface ArtistCardProps {
  artist: Artist;
  onViewProfile?: (artist: Artist) => void;
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

export function ArtistCard({ artist, onViewProfile }: ArtistCardProps) {
  const primaryService = artist.services?.[0];
  const baseCharge = (primaryService && artist.charges?.[primaryService]) || artist.charge || 0;
  const primaryWorkImage = artist.workImages?.[0] || 'https://picsum.photos/seed/placeholder/800/600';

  const handleViewProfileClick = (e: React.MouseEvent) => {
    if (onViewProfile) {
      e.preventDefault();
      onViewProfile(artist);
    }
  };

  return (
    <Card className="overflow-hidden flex flex-col group transition-all duration-300 shadow-brand hover:shadow-brand-lg hover:border-accent">
      <CardContent className="p-0 relative">
        <Link href={`/artist/${artist.id}`} onClick={handleViewProfileClick} className="aspect-[4/3] relative block">
          <Image
            src={primaryWorkImage}
            alt={`${artist.name}'s work`}
            fill
            className="object-cover"
            data-ai-hint="mehndi makeup"
          />
           <div className="absolute top-2 right-2 flex flex-col gap-1 items-end z-10">
            {artist.verified && (
                <Badge className="bg-green-600 text-white pl-2 border-green-700 shadow-md">
                    <CheckCircle className="w-3.5 h-3.5 mr-1"/>
                    Verified
                </Badge>
            )}
            {artist.isFoundersClubMember && (
                <Badge className="bg-amber-500 text-white pl-2 border-amber-600 shadow-md">
                    <Star className="w-3.5 h-3.5 mr-1 fill-current"/>
                    Founder's Club
                </Badge>
            )}
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-20">
             <Image
                src={artist.profilePicture}
                alt={artist.name}
                width={80}
                height={80}
                className="rounded-full border-4 border-white object-cover shadow-lg aspect-square"
            />
          </div>
        </Link>
      </CardContent>

      <div className="pt-12 p-4 flex flex-col flex-grow text-center">
        <h3 className="text-xl font-headline text-primary font-bold">{artist.name}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {artist.location}
        </p>

        <div className="flex flex-wrap gap-2 justify-center my-3">
          {(artist.services || []).map((service) => (
            <Badge key={service} variant="secondary" className="gap-1.5 pl-2">
              {getServiceIcon(service)}
              <span className="capitalize">{service}</span>
            </Badge>
          ))}
        </div>
        
        <div className="flex justify-around items-center mt-auto pt-3 border-t">
           <div className="flex flex-col items-center">
             <span className="text-xs text-muted-foreground">Rating</span>
             <div className="flex items-center font-bold text-amber-500">
                <Star className="w-4 h-4 mr-1 fill-current" />
                <span>{artist.rating.toFixed(1)}</span>
            </div>
           </div>
           <div className="flex flex-col items-center">
             <span className="text-xs text-muted-foreground">Starts From</span>
             <div className="flex items-center font-bold text-primary">
                <IndianRupee className="w-4 h-4" />
                <span>{baseCharge.toLocaleString()}</span>
            </div>
           </div>
        </div>
      </div>
      
      <CardFooter className="p-2 bg-background/50">
        <Button asChild className="w-full bg-accent hover:bg-accent/90" size="lg">
            <Link href={`/artist/${artist.id}`} onClick={handleViewProfileClick}>View Profile</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
