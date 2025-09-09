

'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';

import { AVAILABLE_LOCATIONS } from '@/lib/available-locations';
import type { Booking, Artist, Customer, CartItem } from '@/types';

import { Calendar as CalendarIcon, ChevronLeft, Trash2, Upload, MapPin, Instagram, CheckCircle, AlertCircle, IndianRupee } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

export default function CartPage() {
    const router = useRouter();
    const { toast } = useToast();

    const [cart, setCart] = React.useState<CartItem[]>([]);
    const [availableLocations, setAvailableLocations] = React.useState<Record<string, string[]>>({});
    const [customer, setCustomer] = React.useState<Customer | null>(null);
    
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

    React.useEffect(() => {
        const customerId = localStorage.getItem('currentCustomerId');
        if (!customerId) {
            router.push('/');
            toast({ title: "Please login to continue", variant: "destructive" });
            return;
        }

        const allCustomers: Customer[] = JSON.parse(localStorage.getItem('customers') || '[]');
        const currentCustomer = allCustomers.find(c => c.id === customerId);
        if (currentCustomer) {
            setCustomer(currentCustomer);
            setName(currentCustomer.name);
            setPhone(currentCustomer.phone);

            const storedCart = localStorage.getItem(`cart_${customerId}`);
            setCart(storedCart ? JSON.parse(storedCart) : []);
        } else {
             router.push('/');
             toast({ title: "Could not find customer data.", variant: "destructive" });
        }

        const savedLocations = localStorage.getItem('availableLocations');
        setAvailableLocations(savedLocations ? JSON.parse(savedLocations) : AVAILABLE_LOCATIONS);
    }, [router, toast]);


    const handleRemoveFromCart = (index: number) => {
        const newCart = cart.filter((_, i) => i !== index);
        setCart(newCart);
        if (customer) {
            localStorage.setItem(`cart_${customer.id}`, JSON.stringify(newCart));
        }
    };
    
    const isFormValid = () => {
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
            cart.length > 0
        );
    }

    const handleCreateBooking = () => {
        if (!isFormValid() || !customer) return;

        let totalAmount = 0;
        const artistIds = new Set<string>();
        let serviceDescription = '';

        cart.forEach(item => {
            if(item.artist) {
                const offering = item.artist.serviceOfferings?.find(o => o.masterPackageId === item.masterPackage.id && o.categoryName === item.category.name);
                totalAmount += offering?.artistPrice || item.category.basePrice;
                artistIds.add(item.artist.id);
            } else {
                totalAmount += item.category.basePrice;
            }
        });
        
        serviceDescription = cart.map(item => `${item.masterPackage.name} (${item.category.name})`).join(', ');

        const newBooking: Booking = {
            id: `book_${Date.now()}`,
            customerId: customer.id,
            artistIds: Array.from(artistIds),
            customerName: name,
            customerContact: phone,
            serviceAddress: address,
            serviceDates: serviceDates,
            date: serviceDates[0],
            service: serviceDescription,
            amount: totalAmount,
            status: artistIds.size > 0 ? 'Pending Approval' : 'Needs Assignment',
            eventType,
            eventDate: eventDate!,
            state,
            district,
            location,
            mapLink,
            note,
            instagramId,
        };

        const allBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        localStorage.setItem('bookings', JSON.stringify([newBooking, ...allBookings]));
        localStorage.removeItem(`cart_${customer.id}`);
        window.dispatchEvent(new Event('storage'));

        toast({
            title: 'Booking Created!',
            description: 'Your booking request has been submitted. The admin will review it shortly.',
        });

        router.push('/account');
    };

    const handleFetchLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
                    setMapLink(googleMapsUrl);
                    toast({
                        title: 'Location Fetched!',
                        description: 'Google Maps link created. Please fill in your address details manually.',
                    });
                },
                () => {
                    toast({
                        title: 'Location Error',
                        description: 'Could not retrieve your location.',
                        variant: 'destructive',
                    });
                }
            );
        } else {
             toast({
                title: 'Location Not Supported',
                variant: 'destructive',
            });
        }
    };


    const availableStates = Object.keys(availableLocations);
    const availableDistricts = state ? availableLocations[state] || [] : [];
    
    const subtotal = cart.reduce((sum, item) => {
        if(item.artist) {
            const offering = item.artist.serviceOfferings?.find(o => o.masterPackageId === item.masterPackage.id && o.categoryName === item.category.name);
            return sum + (offering?.artistPrice || item.category.basePrice);
        }
        return sum + item.category.basePrice;
    }, 0);

    const taxes = subtotal * 0.18; // Assuming 18% GST
    const total = subtotal + taxes;
    
    return (
        <div className="bg-background min-h-screen">
            <header className="p-4 border-b">
                 <Button variant="outline" asChild>
                    <Link href="/"><ChevronLeft className="mr-2 h-4 w-4"/> Back to Home</Link>
                 </Button>
            </header>
            <main className="max-w-4xl mx-auto p-4 md:p-8">
                 <h1 className="text-3xl font-bold text-primary mb-6">Your Cart & Booking</h1>
                {cart.length === 0 ? (
                     <Card className="text-center p-8">
                        <CardTitle>Your Cart is Empty</CardTitle>
                        <CardDescription className="mt-2">You haven't selected any services yet.</CardDescription>
                        <Button asChild className="mt-4"><Link href="/">Browse Services</Link></Button>
                    </Card>
                ) : (
                <div className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Your Selection</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {cart.map((item, index) => {
                                let price = item.category.basePrice;
                                let artistName = <span className="text-muted-foreground">Artist will be assigned</span>;

                                if (item.artist) {
                                     const offering = item.artist.serviceOfferings?.find(o => o.masterPackageId === item.masterPackage.id && o.categoryName === item.category.name);
                                     price = offering?.artistPrice || item.category.basePrice;
                                     artistName = <span>with <span className="font-semibold text-accent">{item.artist.name}</span></span>;
                                }

                                return (
                                    <div key={`${item.masterPackage.id}-${index}`} className="flex items-start justify-between p-2 border rounded-lg">
                                        <div className="flex items-start gap-4">
                                            <Image src={item.masterPackage.image} alt={item.masterPackage.name} width={64} height={64} className="rounded-md object-cover aspect-square"/>
                                            <div>
                                                <p className="font-semibold">{item.masterPackage.name} <Badge variant="secondary">{item.category.name}</Badge></p>
                                                <p className="text-sm text-muted-foreground">{artistName}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-lg font-bold text-primary flex items-center">
                                                <IndianRupee className="w-4 h-4 mr-0.5"/>
                                                {price.toLocaleString()}
                                            </p>
                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveFromCart(index)}>
                                                <Trash2 className="h-5 w-5 text-destructive"/>
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Booking Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name*</Label>
                                <Input id="name" value={name} onChange={e => setName(e.target.value)} required/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Contact Number*</Label>
                                <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} required/>
                            </div>
                            
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
                                    <Label>Date(s) for Service(s)*</Label>
                                    <Popover>
                                        <PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", serviceDates.length === 0 && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4"/>
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

                    <Card className="bg-muted/50">
                        <CardHeader>
                            <CardTitle>Final Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Subtotal (Pre-tax)</span>
                                    <span>₹{subtotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">GST (18%)</span>
                                    <span>₹{taxes.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total Amount</span>
                                <span>₹{total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                            </div>
                        </CardContent>
                    </Card>

                     <Alert variant="default" className="bg-green-50 border-green-200 text-green-800">
                        <CheckCircle className="h-4 w-4 !text-green-600" />
                        <AlertTitle className="font-bold">Confirmation Policy</AlertTitle>
                        <AlertDescription>
                           Dates are reserved only after an advance payment. Bookings are first-come, first-serve. Please confirm only if you wish to proceed.
                        </AlertDescription>
                    </Alert>
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle className="font-bold">Refund Policy</AlertTitle>
                        <AlertDescription>
                           The advance amount is only refunded if the booking is cancelled 72 hours prior to the service date. This is because the date will be exclusively reserved for you. Thank you for your understanding.
                        </AlertDescription>
                    </Alert>
                    <Button onClick={handleCreateBooking} disabled={!isFormValid()} size="lg" className="w-full">Confirm &amp; Proceed to Payment</Button>
                </div>
                )}
            </main>
        </div>
    );
}
