

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
import { IndianRupee, Info, Sparkles, Star, Users, CheckCircle, ShoppingCart } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { ScrollArea } from '../ui/scroll-area';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '../ui/card';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface ServiceSelectionModalProps {
  service: MasterServicePackage;
  artists: Artist[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddToCart: (item: CartItem) => void;
}

export function ServiceSelectionModal({ service, artists, isOpen, onOpenChange, onAddToCart }: ServiceSelectionModalProps) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = React.useState<PackageCategory | null>(null);
  const [view, setView] = React.useState<'tier' | 'artist' | 'success'>('tier');
  const [lastAddedItem, setLastAddedItem] = React.useState<CartItem | null>(null);

  const resetModal = () => {
      setSelectedCategory(null);
      setView('tier');
      setLastAddedItem(null);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Delay reset to allow animation to finish
      setTimeout(resetModal, 300);
    }
    onOpenChange(open);
  }

  React.useEffect(() => {
    // Reset selection when modal is reopened for a new service
    if (isOpen) {
      resetModal();
    }
  }, [isOpen]);

  const handleSelectCategory = (category: PackageCategory) => {
    setSelectedCategory(category);
    setView('artist');
  };

  const handleAddToCartAndShowSuccess = (item: CartItem) => {
      onAddToCart(item);
      setLastAddedItem(item);
      setView('success');
  };

  const handleExpressBooking = () => {
    if (selectedCategory) {
      handleAddToCartAndShowSuccess({
        masterPackage: service,
        category: selectedCategory,
      });
    }
  };
  
  const handleArtistBooking = (artist: Artist) => {
    if (selectedCategory) {
        handleAddToCartAndShowSuccess({
            masterPackage: service,
            category: selectedCategory,
            artist: artist,
        });
    }
  };

  const SuccessView = () => (
    <div className="text-center p-6 flex flex-col items-center gap-4">
        <CheckCircle className="w-16 h-16 text-green-500" />
        <h3 className="text-2xl font-bold">Added to Your Booking!</h3>
        <Card className="text-left w-full">
            <CardContent className="p-4 flex items-center gap-4">
                {lastAddedItem?.category.image && <Image src={lastAddedItem.category.image} alt={lastAddedItem.category.name} width={60} height={60} className="rounded-md" />}
                <div>
                    <p className="font-semibold">{lastAddedItem?.masterPackage.name} ({lastAddedItem?.category.name})</p>
                    {lastAddedItem?.artist && <p className="text-sm text-muted-foreground">with {lastAddedItem.artist.name}</p>}
                </div>
            </CardContent>
        </Card>
        <div className="flex flex-col sm:flex-row gap-2 w-full mt-4">
             <Button size="lg" className="w-full" onClick={() => router.push('/cart')}>
                <ShoppingCart className="mr-2 h-4 w-4"/>
                Go to Cart &amp; Book
             </Button>
             <Button size="lg" variant="outline" className="w-full" onClick={() => handleOpenChange(false)}>
                Add More Services
             </Button>
        </div>
    </div>
  );

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
             <Button variant="outline" onClick={() => setView('tier')}>&larr; Back to Tiers</Button>
            
            <div className="flex items-center gap-4 p-2 rounded-lg bg-muted">
                {category.image && <Image src={category.image} alt={category.name} width={64} height={64} className="rounded-md object-cover"/>}
                <div>
                    <h3 className="text-xl font-bold">You selected: "{category.name}"</h3>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                </div>
            </div>

            <h4 className="text-lg font-bold text-center">Choose an Artist</h4>
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

  const renderContent = () => {
    switch (view) {
        case 'tier':
             return (
                 <div className="py-4">
                    <h3 className="text-lg font-semibold text-center mb-4">Select a Tier</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {service.categories.map(category => (
                            <Card key={category.name} className="flex flex-col overflow-hidden">
                                {category.image && (
                                    <div className="relative w-full aspect-video">
                                        <Image src={category.image} alt={category.name} layout="fill" className="object-cover"/>
                                    </div>
                                )}
                                <CardHeader>
                                    <CardTitle className="text-accent">{category.name}</CardTitle>
                                    <CardDescription>{category.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow"></CardContent>
                                <CardFooter className="flex flex-col items-start gap-2 mt-auto p-4">
                                    <p className="text-xs text-muted-foreground">Starts from</p>
                                    <p className="font-bold text-xl flex items-center"><IndianRupee className="w-4 h-4 mr-1"/>{category.basePrice.toLocaleString()}</p>
                                    <Button className="w-full" onClick={() => handleSelectCategory(category)}>Select {category.name}</Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </div>
            );
        case 'artist':
            if (!selectedCategory) return null; // Should not happen
            return (
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
                                <Button variant="link" onClick={() => setView('tier')}>Back to Tiers</Button>
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
            );
        case 'success':
            return <SuccessView />;
        default:
            return null;
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-primary font-bold text-2xl">{service.name}</DialogTitle>
          <DialogDescription>
            {service.description}
          </DialogDescription>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
