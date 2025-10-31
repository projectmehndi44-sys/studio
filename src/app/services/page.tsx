
'use client';

import * as React from 'react';
import type { Artist, Customer, CartItem, MasterServicePackage } from '@/lib/types';
import { getCustomer, listenToCollection, getMasterServices } from '@/lib/services';
import { Header } from '@/components/utsavlook/Header';
import { Footer } from '@/components/utsavlook/Footer';
import { useToast } from '@/hooks/use-toast';
import { Packages } from '@/components/utsavlook/Packages';
import { useRouter } from 'next/navigation';
import { ServiceSelectionModal } from '@/components/utsavlook/ServiceSelectionModal';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MehndiIcon, MakeupIcon, PhotographyIcon } from '@/components/icons';
import { useAuth } from '@/firebase';


export default function ServicesPage() {
  const router = useRouter();
  const auth = useAuth();
  const [artists, setArtists] = React.useState<Artist[]>([]);
  const [masterServices, setMasterServices] = React.useState<MasterServicePackage[]>([]);
  const [filteredServices, setFilteredServices] = React.useState<MasterServicePackage[]>([]);
  
  const [isCustomerLoggedIn, setIsCustomerLoggedIn] = React.useState(false);
  const [customer, setCustomer] = React.useState<Customer | null>(null);

  const [cart, setCart] = React.useState<CartItem[]>([]);

  const [isServiceModalOpen, setIsServiceModalOpen] = React.useState(false);
  const [selectedService, setSelectedService] = React.useState<MasterServicePackage | null>(null);
  
  const [searchTerm, setSearchTerm] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('all');
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [isSuggestionsVisible, setIsSuggestionsVisible] = React.useState(false);


  const { toast } = useToast();

   const handleCustomerLogout = () => {
    signOut(auth);
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
  };

  React.useEffect(() => {
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
        setFilteredServices(updatedServices);
    });

    return () => {
        unsubscribeArtists();
        unsubscribeAuth();
    };
  }, [auth]);

  React.useEffect(() => {
    let servicesToFilter = masterServices;

    if (activeTab !== 'all') {
      servicesToFilter = servicesToFilter.filter(service => service.service === activeTab);
    }

    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      servicesToFilter = servicesToFilter.filter(service =>
        service.name.toLowerCase().includes(lowercasedTerm) ||
        service.description.toLowerCase().includes(lowercasedTerm) ||
        service.tags.some(tag => tag.toLowerCase().includes(lowercasedTerm))
      );

       // Generate suggestions
      const potentialSuggestions = new Set<string>();
      masterServices.forEach(service => {
        if (service.name.toLowerCase().includes(lowercasedTerm)) {
          potentialSuggestions.add(service.name);
        }
        service.tags.forEach(tag => {
          if (tag.toLowerCase().includes(lowercasedTerm)) {
            potentialSuggestions.add(tag);
          }
        });
      });
      setSuggestions(Array.from(potentialSuggestions).slice(0, 5));

    } else {
        setSuggestions([]);
    }
    
    setFilteredServices(servicesToFilter);

  }, [searchTerm, activeTab, masterServices]);

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
  
  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion);
    setSuggestions([]);
    setIsSuggestionsVisible(false);
  };

  return (
    <div className="flex min-h-screen w-full flex-col relative why-choose-us-bg">
      <Header 
        isCustomerLoggedIn={isCustomerLoggedIn}
        onCustomerLogout={handleCustomerLogout}
        customer={customer}
        cartCount={cart.length}
      />
      <main className="flex flex-1 flex-col">
        <section id="services" className="w-full">
          <div className="container mx-auto px-4 md:px-6 py-12">
             <h1 className="text-center font-headline text-4xl sm:text-5xl text-primary title-3d-effect mb-4">Our Services</h1>
             <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
                Find the perfect professional service for your special occasion.
            </p>

            <div className="bg-background/80 backdrop-blur-sm p-4 rounded-lg shadow-md mb-8 max-w-4xl mx-auto">
                <div 
                    className="relative mb-4"
                    onFocus={() => setIsSuggestionsVisible(true)}
                    onBlur={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget)) {
                           setTimeout(() => setIsSuggestionsVisible(false), 150);
                        }
                    }}
                >
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                        placeholder="Search services by name, style, or occasion..."
                        className="pl-10 h-12 text-lg"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoComplete="off"
                    />
                     {isSuggestionsVisible && suggestions.length > 0 && searchTerm && (
                        <ul className="absolute top-full mt-2 w-full bg-background border rounded-md shadow-lg z-50">
                            {suggestions.map((suggestion, index) => (
                                <li
                                    key={index}
                                    className="px-4 py-2 cursor-pointer hover:bg-muted"
                                    onMouseDown={() => handleSuggestionClick(suggestion)}
                                >
                                    {suggestion}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                 <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="mehndi"><MehndiIcon className="w-4 h-4 mr-2"/>Mehndi</TabsTrigger>
                        <TabsTrigger value="makeup"><MakeupIcon className="w-4 h-4 mr-2"/>Makeup</TabsTrigger>
                        <TabsTrigger value="photography"><PhotographyIcon className="w-4 h-4 mr-2"/>Photography</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>
            
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredServices.length > 0 ? (
                    <Packages packages={filteredServices} onServiceSelect={(service) => { setSelectedService(service); setIsServiceModalOpen(true); }} />
                ) : (
                    <div className="col-span-full text-center py-16">
                        <h3 className="text-2xl font-semibold">No Services Found</h3>
                        <p className="text-muted-foreground mt-2">Try adjusting your search or filter.</p>
                    </div>
                )}
            </div>
          </div>
        </section>

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
      <Footer />
    </div>
  );
}
