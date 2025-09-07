
'use client';

import * as React from 'react';
import type { Artist, MehndiPackage, Customer } from '@/types';
import { artists as initialArtists } from '@/lib/data';
import { packages as allPackages } from '@/lib/packages-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Calendar as CalendarIcon,
  Search,
  LogIn,
  UserPlus,
  Palette,
  ShoppingBag,
  Camera,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Header } from '@/components/glamgo/Header';
import { ArtistCard } from '@/components/glamgo/ArtistCard';
import { BookingModal } from '@/components/glamgo/BookingModal';
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
import { useSearchParams } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const searchParams = useSearchParams();
  const [artists, setArtists] = React.useState<Artist[]>([]);
  const [filteredArtists, setFilteredArtists] =
    React.useState<Artist[]>([]);
  const [selectedArtist, setSelectedArtist] = React.useState<Artist | null>(
    null
  );
  const [isBookingModalOpen, setIsBookingModalOpen] = React.useState(false);
  const [isArtistRegistrationModalOpen, setIsArtistRegistrationModalOpen] =
    React.useState(false);
  const [isCustomerRegistrationModalOpen, setIsCustomerRegistrationModalOpen] = React.useState(false);
  const [isCustomerLoginModalOpen, setIsCustomerLoginModalOpen] = React.useState(false);
  
  const [isCustomerLoggedIn, setIsCustomerLoggedIn] = React.useState(false);
  const [customer, setCustomer] = React.useState<Customer | null>(null);

  const [cart, setCart] = React.useState<MehndiPackage[]>([]);

  const { toast } = useToast();

  // Filter state
  const [location, setLocation] = React.useState('');
  const [serviceType, setServiceType] = React.useState('all');
  const [priceRange, setPriceRange] = React.useState([20000]);
  const [availabilityDate, setAvailabilityDate] = React.useState<
    Date | undefined
  >();
  const [selectedStyles, setSelectedStyles] = React.useState<string[]>([]);

  const [currentBgIndex, setCurrentBgIndex] = React.useState(0);
  
  const allStyleTags = React.useMemo(() => {
    const tags = new Set<string>();
    artists.forEach(artist => artist.styleTags.forEach(tag => tags.add(tag)));
    return Array.from(tags);
  }, [artists]);


  React.useEffect(() => {
    // Load artists from localStorage
    const storedArtists = localStorage.getItem('artists');
    const localArtists = storedArtists ? JSON.parse(storedArtists) : [];
    const allApproved = [...initialArtists.filter(a => !localArtists.some((la: Artist) => la.id === a.id)), ...localArtists];
    setArtists(allApproved);
    setFilteredArtists(allApproved);

    // Check for logged-in customer
    const customerId = localStorage.getItem('currentCustomerId');
    if (customerId) {
        const allCustomers: Customer[] = JSON.parse(localStorage.getItem('customers') || JSON.stringify([]));
        const currentCustomer = allCustomers.find(c => c.id === customerId);
        if (currentCustomer) {
            setIsCustomerLoggedIn(true);
            setCustomer(currentCustomer);
        }
    } else {
        setIsCustomerLoggedIn(false);
        setCustomer(null);
    }

    const intervalId = setInterval(() => {
      setCurrentBgIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length);
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(intervalId);
  }, []);

  React.useEffect(() => {
    const packageIds = searchParams.get('packages')?.split(',') || [];
    if (packageIds.length > 0) {
      const selectedPackages = allPackages.filter(p => packageIds.includes(p.id));
      setCart(selectedPackages);
    }
  }, [searchParams]);

  const handleBookingRequest = (artist: Artist) => {
    if (!isCustomerLoggedIn) {
        setIsCustomerLoginModalOpen(true);
        toast({ title: 'Please Login', description: 'You need to be logged in to book an artist.' });
        return;
    }
    setSelectedArtist(artist);
    setIsBookingModalOpen(true);
  };
  
  const handleAddToCart = (pkg: MehndiPackage) => {
    if (!isCustomerLoggedIn) {
        setIsCustomerLoginModalOpen(true);
        toast({ title: 'Please Login', description: 'You need to be logged in to add packages to your booking.' });
        return;
    }

    const isInCart = cart.find(item => item.id === pkg.id);
    if (isInCart) {
        toast({ title: "Already in cart", description: `${pkg.name} is already in your selection.`, variant: "default" });
        return;
    }
    toast({ title: "Package Added!", description: `${pkg.name} has been added to your selection.` });
    setCart(currentCart => [...currentCart, pkg]);
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
    setTimeout(() => {
        toast({
            title: 'Login Successful',
            description: `Welcome back, ${customer.name}!`,
        });
    }, 0);
  }

  const handleCustomerLogout = () => {
    setIsCustomerLoggedIn(false);
    setCustomer(null);
    setCart([]);
    localStorage.removeItem('currentCustomerId');
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
  };

  React.useEffect(() => {
    // Show all artists initially, filter will be applied on interaction
    setFilteredArtists(artists);
  }, [artists]);


  const applyFilters = React.useCallback((service?: 'mehndi' | 'makeup') => {
    let currentArtists = artists;

    const currentServiceType = service || serviceType;

    if (location) {
      currentArtists = currentArtists.filter((artist) =>
        artist.location.toLowerCase().includes(location.toLowerCase())
      );
    }

    if (currentServiceType !== 'all') {
      currentArtists = currentArtists.filter(
        (artist) =>
          artist.services.includes(currentServiceType)
      );
    }
    
    if (selectedStyles.length > 0) {
        currentArtists = currentArtists.filter(artist => 
            selectedStyles.every(style => artist.styleTags.includes(style))
        );
    }

    currentArtists = currentArtists.filter((artist) => artist.charge <= priceRange[0]);

    setFilteredArtists(currentArtists);
  }, [location, serviceType, priceRange, artists, selectedStyles]);
  
  React.useEffect(() => {
    applyFilters();
  }, [applyFilters]);


  const resetFilters = () => {
    setLocation('');
    setServiceType('all');
    setPriceRange([20000]);
    setAvailabilityDate(undefined);
    setSelectedStyles([]);
  };
  
  const handleStyleChange = (style: string) => {
      setSelectedStyles(prev => 
          prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]
      )
  }

  const ArtistFinder = ({ service }: { service?: 'mehndi' | 'makeup' }) => (
    <div className="space-y-8">
        <Packages onAddToCart={handleAddToCart} cart={cart}/>
        
        <Separator />
        
        <div>
          <h2 className="text-center font-headline text-5xl text-primary mb-8">All Artists</h2>
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
      </div>
  );

  return (
    <div className="flex min-h-screen w-full flex-col relative">
       {cart.length > 0 && (
         <div className="fixed bottom-8 right-8 z-50">
             <Link href={`/book?packages=${cart.map(p => p.id).join(',')}`}>
                <Button size="lg" className="rounded-full shadow-lg text-lg">
                    <ShoppingBag className="mr-2 h-6 w-6"/>
                    Book Now ({cart.length})
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
      />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="text-center">
            <h1 className="font-headline text-5xl font-bold text-primary md:text-7xl">
                Mehendi<span className="text-accent">f</span>y
            </h1>
            <p className="mt-2 font-dancing-script text-2xl text-foreground/90">Artistry at Your Fingertips</p>
            <div className="mt-4 font-headline text-lg text-foreground/80 max-w-2xl mx-auto">
              <p>Discover and book the most talented mehndi and makeup artists near you.</p>
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

        <Tabs defaultValue="mehndi" className="w-full mt-8">
            <TabsList className="grid w-full grid-cols-3 max-w-lg mx-auto">
                <TabsTrigger value="mehndi" onClick={() => applyFilters('mehndi')}><MehndiIcon className="mr-2 h-6 w-6"/>Mehndi</TabsTrigger>
                <TabsTrigger value="makeup" onClick={() => applyFilters('makeup')}><MakeupIcon className="mr-2 h-6 w-6"/>Makeup</TabsTrigger>
                <TabsTrigger value="photography" disabled><PhotographyIcon className="mr-2 h-6 w-6"/>Photography (Soon)</TabsTrigger>
            </TabsList>
            <TabsContent value="mehndi">
                <ArtistFinder service="mehndi" />
            </TabsContent>
            <TabsContent value="makeup">
                <ArtistFinder service="makeup" />
            </TabsContent>
            <TabsContent value="photography">
                {/* Placeholder for photography */}
            </TabsContent>
        </Tabs>


        <div className="py-12">
            <h2 className="text-center font-headline text-5xl text-primary mb-8">Our Works</h2>
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


        {selectedArtist && (
          <BookingModal
            artist={selectedArtist}
            pkg={null}
            isOpen={isBookingModalOpen}
            onOpenChange={setIsBookingModalOpen}
          />
        )}
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
      </main>
    </div>
  );
}
