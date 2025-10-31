
'use client';

import * as React from 'react';
import type { Artist, Customer, CartItem, MasterServicePackage, ImagePlaceholder, HeroSettings } from '@/lib/types';
import { getCustomer, getHeroSettings, listenToCollection, getMasterServices } from '@/lib/services';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Palette,
  Sparkles,
  Award,
  Handshake,
  Search,
  BookOpen,
  CalendarCheck,
  ShieldCheck,
  Heart,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Header } from '@/components/utsavlook/Header';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Carousel, CarouselApi, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Image from 'next/image';
import Link from 'next/link';
import { Packages } from '@/components/utsavlook/Packages';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ServiceSelectionModal } from '@/components/utsavlook/ServiceSelectionModal';
import { MehndiIcon, MakeupIcon, PhotographyIcon } from '@/components/icons';
import { PwaInstallBanner } from '@/components/utsavlook/PwaInstallBanner';
import { StyleMatch } from '@/components/utsavlook/StyleMatch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Footer } from '@/components/utsavlook/Footer';
import { ArtistCard } from '@/components/utsavlook/ArtistCard';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirebaseApp } from '@/lib/firebase';
import { ClientOnly } from '@/components/ClientOnly';
import { occasionImages, type OccasionImage } from '@/lib/occasion-images';
import Autoplay from "embla-carousel-autoplay";
import { ArtistProfileModal } from '@/components/utsavlook/ArtistProfileModal';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const occasionWords = occasionImages.map(img => img.occasion);

export default function Home() {
  const router = useRouter();
  const [artists, setArtists] = React.useState<Artist[]>([]);
  const [masterServices, setMasterServices] = React.useState<MasterServicePackage[]>([]);
  
  const [isCustomerLoggedIn, setIsCustomerLoggedIn] = React.useState(false);
  const [customer, setCustomer] = React.useState<Customer | null>(null);

  const [cart, setCart] = React.useState<CartItem[]>([]);

  const [isServiceModalOpen, setIsServiceModalOpen] = React.useState(false);
  const [selectedService, setSelectedService] = React.useState<MasterServicePackage | null>(null);
  const [selectedArtist, setSelectedArtist] = React.useState<Artist | null>(null);
  const [isArtistModalOpen, setIsArtistModalOpen] = React.useState(false);

  
  const [galleryImages, setGalleryImages] = React.useState<ImagePlaceholder[]>([]);
  const [backgroundImages, setBackgroundImages] = React.useState<ImagePlaceholder[]>([]);
  const [topArtists, setTopArtists] = React.useState<Artist[]>([]);

  const [heroSettings, setHeroSettings] = React.useState<HeroSettings>({ slideshowText: ''});
  
  // State for typing animation
  const [occasionIndex, setOccasionIndex] = React.useState(0);
  const [imageIndex, setImageIndex] = React.useState(0);
  const [displayedText, setDisplayedText] = React.useState('');
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [imageOpacity, setImageOpacity] = React.useState(1);
  const typingSpeed = 150;
  const deletingSpeed = 100;
  const pauseDuration = 2000;
  
  const { toast } = useToast();

    // Why Choose Us Carousel State
  const [whyChooseUsApi, setWhyChooseUsApi] = React.useState<CarouselApi>();
  const [whyChooseUsScrollSnaps, setWhyChooseUsScrollSnaps] = React.useState<number[]>([]);
  const [whyChooseUsSelectedIndex, setWhyChooseUsSelectedIndex] = React.useState(0);


  React.useEffect(() => {
    let timeout: NodeJS.Timeout;

    const handleTyping = () => {
      const currentWord = occasionWords[occasionIndex];
      
      if (isDeleting) {
        if (displayedText.length > 0) {
          timeout = setTimeout(() => {
            setDisplayedText(currentWord.substring(0, displayedText.length - 1));
          }, deletingSpeed);
        } else {
          setIsDeleting(false);
          setOccasionIndex((prev) => (prev + 1) % occasionWords.length);
          setImageIndex((prev) => (prev + 1) % occasionImages.length);
          setImageOpacity(1);
        }
      } else {
        if (displayedText.length < currentWord.length) {
          timeout = setTimeout(() => {
            setDisplayedText(currentWord.substring(0, displayedText.length + 1));
          }, typingSpeed);
        } else {
          timeout = setTimeout(() => {
            setIsDeleting(true);
            setImageOpacity(0);
          }, pauseDuration);
        }
      }
    };

    handleTyping();

    return () => clearTimeout(timeout);
  }, [displayedText, isDeleting, occasionIndex]);
  
  const handleCustomerLogout = () => {
    signOut(getAuth(getFirebaseApp()));
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
  };

  React.useEffect(() => {
    const auth = getAuth(getFirebaseApp());
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const currentCustomer = await getCustomer(user.uid);
        if (currentCustomer) {
            setIsCustomerLoggedIn(true);
            setCustomer(currentCustomer);
            const storedCart = localStorage.getItem(`cart_${user.uid}`);
            setCart(storedCart ? JSON.parse(storedCart) : []);
            localStorage.setItem('currentCustomerId', user.uid);
        } else {
            setIsCustomerLoggedIn(false);
            setCustomer(null);
            setCart([]);
            localStorage.removeItem('currentCustomerId');
        }
      } else {
        setIsCustomerLoggedIn(false);
        setCustomer(null);
        setCart([]);
        localStorage.removeItem('currentCustomerId');
      }
    });
    
    const unsubscribeArtists = listenToCollection<Artist>('artists', (fetchedArtists) => {
        setArtists(fetchedArtists);
        setTopArtists([...fetchedArtists].sort(() => 0.5 - Math.random()).slice(0, 5));
    });
    
    getMasterServices().then((services) => {
        const updatedServices = services.map(service => ({
            ...service,
            image: service.image || `https://picsum.photos/seed/${service.id}/400/300`,
            categories: service.categories.map(cat => ({
                ...cat,
                image: cat.image || `https://picsum.photos/seed/${service.id}-${cat.name}/200/200`
            }))
        }));
        setMasterServices(updatedServices);
    });

    setGalleryImages(PlaceHolderImages.filter(img => img.id.startsWith('our-work')));

    getHeroSettings().then(setHeroSettings);

    return () => {
        unsubscribeArtists();
        unsubscribeAuth();
    };
  }, []);
  
  React.useEffect(() => {
      if (artists.length > 0) {
          setTopArtists(prevArtists => [...prevArtists].sort(() => 0.5 - Math.random()));
      }
  }, [artists]);


  const handleAddToCart = (item: Omit<CartItem, 'id'>) => {
    if (!isCustomerLoggedIn || !customer) {
        localStorage.setItem('tempCartItem', JSON.stringify(item));
        router.push('/login');
        toast({ 
            title: 'Please Login to Continue', 
            description: 'Your selection will be waiting for you after you log in.' 
        });
        return;
    }
    const newCartItem: CartItem = { ...item, id: `${item.servicePackage.id}-${Date.now()}` };
    const newCart = [...cart, newCartItem];
    setCart(newCart);
    localStorage.setItem(`cart_${customer.id}`, JSON.stringify(newCart));
    toast({ title: 'Added to cart!', description: `${item.servicePackage.name} (${item.selectedTier.name}) has been added.`});
  };
  
  const CategoryTabContent = ({ serviceType }: { serviceType: "mehndi" | "makeup" | "photography" }) => {
    const relevantPackages = masterServices.filter(p => p.service === serviceType);
    
    return (
      <div className="space-y-8 mt-4 md:mt-8">
        <Carousel
             opts={{ align: "start", loop: true, }}
             plugins={[ Autoplay({ delay: 4000, stopOnInteraction: false, stopOnFocusIn: false }) ]}
             className="w-full"
        >
            <CarouselContent className="-ml-4">
              {relevantPackages.map((pkg) => (
                <CarouselItem key={pkg.id} className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                  <Packages packages={[pkg]} onServiceSelect={(service) => { setSelectedService(service); setIsServiceModalOpen(true); }} />
                </CarouselItem>
              ))}
            </CarouselContent>
        </Carousel>
      </div>
    );
  }
  
  const whyChooseUsFeatures = [
    {
      icon: <Award className="w-8 h-8 text-primary" />,
      title: "Verified Professionals",
      description: "Book with confidence. We vet every artist for quality and professionalism, so you can relax knowing you’re in expert hands.",
      imageUrl: "https://firebasestorage.googleapis.com/v0/b/studio-163529036-f9a8c.firebasestorage.app/o/why-choose-us-icons%2FVerified%20Professionals.png?alt=media&token=f76482cd-dfaf-4e4c-9347-1d96688be5d7",
      aiHint: "verified professional",
    },
    {
      icon: <Sparkles className="w-8 h-8 text-primary" />,
      title: "AI Style Match",
      description: "Unsure of the look you want? Upload an outfit photo and let our AI recommend the perfect mehndi and makeup styles to match.",
      imageUrl: "https://firebasestorage.googleapis.com/v0/b/studio-163529036-f9a8c.firebasestorage.app/o/why-choose-us-icons%2FAI%20style%20match.png?alt=media&token=d5b28e82-2591-4bfd-9466-924a7bf93df3",
      aiHint: "ai style",
    },
    {
      icon: <BookOpen className="w-8 h-8 text-primary" />,
      title: "Transparent Pricing",
      description: "No hidden fees. See prices upfront from a wide range of artists to find a service that fits your budget perfectly.",
      imageUrl: "https://firebasestorage.googleapis.com/v0/b/studio-163529036-f9a8c.firebasestorage.app/o/why-choose-us-icons%2FTransparent%20%26%20Fair.png?alt=media&token=3b8be75d-58c7-4bb3-851d-92190c1fec05",
      aiHint: "transparent pricing",
    },
    {
      icon: <CalendarCheck className="w-8 h-8 text-primary" />,
      title: "Effortless Booking",
      description: "From discovery to booking, our streamlined process makes finding and confirming your artist faster and easier than ever before.",
      imageUrl: "https://firebasestorage.googleapis.com/v0/b/studio-163529036-f9a8c.firebasestorage.app/o/why-choose-us-icons%2FEffortless%20Booking.png?alt=media&token=904ae217-f00d-4e29-a3c0-6c191188793e",
      aiHint: "easy booking",
    },
    {
      icon: <Heart className="w-8 h-8 text-primary" />,
      title: "Curated for You",
      description: "We don't just list artists; we curate a selection of the best talent, ensuring you always get a high-quality, memorable experience.",
      imageUrl: "https://firebasestorage.googleapis.com/v0/b/studio-163529036-f9a8c.firebasestorage.app/o/why-choose-us-icons%2FGemini_Generated_Image_2xjtga2xjtga2xjt.png?alt=media&token=4c811d53-dfad-4aef-90e9-cafe39d54f92",
      aiHint: "curated selection",
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-primary" />,
      title: "Secure & Reliable",
      description: "With secure payments and a reliable platform, we take the stress out of the process, letting you focus on your celebration.",
      imageUrl: "https://firebasestorage.googleapis.com/v0/b/studio-163529036-f9a8c.firebasestorage.app/o/why-choose-us-icons%2FSecure%20Payments.png?alt=media&token=5bd6438c-e8c7-4a9a-af8f-3d08017e8c41",
      aiHint: "secure reliable",
    }
  ];

  const howItWorksSteps = [
      {
        icon: <Search className="w-10 h-10 text-accent"/>,
        title: "1. Discover",
        description: "Browse services, view artist portfolios, and find the perfect match for your style and budget."
      },
      {
        icon: <CalendarCheck className="w-10 h-10 text-accent"/>,
        title: "2. Book",
        description: "Select your desired date and time, and confirm your booking with a secure advance payment."
      },
      {
        icon: <Sparkles className="w-10 h-10 text-accent"/>,
        title: "3. Celebrate",
        description: "Relax and enjoy your special day while our professional artists create your stunning look."
      }
  ]

  const handleScrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };
  
    const onWhyChooseUsSelect = React.useCallback((emblaApi: CarouselApi) => {
    if (!emblaApi) return;
    setWhyChooseUsSelectedIndex(emblaApi.selectedScrollSnap());
  }, []);

  const scrollToWhyChooseUs = React.useCallback(
    (index: number) => whyChooseUsApi && whyChooseUsApi.scrollTo(index),
    [whyChooseUsApi]
  );
  
  React.useEffect(() => {
    if (!whyChooseUsApi) {
      return;
    }
    setWhyChooseUsScrollSnaps(whyChooseUsApi.scrollSnapList());
    whyChooseUsApi.on("select", onWhyChooseUsSelect);
    whyChooseUsApi.on("reInit", onWhyChooseUsSelect);
  }, [whyChooseUsApi, onWhyChooseUsSelect]);


  return (
    <div className="flex min-h-screen w-full flex-col relative bg-background">
      <div id="recaptcha-container" style={{ position: 'absolute', bottom: 0, right: 0, zIndex: -1 }}></div>
      
      <Header 
        isCustomerLoggedIn={isCustomerLoggedIn}
        onCustomerLogout={handleCustomerLogout}
        customer={customer}
        cartCount={cart.length}
      />
      <main className="flex flex-1 flex-col">
        {!isCustomerLoggedIn && (
            <div className="w-full why-choose-us-bg">
                <div className="group relative overflow-hidden">
                    <div className="absolute inset-0 w-full h-full">
                        {occasionImages.map((item, index) => (
                            <Image
                                key={item.imageUrl}
                                src={item.imageUrl}
                                alt={item.occasion}
                                fill
                                priority={index === 0}
                                className={cn(
                                    "object-cover transition-opacity duration-1000",
                                    index === imageIndex ? "opacity-100" : "opacity-0"
                                )}
                            />
                        ))}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent"></div>

                    <div className="relative flex flex-col justify-center p-6 md:p-10 text-center md:text-left min-h-[500px] md:min-h-[600px] md:w-3/5 lg:w-1/2">
                        <div className="space-y-2 opacity-0 animate-fade-in [animation-delay:0s] [animation-fill-mode:forwards]">
                        <h1 className="font-headline text-5xl md:text-6xl lg:text-7xl font-bold text-accent animate-slide-down opacity-0 [animation-fill-mode:forwards] [animation-delay:0s]">
                            Utsav<span className="text-primary">Look</span>
                        </h1>
                        <p className="font-dancing-script text-2xl md:text-3xl animate-slide-in-left opacity-0 [animation-fill-mode:forwards] [animation-delay:1s]">Your Perfect Look for Every Utsav.</p>
                        </div>
                        
                        <div className="mt-4 opacity-0 animate-fade-in [animation-delay:2s] [animation-fill-mode:forwards]">
                            <div className="whitespace-nowrap text-2xl font-bold md:text-3xl animate-slide-in-left opacity-0 [animation-fill-mode:forwards] [animation-delay:2s]">Crafting Memories for Your</div>
                            <div className="animated-gradient-text text-5xl font-bold md:text-6xl h-20">
                                {displayedText}
                                <span className="animate-pulse">|</span>
                            </div>
                        </div>
                        
                        <div className="mt-4 max-w-xl font-body text-base animate-slide-up opacity-0 [animation-fill-mode:forwards] [animation-delay:3s]">
                          <p>Book top-rated, verified artists for your special day.</p>
                        </div>

                        <div className="mt-6 flex flex-col items-center sm:flex-row gap-4 justify-center md:justify-start opacity-0 animate-fade-in [animation-delay:4s] [animation-fill-mode:forwards]">
                            <Button size="lg" className="btn-gradient rounded-full w-fit" asChild>
                                <Link href="/services">Book a Service</Link>
                            </Button>
                            <Button size="lg" className="btn-gradient rounded-full w-fit" asChild>
                                <Link href="/artists">View Artists</Link>
                            </Button>
                        </div>
                        <div className="mt-8 text-center md:text-left animate-slide-up opacity-0 [animation-fill-mode:forwards] [animation-delay:5s]">
                          <div className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary-foreground backdrop-blur-sm hover:bg-primary/20 transition-colors">
                              <Link href="/artist" className="text-sm text-primary font-semibold">Are you an artist? <span className="font-bold underline">Join Us!</span></Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
        
        <ClientOnly>
        {isCustomerLoggedIn && (
            <div id="style-match" className="py-8 max-w-4xl mx-auto w-full px-4">
               <Accordion type="single" collapsible className="w-full bg-card rounded-lg shadow-lg border-accent/20">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="p-4 md:p-6 text-left">
                    <div className="flex items-center gap-4">
                        <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-accent flex-shrink-0" />
                        <div>
                            <h3 className="text-xl md:text-2xl font-bold font-headline text-primary">AI Style Match</h3>
                            <p className="text-sm text-muted-foreground mt-1">Get personalized recommendations by uploading a photo of your outfit.</p>
                        </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-0">
                    <StyleMatch />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
        )}
        </ClientOnly>

        <section id="services" className="w-full why-choose-us-bg">
          <div className="container mx-auto px-4 md:px-6 py-12">
            <h2 className="text-center font-headline text-4xl sm:text-5xl text-primary title-3d-effect">Our Services</h2>
             <ClientOnly>
                <Tabs defaultValue="mehndi" className="w-full mt-8">
                    <div className="flex justify-center">
                        <TabsList className="grid grid-cols-3 max-w-xl mx-auto h-auto rounded-full bg-secondary p-1">
                            <TabsTrigger value="mehndi" className="py-2.5 rounded-full text-base transition-all duration-300 gradient-tabs-trigger"><MehndiIcon className="h-5 w-5 mr-2"/>Mehndi</TabsTrigger>
                            <TabsTrigger value="makeup" className="py-2.5 rounded-full text-base transition-all duration-300 gradient-tabs-trigger"><MakeupIcon className="h-5 w-5 mr-2"/>Makeup</TabsTrigger>
                            <TabsTrigger value="photography" className="py-2.5 rounded-full text-base transition-all duration-300 gradient-tabs-trigger"><PhotographyIcon className="h-5 w-5 mr-2"/>Photography</TabsTrigger>
                        </TabsList>
                    </div>
                    <TabsContent value="mehndi" className="mt-6">
                        <CategoryTabContent serviceType="mehndi" />
                    </TabsContent>
                    <TabsContent value="makeup" className="mt-6">
                        <CategoryTabContent serviceType="makeup" />
                    </TabsContent>
                    <TabsContent value="photography" className="mt-6">
                        <CategoryTabContent serviceType="photography" />
                    </TabsContent>
                </Tabs>
             </ClientOnly>
             <div className="text-center mt-8">
                <Button asChild variant="outline">
                    <Link href="/services">View More Services</Link>
                </Button>
            </div>
          </div>
        </section>

        <section id="why-choose-us" className="w-full py-12 md:py-16 why-choose-us-bg">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="animated-gradient-text text-3xl font-bold tracking-tighter sm:text-5xl font-headline mb-4 title-3d-effect">Why Choose UtsavLook?</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed mx-auto">We don't just list services; we build trust and create experiences.</p>
            </div>
            <Carousel
              opts={{ align: "start", loop: true }}
              className="w-full"
              plugins={[Autoplay({ delay: 5000, stopOnInteraction: true })]}
            >
              <CarouselContent>
                {whyChooseUsFeatures.map((feature) => (
                  <CarouselItem key={feature.title} className="md:basis-1/2 lg:basis-1/3">
                    <div className="p-4 h-full">
                        <div className="bg-background/80 backdrop-blur-sm p-6 rounded-2xl shadow-brand hover:shadow-brand-lg transition-all duration-300 hover:-translate-y-2 flex flex-col text-center items-center h-full">
                          <div className="relative w-full aspect-square mb-4 rounded-lg overflow-hidden">
                            <Image src={feature.imageUrl} alt={feature.title} fill className="object-cover" data-ai-hint={feature.aiHint} />
                          </div>
                          <h3 className="text-lg font-bold text-primary mb-2">{feature.title}</h3>
                          <p className="text-sm text-muted-foreground flex-grow">{feature.description}</p>
                        </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
             <div className="flex justify-center gap-2 mt-4">
              {whyChooseUsScrollSnaps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollToWhyChooseUs(index)}
                  className={cn(
                    'h-2 w-2 rounded-full transition-all duration-300',
                    whyChooseUsSelectedIndex === index ? 'w-6 bg-primary' : 'bg-primary/20'
                  )}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </section>
        
        <Separator />

         {topArtists.length > 0 && (
          <div id="artists" className="py-12 px-4 why-choose-us-bg">
            <div className="container mx-auto px-4 md:px-6">
                <h2 className="text-center font-headline text-4xl sm:text-5xl text-primary mb-12">Meet Our Top Artists</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
                  {topArtists.map((artist) => (
                    <ArtistCard key={artist.id} artist={artist} onViewProfile={() => {setSelectedArtist(artist); setIsArtistModalOpen(true);}} />
                  ))}
                </div>
                 <div className="text-center mt-8">
                    <Button asChild variant="outline">
                        <Link href="/artists">View All Artists</Link>
                    </Button>
                </div>
            </div>
          </div>
        )}

        <section id="how-it-works" className="w-full why-choose-us-bg">
           <div className="container px-4 md:px-6 py-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-primary font-headline mb-4">How It Works</h2>
              <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed mx-auto">A seamless experience from start to finish.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {howItWorksSteps.map(step => (
                    <div key={step.title} className="text-center p-6 bg-background rounded-lg shadow-brand hover:shadow-brand-lg transition-all duration-300 hover:-translate-y-2">
                        <div className="inline-block bg-accent/10 p-4 rounded-full w-fit mb-4">
                            {step.icon}
                        </div>
                        <h3 className="text-xl font-bold text-primary mb-2">{step.title}</h3>
                        <p className="text-muted-foreground">{step.description}</p>
                    </div>
                ))}
            </div>
          </div>
        </section>

        {!isCustomerLoggedIn && (
            <>
                <Separator className="my-8"/>
                <div className="px-4 why-choose-us-bg">
                  <div className="container mx-auto px-4 md:px-6 py-12">
                    <h2 className="text-center font-headline text-4xl sm:text-5xl text-primary">Our Works</h2>
                    <Carousel
                        opts={{
                            align: "start",
                            loop: true,
                        }}
                        plugins={[
                            Autoplay({
                                delay: 5000,
                            })
                        ]}
                        className="w-full max-w-6xl mx-auto mt-4 md:mt-8"
                    >
                        <CarouselContent>
                            {galleryImages.map((image, index) => (
                                <CarouselItem key={index} className="sm:basis-1/2 lg:basis-1/3">
                                    <div className="p-1">
                                        <Card className="overflow-hidden">
                                            <CardContent className="flex aspect-video items-center justify-center p-0">
                                                <Image 
                                                    src={image.imageUrl} 
                                                    alt={image.description}
                                                    width={600}
                                                    height={400}
                                                    className="w-full h-full object-cover"
                                                    data-ai-hint={image.imageHint}
                                                />
                                            </CardContent>
                                        </Card>
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                    </Carousel>
                  </div>
                </div>
                <PwaInstallBanner />
            </>
        )}

        {selectedService && (
            <ServiceSelectionModal
                isOpen={isServiceModalOpen}
                onOpenChange={setIsServiceModalOpen}
                service={selectedService}
                artists={artists}
                onAddToCart={handleAddToCart}
            />
        )}
         {selectedArtist && (
          <ArtistProfileModal 
            isOpen={isArtistModalOpen}
            onOpenChange={setIsArtistModalOpen}
            artist={selectedArtist}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}
