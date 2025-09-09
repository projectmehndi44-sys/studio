

'use client';

import * as React from 'react';
import type { Artist, MasterServicePackage, PackageCategory, CartItem } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { IndianRupee, Info, Sparkles, Star, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { ScrollArea } from '../ui/scroll-area';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';

interface ServiceSelectionModalProps {
  service: MasterServicePackage;
  artists: Artist[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddToCart: (item: CartItem) => void;
}

export function ServiceSelectionModal({ service, artists, isOpen, onOpenChange, onAddToCart }: ServiceSelectionModalProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<PackageCategory | null>(null);

  React.useEffect(() => {
    // Reset selection when modal is reopened for a new service
    if (isOpen) {
      setSelectedCategory(null);
    }
  }, [isOpen]);

  const handleSelectCategory = (category: PackageCategory) => {
    setSelectedCategory(category);
  };

  const handleExpressBooking = () => {
    if (selectedCategory) {
      onAddToCart({
        masterPackage: service,
        category: selectedCategory,
      });
    }
  };
  
  const handleArtistBooking = (artist: Artist) => {
    if (selectedCategory) {
        onAddToCart({
            masterPackage: service,
            category: selectedCategory,
            artist: artist,
        });
    }
  };

  const ArtistsForTier = ({ category }: { category: PackageCategory }) => {
    const offeringArtists = artists.filter(artist =>
        artist.serviceOfferings?.some(offering =>
            offering.masterPackageId === service.id &&
            offering.categoryName === category.name &&
            offering.isEnabled
        )
    );

    return (
        <div className="space-y-4">
             <Button variant="outline" onClick={() => setSelectedCategory(null)}>&larr; Back to Tiers</Button>
            <h3 className="text-xl font-bold text-center">Choose an Artist for "{category.name}" Tier</h3>
            <ScrollArea className="h-72">
                 <div className="space-y-3 pr-4">
                 {offeringArtists.length > 0 ? (
                    offeringArtists.map(artist => {
                        const offering = artist.serviceOfferings?.find(o => o.masterPackageId === service.id && o.categoryName === category.name);
                        return (
                             <div key={artist.id} className="flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={artist.profilePicture} alt={artist.name}/>
                                        <AvatarFallback>{artist.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{artist.name}</p>
                                        <div className="flex items-center text-xs text-amber-600">
                                            <Star className="w-3 h-3 mr-1 fill-current"/>
                                            <span>{artist.rating}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="font-bold flex items-center"><IndianRupee className="w-3.5 h-3.5 mr-0.5"/>{offering?.artistPrice.toLocaleString()}</p>
                                        <p className="text-xs text-muted-foreground">Total Price</p>
                                    </div>
                                    <Button size="sm" onClick={() => handleArtistBooking(artist)}>Select</Button>
                                </div>
                            </div>
                        )
                    })
                 ) : (
                    <Alert>
                        <Users className="h-4 w-4" />
                        <AlertTitle>No Artists Found</AlertTitle>
                        <AlertDescription>
                            No artists currently offer this specific service tier. You can still make an express booking at the base price.
                        </AlertDescription>
                    </Alert>
                 )}
                </div>
            </ScrollArea>
        </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-primary font-bold text-2xl">{service.name}</DialogTitle>
          <DialogDescription>
            {service.description}
          </DialogDescription>
        </DialogHeader>
        
        {!selectedCategory ? (
            // Tier Selection View
            <div className="py-4">
                <h3 className="text-lg font-semibold text-center mb-4">Select a Tier</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {service.categories.map(category => (
                        <Card key={category.name} className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="text-accent">{category.name}</CardTitle>
                                <CardDescription>{category.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow"></CardContent>
                            <CardFooter className="flex flex-col items-start gap-2 mt-auto">
                                <p className="text-xs text-muted-foreground">Starts from</p>
                                <p className="font-bold text-xl flex items-center"><IndianRupee className="w-4 h-4 mr-1"/>{category.basePrice.toLocaleString()}</p>
                                <Button className="w-full" onClick={() => handleSelectCategory(category)}>Select {category.name}</Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        ) : (
            // Artist/Booking Selection View
            <div className="py-4">
                <Tabs defaultValue="express" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="express"><Sparkles className="mr-2 h-4 w-4"/>Express Booking</TabsTrigger>
                    <TabsTrigger value="choose"><Users className="mr-2 h-4 w-4"/>Choose Artist</TabsTrigger>
                </TabsList>
                <TabsContent value="express">
                    <Card className="text-center p-6 space-y-4">
                         <CardHeader>
                            <CardTitle>Book at the Best Price</CardTitle>
                             <CardDescription>We'll assign a top-rated, available artist for you at the standardized base price.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-4xl font-bold flex items-center justify-center text-primary"><IndianRupee className="w-7 h-7 mr-1"/>{selectedCategory.basePrice.toLocaleString()}</p>
                            <Button size="lg" className="w-full mt-4" onClick={handleExpressBooking}>Book Now &amp; Let Us Assign</Button>
                            <Button variant="link" onClick={() => setSelectedCategory(null)}>Back to Tiers</Button>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="choose">
                     <Card className="p-6">
                        <ArtistsForTier category={selectedCategory} />
                    </Card>
                </TabsContent>
                </Tabs>
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
