

'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';

import { packages as initialPackages } from '@/lib/packages-data';
import { artists as initialArtists } from '@/lib/data';
import { INDIA_LOCATIONS } from '@/lib/india-locations';
import type { ServicePackage, Booking, Artist } from '@/types';

import { Calendar as CalendarIcon, ChevronLeft, Minus, Plus, Trash2, Upload, MapPin, Instagram, CheckCircle, AlertCircle, User, IndianRupee } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { BookingSummary } from '@/components/glamgo/BookingSummary';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function BookingPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();

    const [selectedPackages, setSelectedPackages] = React.useState<ServicePackage[]>([]);
    const [selectedArtist, setSelectedArtist] = React.useState<Artist | null>(null);
    const [availableLocations, setAvailableLocations] = React.useState<Record<string, string[]>>({});
    
    // Form state
    const [name, setName] = React.useState('');
    const [phone, setPhone] = React.useState('');
    const [eventType, setEventType] = React.useState('');
    const [eventDate, setEventDate] = React.useState<Date>();
    const [serviceDates, setServiceDates] = React.useState<Date[]>([]);
    const [time, setTime] = React.useState('');
    const [state, setState] = React.useState('');
    const [district, setDistrict] = React.useState('');
    const [location, setLocation] = React.useState('');
    const [address, setAddress] = React.useState('');
    const [mapLink, setMapLink] = React.useState('');
    const [note, setNote] = React.useState('');
    const [instagramId, setInstagramId] = React.useState('');
    
    const [includeGuestMehndi, setIncludeGuestMehndi] = React.useState(false);
    const [guestCount, setGuestCount] = React.useState(1);

    const [includeGuestMakeup, setIncludeGuestMakeup] = React.useState(false);
    const [guestMakeupCount, setGuestMakeupCount] = React.useState(1);

    const primaryServiceType = React.useMemo(() => {
        if (selectedArtist) return selectedArtist.services[0];
        if (selectedPackages.length > 0) return selectedPackages[0].service;
        return 'service';
    }, [selectedArtist, selectedPackages]);

    const dateLabel = React.useMemo(() => {
        switch (primaryServiceType) {
            case 'mehndi': return 'Date(s) for Mehendi*';
            case 'makeup': return 'Date(s) for Makeup*';
            case 'photography': return 'Date(s) for Photography*';
            default: return 'Date(s) for Service*';
        }
    }, [primaryServiceType]);
    
    const getArtists = (): Artist[] => {
         const storedArtists = localStorage.getItem('artists');
         const localArtists: Artist[] = storedArtists ? JSON.parse(storedArtists) : [];
         const allArtistsMap = new Map<string, Artist>();
         initialArtists.forEach(a => allArtistsMap.set(a.id, a));
         localArtists.forEach(a => allArtistsMap.set(a.id, a));
         return Array.from(allArtistsMap.values());
    }

    React.useEffect(() => {
        const packageIds = searchParams.get('packages')?.split(',');
        const artistId = searchParams.get('artistId');

        if (packageIds && packageIds[0]) {
            const packagesData = localStorage.getItem('servicePackages');
            const allAvailablePackages = packagesData ? JSON.parse(packagesData) : initialPackages;
            const packages = allAvailablePackages.filter((p: ServicePackage) => packageIds.includes(p.id));
            setSelectedPackages(packages);
        }

        if (artistId) {
            const allArtists = getArtists();
            const artist = allArtists.find(a => a.id === artistId);
            setSelectedArtist(artist || null);
        }

        const savedLocations = localStorage.getItem('availableLocations');
        if (savedLocations) {
            setAvailableLocations(JSON.parse(savedLocations));
        } else {
            setAvailableLocations(INDIA_LOCATIONS);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    const handleRemovePackage = (packageId: string) => {
        const updatedPackages = selectedPackages.filter(p => p.id !== packageId);
        setSelectedPackages(updatedPackages);
        
        const newPackageIds = updatedPackages.map(p => p.id).join(',');
        if (newPackageIds) {
            router.replace(`/book?packages=${newPackageIds}`);
        } else {
            router.push('/');
        }
    };
    
    const isFormValid = () => {
        const hasSelection = selectedPackages.length > 0 || !!selectedArtist;
        return (
            name &&
            phone &&
            eventType &&
            eventDate &&
            serviceDates.length > 0 &&
            time &&
            state &&
            district &&
            location &&
            address &&
            mapLink &&
            hasSelection
        );
    }

    const handleCreateBooking = () => {
        if (!isFormValid()) {
            toast({
                title: 'Missing Information',
                description: 'Please fill out all mandatory fields before creating the booking.',
                variant: 'destructive',
            });
            return;
        }

        const customerId = localStorage.getItem('currentCustomerId');
        if (!customerId) {
             toast({
                title: 'Not Logged In',
                description: 'You must be logged in to create a booking.',
                variant: 'destructive',
            });
            router.push('/');
            return;
        }
        
        const packageTotal = selectedPackages.reduce((sum, p) => sum + p.price, 0);
        const artistTotal = selectedArtist ? selectedArtist.charge : 0;
        let finalAmount = packageTotal + artistTotal;
        

        // Create booking object
        const newBooking: Booking = {
            id: `book_${Date.now()}`,
            customerId,
            artistIds: selectedArtist ? [selectedArtist.id] : [],
            customerName: name,
            customerContact: phone,
            serviceAddress: address,
            serviceDates: serviceDates,
            date: serviceDates[0], // Keep for backward compatibility / main date
            service: selectedArtist ? selectedArtist.services.join(' & ') : selectedPackages.map(p => p.name).join(', '),
            amount: finalAmount,
            status: selectedArtist ? 'Pending Approval' : 'Needs Assignment',
            eventType,
            eventDate: eventDate!,
            state,
            district,
            location,
            mapLink: mapLink,
            note: note || '',
            instagramId: instagramId || '',
            guestMehndi: {
                included: includeGuestMehndi,
                expectedCount: includeGuestMehndi ? guestCount : 0,
            },
            guestMakeup: {
                included: includeGuestMakeup,
                expectedCount: includeGuestMakeup ? guestMakeupCount : 0,
            }
        };

        const allBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        localStorage.setItem('bookings', JSON.stringify([newBooking, ...allBookings]));
        window.dispatchEvent(new Event('storage'));

        toast({
            title: 'Booking Created!',
            description: 'Your booking request has been submitted. The admin will review it and assign an artist shortly.',
        });

        router.push('/account'); // Redirect to customer dashboard
    };

    const handleFetchLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
                    setMapLink(googleMapsUrl);
                    
                    // Mock reverse geocoding for this prototype
                    // In a real app, you'd use a service like Google's Geocoding API
                    toast({
                        title: 'Location Fetched!',
                        description: 'Google Maps link created and location fields auto-filled (mocked).',
                    });
                    
                    // Mocked data based on a sample location
                    setState("Maharashtra");
                    setDistrict("Pune");
                    setLocation("Koregaon Park");
                    setAddress("Near Starbucks, Lane 7, Koregaon Park, Pune, Maharashtra 411001");
                },
                (error) => {
                    toast({
                        title: 'Location Error',
                        description: 'Could not retrieve your location. Please ensure location services are enabled and try again.',
                        variant: 'destructive',
                    });
                    console.error("Geolocation Error:", error);
                }
            );
        } else {
             toast({
                title: 'Location Not Supported',
                description: 'Geolocation is not supported by your browser.',
                variant: 'destructive',
            });
        }
    };


    const availableStates = Object.keys(availableLocations);
    const availableDistricts = state ? availableLocations[state] || [] : [];
    
    return (
        <div className="bg-white min-h-screen">
            <header className="p-4 border-b">
                 <Button variant="outline" asChild>
                    <Link href="/"><ChevronLeft className="mr-2 h-4 w-4"/> Back to Home</Link>
                 </Button>
            </header>
            <main className="max-w-4xl mx-auto p-4 md:p-8">
                 <h1 className="text-3xl font-bold text-primary mb-6">Create Booking</h1>
                <div className="space-y-8">
                    {/* Selected Items */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Your Selection</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {selectedArtist && (
                                <div className="flex items-center justify-between p-2 border rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <Image src={selectedArtist.profilePicture} alt={selectedArtist.name} width={64} height={64} className="rounded-full object-cover aspect-square"/>
                                        <div>
                                            <p className="font-semibold text-lg">{selectedArtist.name}</p>
                                            <p className="text-sm text-muted-foreground">{selectedArtist.services.join(', ')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center text-lg font-bold text-primary">
                                        <IndianRupee className="w-4 h-4 mr-1"/>
                                        <span>{selectedArtist.charge.toLocaleString()}</span>
                                        <span className="text-sm text-muted-foreground ml-1">(base)</span>
                                    </div>
                                </div>
                            )}

                            {selectedPackages.map(pkg => (
                                <div key={pkg.id} className="flex items-center justify-between p-2 border rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <Image src={pkg.image} alt={pkg.name} width={64} height={64} className="rounded-md object-cover aspect-square"/>
                                        <div>
                                            <p className="font-semibold">{pkg.name}</p>
                                            <p className="text-sm text-primary font-bold">₹{pkg.price.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => handleRemovePackage(pkg.id)}>
                                        <Trash2 className="h-5 w-5 text-destructive"/>
                                    </Button>
                                </div>
                            ))}
                            {!selectedArtist && (
                                <Button variant="outline" className="w-full" asChild>
                                    <Link href={`/?packages=${selectedPackages.map(p => p.id).join(',')}`}>+ Add More Packages</Link>
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    {/* Add-ons */}
                    {(primaryServiceType === 'mehndi' || primaryServiceType === 'makeup') && !selectedArtist && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Add-ons</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {primaryServiceType === 'mehndi' && (
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div>
                                        <Label htmlFor="guest-mehndi-switch" className="text-base font-semibold">Would you like to include Guest Mehndi Services?</Label>
                                    </div>
                                    <Switch id="guest-mehndi-switch" checked={includeGuestMehndi} onCheckedChange={setIncludeGuestMehndi}/>
                                </div>
                            )}
                            {includeGuestMehndi && primaryServiceType === 'mehndi' && (
                                <div className="mt-4 flex flex-col md:flex-row items-center gap-4 p-4 border rounded-lg bg-secondary/30">
                                    <Image src="https://picsum.photos/400/400?random=310" alt="Guest Mehndi" width={120} height={120} className="rounded-lg object-cover" data-ai-hint="guest mehndi"/>
                                    <div className="flex-1 space-y-4">
                                        <p className="text-sm text-muted-foreground">Designs-based pricing ranges from ₹200 - ₹600 per side. The final amount will be calculated after service completion based on the designs and number of sides.</p>
                                        <div className="flex items-center gap-4">
                                            <Label>Expected Guest No.</Label>
                                            <div className="flex items-center gap-2 border rounded-full p-1">
                                                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setGuestCount(Math.max(1, guestCount - 1))}><Minus className="h-4 w-4"/></Button>
                                                <span className="font-bold text-lg w-10 text-center">{guestCount}</span>
                                                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setGuestCount(guestCount + 1)}><Plus className="h-4 w-4"/></Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                             {primaryServiceType === 'makeup' && (
                                <div className="flex items-center justify-between p-4 border rounded-lg mt-4">
                                    <div>
                                        <Label htmlFor="guest-makeup-switch" className="text-base font-semibold">Would you like to include Guest Makeup Services?</Label>
                                    </div>
                                    <Switch id="guest-makeup-switch" checked={includeGuestMakeup} onCheckedChange={setIncludeGuestMakeup}/>
                                </div>
                            )}
                            {includeGuestMakeup && primaryServiceType === 'makeup' && (
                                <div className="mt-4 flex flex-col md:flex-row items-center gap-4 p-4 border rounded-lg bg-secondary/30">
                                    <Image src="https://picsum.photos/400/400?random=311" alt="Guest Makeup" width={120} height={120} className="rounded-lg object-cover" data-ai-hint="guest makeup"/>
                                    <div className="flex-1 space-y-4">
                                        <p className="text-sm text-muted-foreground">Party makeup for guests starts at ₹2,500 per person. The final amount depends on the chosen look and will be confirmed by the assigned artist.</p>
                                        <div className="flex items-center gap-4">
                                            <Label>Expected Guest No.</Label>
                                            <div className="flex items-center gap-2 border rounded-full p-1">
                                                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setGuestMakeupCount(Math.max(1, guestMakeupCount - 1))}><Minus className="h-4 w-4"/></Button>
                                                <span className="font-bold text-lg w-10 text-center">{guestMakeupCount}</span>
                                                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setGuestMakeupCount(guestMakeupCount + 1)}><Plus className="h-4 w-4"/></Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    )}

                    {/* Booking Details Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Booking Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Personal Info */}
                            <div className="space-y-2">
                                <Label htmlFor="name">Name*</Label>
                                <Input id="name" value={name} onChange={e => setName(e.target.value)} required/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Contact Number*</Label>
                                <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} required/>
                            </div>
                            
                            {/* Event Details */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="event-type">Event Type*</Label>
                                    <Select value={eventType} onValueChange={setEventType}>
                                        <SelectTrigger id="event-type"><SelectValue placeholder="Select event type"/></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Wedding">Wedding</SelectItem>
                                            <SelectItem value="Engagement">Engagement</SelectItem>
                                            <SelectItem value="Baby Shower">Baby Shower</SelectItem>
                                            <SelectItem value="Festival">Festival</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Primary Date of Event*</Label>
                                    <Popover>
                                        <PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !eventDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4"/>{eventDate ? format(eventDate, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger>
                                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={eventDate} onSelect={setEventDate} initialFocus/></PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-2">
                                    <Label>{dateLabel}</Label>
                                    <Popover>
                                        <PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", serviceDates.length === 0 && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4"/>
                                        {serviceDates.length > 0 ? serviceDates.map(d => format(d, "PPP")).join(', ') : <span>Pick one or more dates</span>}
                                        </Button></PopoverTrigger>
                                        <PopoverContent className="w-auto p-0"><Calendar mode="multiple" selected={serviceDates} onSelect={(dates) => setServiceDates(dates || [])} disabled={(date) => eventDate ? date > eventDate : false} initialFocus/></PopoverContent>
                                    </Popover>
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="time">Time*</Label>
                                    <Input id="time" type="time" value={time} onChange={e => setTime(e.target.value)} required/>
                                </div>
                            </div>
                            
                            {/* Location Details */}
                            <div className="flex items-center gap-2">
                                <Label>Venue Location*</Label>
                                <Button type="button" variant="link" onClick={handleFetchLocation} className="text-xs p-0 h-auto">
                                    <MapPin className="mr-1 h-3 w-3"/> Auto-detect Precise Location
                                </Button>
                            </div>
                             <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="state">State*</Label>
                                    <Select value={state} onValueChange={s => { setState(s); setDistrict(''); }}>
                                        <SelectTrigger id="state"><SelectValue placeholder="Select state"/></SelectTrigger>
                                        <SelectContent>{availableStates.length > 0 ? availableStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>) : <div className="p-2 text-sm text-muted-foreground">No locations available</div>}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="district">District*</Label>
                                    <Select value={district} onValueChange={setDistrict} disabled={!state}>
                                        <SelectTrigger id="district"><SelectValue placeholder="Select district"/></SelectTrigger>
                                        <SelectContent>
                                            {availableDistricts.length > 0 ? (
                                                availableDistricts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)
                                            ) : (
                                                <div className="p-2 text-sm text-muted-foreground">Select a state first</div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="location">Locality / Area*</Label>
                                <Input id="location" placeholder="e.g., Koregaon Park" value={location} onChange={e => setLocation(e.target.value)} required/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address">Full Address*</Label>
                                <Textarea id="address" placeholder="House No, Street, Landmark..." value={address} onChange={e => setAddress(e.target.value)} required/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="map-link">Google Maps Link*</Label>
                                <div className="flex items-center gap-2">
                                    <Input id="map-link" placeholder="Auto-filled or paste location link here" value={mapLink} onChange={e => setMapLink(e.target.value)} required/>
                                </div>
                            </div>
                            
                            {/* Optional Fields */}
                             <div className="space-y-2">
                                <Label htmlFor="note">Notes (Optional)</Label>
                                <Textarea id="note" placeholder="Any special requests or instructions..." value={note} onChange={e => setNote(e.target.value)}/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ref-photo">Reference Photo (Optional)</Label>
                                <div className="relative border-2 border-dashed border-muted-foreground/50 rounded-lg p-4 text-center hover:border-accent cursor-pointer">
                                    <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                                    <p className="mt-2 text-sm text-muted-foreground">Click to upload design reference</p>
                                    <Input id="ref-photo" type="file" className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" />
                                </div>
                            </div>

                            {/* Instagram */}
                             <Accordion type="single" collapsible>
                                <AccordionItem value="instagram">
                                    <AccordionTrigger>
                                        <div className="flex items-center gap-2">
                                            <Instagram className="text-pink-600" />
                                            Instagram Collaboration (Optional)
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <p className="text-sm text-muted-foreground mb-2">We'd love to tag you or collaborate on Instagram! Please share your Instagram ID with us.</p>
                                        <div className="relative">
                                            <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="your_instagram_id" className="pl-9" value={instagramId} onChange={e => setInstagramId(e.target.value)} />
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>

                     {/* Booking Summary */}
                    <BookingSummary packages={selectedPackages} artist={selectedArtist} serviceDates={serviceDates} />

                    {/* Policies */}
                    <div className="p-4 rounded-lg bg-green-50 border border-green-200 flex items-start gap-3">
                         <CheckCircle className="h-5 w-5 text-green-600 mt-1 shrink-0"/>
                         <div>
                            <h3 className="font-semibold text-green-800">Confirmation Policy</h3>
                            <p className="text-sm text-green-700">Please confirm only if you wish to proceed. Bookings are accepted on a first-come, first-serve basis. Dates will be reserved only after receiving an advance payment.</p>
                         </div>
                    </div>
                     <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
                         <AlertCircle className="h-5 w-5 text-red-600 mt-1 shrink-0"/>
                         <div>
                            <h3 className="font-semibold text-red-800">Refund Policy</h3>
                             <p className="text-sm text-red-700">The advance amount is only refunded if the booking is cancelled 72 hours prior to the service date. Later cancellations are non-refundable. This is because the date will be exclusively reserved for you, and no other inquiries will be entertained for that day. Thank you for your understanding.</p>
                         </div>
                    </div>

                    {/* Action */}
                    <Button size="lg" className="w-full !mt-8 text-lg" onClick={handleCreateBooking} disabled={!isFormValid()}>
                       Create Booking & Proceed to Payment
                    </Button>
                </div>
            </main>
        </div>
    )
}
