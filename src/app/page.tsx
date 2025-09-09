
'use client';

import * as React from 'react';
import type { Artist, ServicePackage, Customer, CartItem } from '@/types';
import { artists as initialArtists } from '@/lib/data';
import { masterServices } from '@/lib/packages-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Search,
  LogIn,
  UserPlus,
  Palette,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Header } from '@/components/glamgo/Header';
import { ArtistCard } from '@/components/glamgo/ArtistCard';
import { ArtistRegistrationModal } from '@/components/glamgo/ArtistRegistrationModal';
import { CustomerRegistrationModal } from '@/components/glamgo/CustomerRegistrationModal';
import { CustomerLoginModal } from '@/components/glamgo/CustomerLoginModal';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay"
import Image from 'next/image';
import { Packages } from '@/components/glamgo/Packages';
import { MehndiIcon, MakeupIcon, PhotographyIcon } from '@/components/icons';
import { useRouter, useSearchParams } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInactivityTimeout } from '@/hooks/use-inactivity-timeout';
import { RecommendationsTab } from '@/components/glamgo/RecommendationsTab';
import { ServiceSelectionModal } from '@/components/glamgo/ServiceSelectionModal';


const galleryImages = [
    { src: 'https://picsum.photos/600/400?random=101', alt: 'Intricate bridal mehndi', hint: 'bridal mehndi' },
    { src: 'https://picsum.photos/600/400?random=102', alt: 'Glamorous makeup look', hint: 'glamorous makeup' },
    { src: 'https://picsum.photos/600/400?random=103', alt: 'Arabic mehndi design', hint: 'arabic mehndi' },
    { src: 'https://picsum.photos/600/400?random=107', alt: 'Full hand traditional mehndi', hint: 'traditional mehndi' },
    { src: 'https://picsum.photos/600/400?random=104', alt: 'Natural makeup for a daytime event', hint: 'natural makeup' },
    { src: 'https://picsum.photos/600/400?random=105', alt: 'Minimalist mehndi pattern', hint: 'minimalist mehndi' },
    { src: 'https://picsum.photos/600/400?random=108', alt: 'Peacock feather mehndi design', hint: 'peacock mehndi' },
    { src: 'https://picsum.photos/600/400?random=106', alt: 'Bold party makeup', hint: 'party makeup' },
    { src: 'https://picsum.photos/600/400?random=109', alt: 'Simple finger mehndi design', hint: 'finger mehndi' },
];

const backgroundImages = [
  'https://picsum.photos/1200/800?random=201',
  'https://picsum.photos/1200/800?random=202',
  'https://picsum.photos/1200/800?random=203',
  'https://picsum.photos/1200/800?random=204',
];


export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [artists, setArtists] = React.useState<Artist[]>([]);
  const [allPackages, setAllPackages] = React.useState<ServicePackage[]>([]);
  const [filteredArtists, setFilteredArtists] =
    React.useState<Artist[]>([]);
  const [isArtistRegistrationModalOpen, setIsArtistRegistrationModalOpen] =
    React.useState(false);
  const [isCustomerRegistrationModalOpen, setIsCustomerRegistrationModalOpen] = React.useState(false);
  const [isCustomerLoginModalOpen, setIsCustomerLoginModalOpen] = React.useState(false);
  
  const [isCustomerLoggedIn, setIsCustomerLoggedIn] = React.useState(false);
  const [customer, setCustomer] = React.useState<Customer | null>(null);

  const [cart, setCart] = React.useState<CartItem[]>([]);

  // State for the service selection modal
  const [isServiceModalOpen, setIsServiceModalOpen] = React.useState(false);
  const [selectedService, setSelectedService] = React.useState<ServicePackage | null>(null);

  const { toast } = useToast();

  // Filter state
  const [location, setLocation] = React.useState('');
  const [serviceType, setServiceType] = React.useState<'mehndi' | 'makeup' | 'photography' | 'all'>('all');
  const [priceRange, setPriceRange] = React.useState([20000]);
  const [selectedStyles, setSelectedStyles] = React.useState<string[]>([]);

  const [currentBgIndex, setCurrentBgIndex] = React.useState(0);
  
  const allStyleTags = React.useMemo(() => {
    const tags = new Set<string>();
    artists
      .filter(artist => serviceType === 'all' || artist.services.includes(serviceType))
      .forEach(artist => artist.styleTags.forEach(tag => tags.add(tag)));
    return Array.from(tags);
  }, [artists, serviceType]);


  const getArtists = React.useCallback((): Artist[] => {
    const storedArtists = localStorage.getItem('artists');
    const localArtists: Artist[] = storedArtists ? JSON.parse(storedArtists) : [];
    const allArtistsMap = new Map<string, Artist>();
    initialArtists.forEach(a => allArtistsMap.set(a.id, a));
    localArtists.forEach(a => allArtistsMap.set(a.id, a));
    return Array.from(allArtistsMap.values());
  }, []);

  const handleCustomerLogout = React.useCallback(() => {
    setIsCustomerLoggedIn(false);
    setCustomer(null);
    setCart([]);
    localStorage.removeItem('currentCustomerId');
    localStorage.removeItem('cart');
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
  }, [toast]);
  
  useInactivityTimeout(isCustomerLoggedIn ? handleCustomerLogout : () => {});


  const fetchData = React.useCallback(() => {
    setArtists(getArtists());

    const storedPackages = localStorage.getItem('masterServices');
    setAllPackages(storedPackages ? JSON.parse(storedPackages) : masterServices);

    const customerId = localStorage.getItem('currentCustomerId');
    if (customerId) {
        const storedCustomers = localStorage.getItem('customers');
        const allCustomers: Customer[] = storedCustomers ? JSON.parse(storedCustomers) : [];
        const currentCustomer = allCustomers.find(c => c.id === customerId);
        if (currentCustomer) {
            setIsCustomerLoggedIn(true);
            setCustomer(currentCustomer);
            const storedCart = localStorage.getItem(`cart_${customerId}`);
            setCart(storedCart ? JSON.parse(storedCart) : []);
        }
    } else {
        setIsCustomerLoggedIn(false);
        setCustomer(null);
        setCart([]);
    }
  }, [getArtists]);

  React.useEffect(() => {
    fetchData();

    const intervalId = setInterval(() => {
      setCurrentBgIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length);
    }, 5000); 
    
    window.addEventListener('storage', fetchData);

    return () => {
        clearInterval(intervalId);
        window.removeEventListener('storage', fetchData);
    };
  }, [fetchData]);
  
  React.useEffect(() => {
    applyFilters();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artists, serviceType]);

  const handleBookingRequest = (artist: Artist) => {
    if (!isCustomerLoggedIn) {
        setIsCustomerLoginModalOpen(true);
        toast({ title: 'Please Login', description: 'You need to be logged in to book an artist.' });
        return;
    }
    router.push(`/book?artistId=${artist.id}`);
  };
  
  const handleAddToCart = (item: CartItem) => {
    if (!isCustomerLoggedIn) {
        setIsCustomerLoginModalOpen(true);
        toast({ title: 'Please Login', description: 'You need to be logged in to add services to your booking.' });
        return;
    }
    
    const newCart = [...cart, item];
    setCart(newCart);
    localStorage.setItem(`cart_${customer?.id}`, JSON.stringify(newCart));

    toast({
        title: "Service Added!",
        description: `${item.masterPackage.name} (${item.category.name}) has been added to your selection.`,
        action: (
            <Link href="/book">
                <Button variant="secondary" size="sm">View Cart</Button>
            </Link>
        ),
    });
    setIsServiceModalOpen(false);
  };

  const handleArtistRegister = () => {
    setIsArtistRegistrationModalOpen(true);
  };

  const handleCustomerRegister = () => {
    setIsCustomerRegistrationModalOpen(true);
  };

  const handleCustomerLogin = () => {
    setIsCustomerLoginModalOpen(true);
  };
  
  const onSuccessfulLogin = (customer: Customer) => {
    setIsCustomerLoggedIn(true);
    setCustomer(customer);
    setIsCustomerLoginModalOpen(false);
    setIsCustomerRegistrationModalOpen(false);
    const storedCart = localStorage.getItem(`cart_${customer.id}`);
    setCart(storedCart ? JSON.parse(storedCart) : []);
    setTimeout(() => {
        toast({
            title: 'Login Successful',
            description: `Welcome back, ${customer.name}!`,
        });
    }, 0);
  }

  const applyFilters = React.useCallback(() => {
    let currentArtists = artists;

    if (serviceType !== 'all') {
      currentArtists = currentArtists.filter(
        (artist) => artist.services.includes(serviceType)
      );
    }
    
    if (location) {
      currentArtists = currentArtists.filter((artist) =>
        artist.location.toLowerCase().includes(location.toLowerCase())
      );
    }
    
    if (selectedStyles.length > 0) {
        currentArtists = currentArtists.filter(artist => 
            selectedStyles.every(style => artist.styleTags.includes(style))
        );
    }

    setFilteredArtists(currentArtists);
  }, [location, serviceType, artists, selectedStyles]);
  
  React.useEffect(() => {
    applyFilters();
  }, [applyFilters]);


  const resetFilters = () => {
    setLocation('');
    setPriceRange([20000]);
    setSelectedStyles([]);
  };
  
  const handleStyleChange = (style: string) => {
      setSelectedStyles(prev => 
          prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]
      )
  }

  const ArtistFinder = ({ service }: { service: 'mehndi' | 'makeup' | 'photography' | 'all' }) => {
      const serviceToFilter = service === 'all' ? serviceType : service;
      return (
        <div className="space-y-8">
            <h2 className="text-center font-headline text-5xl text-primary mb-8 capitalize">{service} Artists</h2>
            <Card className="my-4 border-2 border-accent/20 shadow-lg bg-background/80 backdrop-blur-sm">
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 items-end">
                        <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                            id="location"
                            placeholder="City or pin code..."
                            className="pl-9"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            />
                        </div>
                        </div>
                        <div className="space-y-2 lg:col-span-2">
                        <Label htmlFor="price">Price Range (Max): <span className="font-bold text-primary">₹{priceRange[0].toLocaleString()}</span></Label>
                        <Slider
                            id="price"
                            max={20000}
                            min={500}
                            step={500}
                            value={priceRange}
                            onValueChange={setPriceRange}
                            />
                        </div>
                        <Button onClick={resetFilters} variant="ghost" className="w-full">
                            Reset Filters
                        </Button>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                        <Label>Filter by Style</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {allStyleTags.map(tag => (
                                <div key={tag} className="flex items-center space-x-2">
                                    <Checkbox id={tag} checked={selectedStyles.includes(tag)} onCheckedChange={() => handleStyleChange(tag)} />
                                    <label htmlFor={tag} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize">{tag}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {filteredArtists.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredArtists.map((artist) => (
                    <ArtistCard
                    key={artist.id}
                    artist={artist}
                    onBookingRequest={handleBookingRequest}
                    />
                ))}
                </div>
            ) : (
                <div className="text-center py-16">
                <p className="text-lg text-muted-foreground">No artists found matching your criteria.</p>
                </div>
            )}
            </div>
        );
  }

  return (
    <div className="flex min-h-screen w-full flex-col relative">
       {cart.length > 0 && (
         <div className="fixed bottom-8 right-8 z-50">
             <Link href="/book">
                <Button size="lg" className="rounded-full shadow-lg text-lg">
                    <ShoppingBag className="mr-2 h-6 w-6"/>
                    View Cart ({cart.length})
                </Button>
            </Link>
         </div>
       )}
      <div className="fixed inset-0 -z-10 h-full w-full">
          {backgroundImages.map((src, index) => (
              <Image
                  key={src}
                  src={src}
                  alt="Background Image"
                  fill
                  className={cn(
                      'object-cover transition-opacity duration-1000 ease-in-out',
                      index === currentBgIndex ? 'opacity-20' : 'opacity-0'
                  )}
                  priority={index === 0}
                  data-ai-hint="mehndi makeup"
              />
          ))}
      </div>
      <Header 
        isCustomerLoggedIn={isCustomerLoggedIn}
        onCustomerLogout={handleCustomerLogout}
        customer={customer}
        cartCount={cart.length}
      />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="text-center">
            <h1 className="font-headline text-5xl font-bold text-primary md:text-7xl">
                Mehendi<span className="text-accent">f</span>y
            </h1>
            <p className="mt-2 font-dancing-script text-2xl text-foreground/90">Artistry at Your Fingertips</p>
            <div className="mt-4 font-headline text-lg text-foreground/80 max-w-2xl mx-auto">
              <p>Discover and book the most talented mehendi and makeup artists near you.</p>
              <p>Your perfect look for any occasion is just a click away.</p>
            </div>
        </div>

        {!isCustomerLoggedIn && (
           <div className="text-center py-12 bg-card/80 backdrop-blur-sm rounded-lg shadow-md max-w-lg mx-auto mt-4 space-y-6 flex flex-col items-center">
            <h2 className="text-2xl font-bold">Welcome!</h2>
            <p className="text-muted-foreground px-4">Login or create an account to book artists and manage your appointments.</p>
            <div className="flex gap-4">
                <Button onClick={handleCustomerLogin} size="lg">
                    <LogIn className="mr-2 h-4 w-4" />
                    Login
                </Button>
                <Button onClick={handleCustomerRegister} size="lg" variant="outline">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Sign Up
                </Button>
            </div>
            <Separator className="my-4 w-4/5" />
            <div className="space-y-4 flex flex-col items-center w-full">
                 <Button variant="outline" onClick={handleArtistRegister} className="w-4/5">
                    <Palette className="mr-2 h-4 w-4"/>
                    Are you an artist? Register here
                 </Button>
                 <Link href="/artist/login" className="w-4/5">
                    <Button className="w-full">
                        <Palette className="mr-2 h-4 w-4" /> Artist Login
                    </Button>
                 </Link>
            </div>
          </div>
        )}

        <Tabs defaultValue="services" className="w-full mt-8">
            <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto">
                <TabsTrigger value="services"><ShoppingBag className="mr-2 h-5 w-5" />Services</TabsTrigger>
                <TabsTrigger value="artists"><Palette className="mr-2 h-5 w-5" />Artists</TabsTrigger>
                <TabsTrigger value="recommendations" className="text-accent"><Sparkles className="mr-2 h-5 w-5"/>AI Match</TabsTrigger>
                <TabsTrigger value="gallery"><Image className="mr-2 h-5 w-5" />Our Work</TabsTrigger>
            </TabsList>
            <TabsContent value="services">
                <Packages onServiceSelect={(service) => { setSelectedService(service); setIsServiceModalOpen(true); }} />
            </TabsContent>
            <TabsContent value="artists">
                <ArtistFinder service="all" />
            </TabsContent>
            <TabsContent value="recommendations">
                <RecommendationsTab onBookingRequest={handleBookingRequest}/>
            </TabsContent>
            <TabsContent value="gallery">
                 <div className="py-12">
                    <Carousel
                        opts={{
                            align: "start",
                            loop: true,
                        }}
                        plugins={[
                            Autoplay({
                                delay: 3000,
                            }),
                        ]}
                        className="w-full max-w-6xl mx-auto"
                    >
                        <CarouselContent>
                            {galleryImages.map((image, index) => (
                                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                                    <div className="p-1">
                                        <Card className="overflow-hidden">
                                            <CardContent className="flex aspect-video items-center justify-center p-0">
                                                <Image 
                                                    src={image.src} 
                                                    alt={image.alt}
                                                    width={600}
                                                    height={400}
                                                    className="w-full h-full object-cover"
                                                    data-ai-hint={image.hint}
                                                />
                                            </CardContent>
                                        </Card>
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                    </Carousel>
                </div>
            </TabsContent>
        </Tabs>

        <ArtistRegistrationModal
            isOpen={isArtistRegistrationModalOpen}
            onOpenChange={setIsArtistRegistrationModalOpen}
        />
        <CustomerRegistrationModal
            isOpen={isCustomerRegistrationModalOpen}
            onOpenChange={setIsCustomerRegistrationModalOpen}
            onSuccessfulRegister={onSuccessfulLogin}
        />
        <CustomerLoginModal
            isOpen={isCustomerLoginModalOpen}
            onOpenChange={setIsCustomerLoginModalOpen}
            onSuccessfulLogin={onSuccessfulLogin}
        />
        {selectedService && (
            <ServiceSelectionModal
                isOpen={isServiceModalOpen}
                onOpenChange={setIsServiceModalOpen}
                service={selectedService}
                artists={artists}
                onAddToCart={handleAddToCart}
            />
        )}
      </main>
    </div>
  );
}
