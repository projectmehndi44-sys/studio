
'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Artist, MasterServicePackage } from '@/lib/types';
import { getArtist, getMasterServices } from '@/lib/services';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import { IndianRupee, MapPin, Star, CheckCircle, Sparkles, Mail, Phone, PackageSearch, MessageSquare, ArrowLeft } from 'lucide-react';
import { Header } from '@/components/utsavlook/Header';
import { Footer } from '@/components/utsavlook/Footer';
import { ServiceSelectionModal } from '@/components/utsavlook/ServiceSelectionModal';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';

export default function ArtistPublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const artistId = params.id as string;

  const [artist, setArtist] = React.useState<Artist | null>(null);
  const [masterServices, setMasterServices] = React.useState<MasterServicePackage[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isServiceModalOpen, setIsServiceModalOpen] = React.useState(false);
  const [selectedService, setSelectedService] = React.useState<MasterServicePackage | null>(null);

  React.useEffect(() => {
    if (artistId) {
      Promise.all([getArtist(artistId), getMasterServices()])
        .then(([artistData, servicesData]) => {
          if (artistData) {
            setArtist(artistData);
            const artistOfferedServices = servicesData.filter(service => artistData.services.includes(service.service));
            setMasterServices(artistOfferedServices);
          } else {
            router.push('/');
          }
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
          router.push('/');
        });
    }
  }, [artistId, router]);

  const handleAddToCart = (item: any) => {
    // This is a placeholder. In a real app, you would have cart context here.
    console.log('Add to cart:', item);
    setIsServiceModalOpen(false);
  };
  
  const handleServiceSelect = (service: MasterServicePackage) => {
      setSelectedService(service);
      setIsServiceModalOpen(true);
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading artist profile...</div>;
  }

  if (!artist) {
    return <div className="flex justify-center items-center h-screen">Artist not found.</div>;
  }
  
  const coverPhoto = artist.coverPhoto || artist.workImages?.[0] || 'https://picsum.photos/seed/cover/1200/400';

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Header isCustomerLoggedIn={false} onCustomerLogout={() => {}} customer={null} cartCount={0} />
      <main className="flex-1">
        
        {/* --- Profile Header --- */}
        <Card className="rounded-none shadow-none border-0">
          <CardContent className="p-0">
            <div className="relative h-40 md:h-56 w-full">
              <Image src={coverPhoto} alt={`${artist.name}'s cover photo`} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
               <Button onClick={() => router.back()} variant="outline" className="absolute top-4 left-4 z-10 bg-background/80 hover:bg-background">
                <ArrowLeft className="w-4 h-4 mr-2"/>
                Back
              </Button>
            </div>
            <div className="container mx-auto px-4 -mt-16 md:-mt-20 relative z-10">
                <div className="relative">
                     <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-white shadow-lg shrink-0">
                        <AvatarImage src={artist.profilePicture} alt={artist.name} />
                        <AvatarFallback>{artist.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="pt-4 pl-0 md:pl-48 md:absolute md:bottom-2">
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
                         <div className="flex flex-wrap gap-2 mt-3">
                            {artist.verified && <Badge className="bg-green-100 text-green-800 border-green-300 text-xs px-2 py-0.5"><CheckCircle className="w-3 h-3 mr-1"/>UtsavLook Verified</Badge>}
                            {artist.isFoundersClubMember && <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs"><Sparkles className="w-3 h-3 mr-1"/>Founder's Club</Badge>}
                        </div>
                    </div>
                </div>
            </div>
          </CardContent>
        </Card>

        {/* --- Profile Body --- */}
        <section className="w-full py-12">
          <div className="container px-4 md:px-6 grid gap-12 lg:grid-cols-3">
            
            {/* --- Main Content (Services & Gallery) --- */}
            <div className="lg:col-span-2 space-y-8">
                {masterServices.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Services Offered</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Carousel opts={{ align: "start" }} className="w-full">
                                <CarouselContent className="-ml-4">
                                    {masterServices.map(service => {
                                      const lowestPrice = Math.min(...service.categories.map(c => c.basePrice));
                                      return (
                                        <CarouselItem key={service.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                                            <Card className="overflow-hidden flex flex-col h-full hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleServiceSelect(service)}>
                                                <div className="relative aspect-video w-full">
                                                    <Image src={service.image} alt={service.name} fill className="object-cover" />
                                                </div>
                                                <CardHeader className="p-4">
                                                    <CardTitle className="text-lg text-primary">{service.name}</CardTitle>
                                                </CardHeader>
                                                <CardContent className="p-4 pt-0 flex-grow">
                                                    <CardDescription className="text-sm line-clamp-2">{service.description}</CardDescription>
                                                </CardContent>
                                                <CardFooter className="p-4 bg-muted/50 mt-auto flex justify-between items-center">
                                                    <span className="text-sm text-muted-foreground flex items-center"><IndianRupee className="w-3.5 h-3.5 mr-0.5"/> From {lowestPrice.toLocaleString()}</span>
                                                    <Button size="sm" variant="outline"><PackageSearch className="w-4 h-4"/></Button>
                                                </CardFooter>
                                            </Card>
                                        </CarouselItem>
                                    )})}
                                </CarouselContent>
                            </Carousel>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader><CardTitle>Work Gallery</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {(artist.workImages || []).map((src, index) => (
                             <div key={index} className="relative aspect-[4/3] shadow-brand hover:shadow-brand-lg transition-shadow rounded-lg overflow-hidden">
                                <Image src={src} alt={`${artist.name}'s work ${index + 1}`} fill className="object-cover" />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* --- Sidebar (Details & Reviews) --- */}
            <div className="lg:col-span-1 space-y-6">
                <Card>
                     <CardHeader><CardTitle>Artist Details</CardTitle></CardHeader>
                     <CardContent className="space-y-3 text-sm">
                         {artist.showContactInfo ? (
                             <>
                                <div className="flex items-center gap-3">
                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                    <span>{artist.phone}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Mail className="w-4 h-4 text-muted-foreground" />
                                    <span>{artist.email}</span>
                                </div>
                             </>
                         ) : (
                             <div className="text-center text-sm text-muted-foreground p-4 bg-muted rounded-md">
                                 Contact information is shared after a booking is confirmed.
                             </div>
                         )}
                     </CardContent>
                </Card>
                {artist.reviews && artist.reviews.length > 0 && (
                     <Card>
                        <CardHeader><CardTitle>Customer Reviews</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {artist.reviews.slice(0,3).map((review, index) => (
                                <div key={index} className="flex gap-4">
                                     <Avatar className="w-10 h-10 border mt-1">
                                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${review.customerName}`} />
                                        <AvatarFallback>{review.customerName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-grow">
                                        <div className="flex items-center justify-between">
                                            <p className="font-semibold">{review.customerName}</p>
                                            <div className="flex items-center gap-1 text-amber-500">
                                                <span className="font-bold text-sm">{review.rating}</span>
                                                <Star className="w-4 h-4 fill-current"/>
                                            </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground italic">"{review.comment}"</p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
       {selectedService && (
            <ServiceSelectionModal
                isOpen={isServiceModalOpen}
                onOpenChange={setIsServiceModalOpen}
                service={selectedService}
                artists={[artist]} // Pass only the current artist
                onAddToCart={handleAddToCart}
            />
        )}
    </div>
  );
}
