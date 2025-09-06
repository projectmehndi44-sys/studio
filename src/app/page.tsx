'use client';

import * as React from 'react';
import type { Artist } from '@/types';
import { artists as allArtists } from '@/lib/data';
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
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Header } from '@/components/glamgo/Header';
import { ArtistCard } from '@/components/glamgo/ArtistCard';
import { BookingModal } from '@/components/glamgo/BookingModal';
import { RecommendationsTab } from '@/components/glamgo/RecommendationsTab';
import { ArtistRegistrationModal } from '@/components/glamgo/ArtistRegistrationModal';
import { CustomerRegistrationModal } from '@/components/glamgo/CustomerRegistrationModal';
import { CustomerLoginModal } from '@/components/glamgo/CustomerLoginModal';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

export default function Home() {
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
  const [customer, setCustomer] = React.useState<{ name: string } | null>(null);

  const { toast } = useToast();

  const [location, setLocation] = React.useState('');
  const [serviceType, setServiceType] = React.useState('all');
  const [priceRange, setPriceRange] = React.useState([10000]);
  const [availabilityDate, setAvailabilityDate] = React.useState<
    Date | undefined
  >();

  const handleBookingRequest = (artist: Artist) => {
    setSelectedArtist(artist);
    setIsBookingModalOpen(true);
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
  
  const onSuccessfulLogin = (name: string) => {
    setIsCustomerLoggedIn(true);
    setCustomer({ name: name });
    setIsCustomerLoginModalOpen(false);
    setIsCustomerRegistrationModalOpen(false);
    toast({
      title: 'Login Successful',
      description: `Welcome back, ${name}! You can now search for artists.`,
    });
  }

  const handleCustomerLogout = () => {
    setIsCustomerLoggedIn(false);
    setCustomer(null);
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
  };

  React.useEffect(() => {
    // On initial load, show all artists if logged in, otherwise show none.
    if (isCustomerLoggedIn) {
        setFilteredArtists(allArtists);
    } else {
        setFilteredArtists([]);
    }
  }, [isCustomerLoggedIn]);


  const applyFilters = () => {
    if (!isCustomerLoggedIn) {
      setFilteredArtists([]);
      return;
    }
    let artists = allArtists;

    if (location) {
      artists = artists.filter((artist) =>
        artist.location.toLowerCase().includes(location.toLowerCase())
      );
    }

    if (serviceType !== 'all') {
      artists = artists.filter(
        (artist) =>
          artist.services.includes(serviceType as 'makeup' | 'mehndi') ||
          artist.services.length === 2
      );
    }

    artists = artists.filter((artist) => artist.charge <= priceRange[0]);

    // Note: Availability check is mocked and won't filter realistically without a backend
    if (availabilityDate) {
      // For demo, we'll just keep this logic simple.
      // In a real app, this would involve complex queries.
    }

    setFilteredArtists(artists);
  };
  
  React.useEffect(() => {
    applyFilters();
  }, [location, serviceType, priceRange, availabilityDate, isCustomerLoggedIn]);


  const resetFilters = () => {
    setLocation('');
    setServiceType('all');
    setPriceRange([10000]);
    setAvailabilityDate(undefined);
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header 
        isCustomerLoggedIn={isCustomerLoggedIn}
        onCustomerLogout={handleCustomerLogout}
        customer={customer}
      />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="text-center">
          <h1 className="font-headline text-5xl text-primary md:text-7xl">
            Artistry at Your Fingertips
          </h1>
          <p className="mx-auto max-w-2xl text-foreground/80 md:text-xl">
            Discover and book the most talented mehndi and makeup artists near
            you. Your perfect look for any occasion is just a click away.
          </p>
        </div>

        {isCustomerLoggedIn ? (
          <div className="space-y-8">
            <RecommendationsTab onBookingRequest={handleBookingRequest} />
            
            <Separator />
            
            <div>
              <h2 className="text-center font-headline text-5xl text-primary mb-8">All Artists</h2>
              <Card className="my-4 border-2 border-accent/20 shadow-lg">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
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
                    <div className="space-y-2">
                      <Label htmlFor="service">Service</Label>
                      <Select value={serviceType} onValueChange={setServiceType}>
                        <SelectTrigger id="service">
                          <SelectValue placeholder="Select service" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="mehndi">Mehndi</SelectItem>
                          <SelectItem value="makeup">Makeup</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Price Range (Max)</Label>
                      <div className="flex items-center gap-4">
                        <Slider
                          id="price"
                          max={10000}
                          min={500}
                          step={500}
                          value={priceRange}
                          onValueChange={setPriceRange}
                        />
                        <span className="text-sm font-medium text-foreground/80 w-24 text-right">
                          ₹{priceRange[0]}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="availability">Availability</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !availabilityDate && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {availabilityDate ? (
                              format(availabilityDate, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={availabilityDate}
                            onSelect={setAvailabilityDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="flex items-end">
                      <Button onClick={resetFilters} variant="ghost" className="w-full">
                        Reset
                      </Button>
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
        ) : (
          <div className="text-center py-16 text-card-foreground bg-card rounded-lg shadow-md max-w-lg mx-auto mt-4 space-y-6">
            <LogIn className="mx-auto h-12 w-12 text-primary" />
            <h2 className="text-2xl font-bold">Customer Login</h2>
            <p className="text-muted-foreground">Please log in to continue.</p>
            <Button onClick={handleCustomerLogin} size="lg" className="w-4/5">
                <LogIn className="mr-2 h-4 w-4" />
                Login
            </Button>
             <div className="text-sm">
                New to GlamGo?{' '}
                <Button variant="link" className="p-0 h-auto" onClick={handleCustomerRegister}>
                    Sign Up
                </Button>
            </div>
            <Separator className="my-4" />
             <div>
                 <Button variant="outline" onClick={handleArtistRegister}>
                    <Palette className="mr-2 h-4 w-4"/>
                    Are you an artist? Register here
                 </Button>
            </div>
          </div>
        )}

        {selectedArtist && (
          <BookingModal
            artist={selectedArtist}
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
