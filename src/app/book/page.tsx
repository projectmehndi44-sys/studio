
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

import { packages as allPackages } from '@/lib/packages-data';
import { INDIA_LOCATIONS } from '@/lib/india-locations';
import type { MehndiPackage, Booking } from '@/types';

import { Calendar as CalendarIcon, ChevronLeft, Minus, Plus, Trash2, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { BookingSummary } from '@/components/glamgo/BookingSummary';


export default function BookingPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();

    const [selectedPackages, setSelectedPackages] = React.useState<MehndiPackage[]>([]);
    const [availableLocations, setAvailableLocations] = React.useState<Record<string, string[]>>({});
    
    // Form state
    const [name, setName] = React.useState('');
    const [eventType, setEventType] = React.useState('');
    const [eventDate, setEventDate] = React.useState<Date>();
    const [mehndiDate, setMehndiDate] = React.useState<Date>();
    const [time, setTime] = React.useState('');
    const [state, setState] = React.useState('');
    const [district, setDistrict] = React.useState('');
    const [location, setLocation] = React.useState('');
    const [address, setAddress] = React.useState('');
    const [mapLink, setMapLink] = React.useState('');
    const [note, setNote] = React.useState('');
    
    const [includeGuestMehndi, setIncludeGuestMehndi] = React.useState(false);
    const [guestCount, setGuestCount] = React.useState(1);

    React.useEffect(() => {
        const packageIds = searchParams.get('packages')?.split(',');
        if (packageIds) {
            const packages = allPackages.filter(p => packageIds.includes(p.id));
            setSelectedPackages(packages);
        }

        const savedLocations = localStorage.getItem('availableLocations');
        if (savedLocations) {
            setAvailableLocations(JSON.parse(savedLocations));
        } else {
            // Fallback to all of India if not set by admin
            setAvailableLocations(INDIA_LOCATIONS);
        }
    }, [searchParams]);

    const handleRemovePackage = (packageId: string) => {
        const updatedPackages = selectedPackages.filter(p => p.id !== packageId);
        setSelectedPackages(updatedPackages);
        
        // Update URL without reloading page
        const newPackageIds = updatedPackages.map(p => p.id).join(',');
        if (newPackageIds) {
            router.replace(`/book?packages=${newPackageIds}`);
        } else {
            router.push('/');
        }
    };
    
    const isFormValid = () => {
        return (
            name &&
            eventType &&
            eventDate &&
            mehndiDate &&
            time &&
            state &&
            district &&
            location &&
            address &&
            selectedPackages.length > 0
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

        // Create booking object
        const newBooking: Booking = {
            id: `book_${Date.now()}`,
            artistIds: [], // To be assigned by admin
            customerName: name,
            customerContact: '', // Assuming phone is captured during login/signup
            serviceAddress: address,
            date: mehndiDate!,
            service: selectedPackages.map(p => p.name).join(', '),
            amount: selectedPackages.reduce((sum, p) => sum + p.price, 0),
            status: 'Needs Assignment',
            eventType,
            eventDate: eventDate!,
            state,
            district,
            location,
            mapLink: mapLink || '',
            note: note || '',
            guestMehndi: {
                included: includeGuestMehndi,
                expectedCount: includeGuestMehndi ? guestCount : 0,
            }
        };

        const allBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        localStorage.setItem('bookings', JSON.stringify([newBooking, ...allBookings]));
        window.dispatchEvent(new Event('storage'));

        toast({
            title: 'Booking Created!',
            description: 'Your booking request has been submitted. The admin will review it and assign an artist shortly.',
        });

        router.push('/'); // Redirect to payment or a confirmation page in a real app
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
                <div className="space-y-8">
                    {/* Selected Items */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Your Selected Packages ({selectedPackages.length})</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
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
                             <Button variant="outline" className="w-full" asChild><Link href="/">+ Add More Packages</Link></Button>
                        </CardContent>
                    </Card>

                    {/* Add-ons */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Add-ons</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <Label htmlFor="guest-mehndi-switch" className="text-base font-semibold">Would you like to include Guest Mehndi Services?</Label>
                                </div>
                                <Switch id="guest-mehndi-switch" checked={includeGuestMehndi} onCheckedChange={setIncludeGuestMehndi}/>
                            </div>
                            {includeGuestMehndi && (
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
                        </CardContent>
                    </Card>

                    {/* Booking Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Booking Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div><Label htmlFor="name">Name*</Label><Input id="name" value={name} onChange={e => setName(e.target.value)} required/></div>
                                <div><Label htmlFor="event-type">Event Type*</Label>
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
                                <div><Label>Date of Event*</Label>
                                <Popover>
                                    <PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !eventDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4"/>{eventDate ? format(eventDate, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger>
                                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={eventDate} onSelect={setEventDate} initialFocus/></PopoverContent>
                                </Popover>
                                </div>
                                <div><Label>Date to Put Mehndi*</Label>
                                 <Popover>
                                    <PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !mehndiDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4"/>{mehndiDate ? format(mehndiDate, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger>
                                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={mehndiDate} onSelect={setMehndiDate} disabled={(date) => eventDate ? date > eventDate : false} initialFocus/></PopoverContent>
                                </Popover>
                                </div>
                                <div><Label htmlFor="time">Time*</Label><Input id="time" type="time" value={time} onChange={e => setTime(e.target.value)} required/></div>
                                <div><Label htmlFor="state">State*</Label>
                                 <Select value={state} onValueChange={s => { setState(s); setDistrict(''); }}>
                                    <SelectTrigger id="state"><SelectValue placeholder="Select state"/></SelectTrigger>
                                    <SelectContent>{availableStates.length > 0 ? availableStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>) : <SelectItem value="" disabled>No locations available</SelectItem>}</SelectContent>
                                </Select>
                                </div>
                                 <div><Label htmlFor="district">District*</Label>
                                <Select value={district} onValueChange={setDistrict} disabled={!state}>
                                    <SelectTrigger id="district"><SelectValue placeholder="Select district"/></SelectTrigger>
                                    <SelectContent>{availableDistricts.length > 0 ? availableDistricts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>) : <SelectItem value="" disabled>Select a state first</SelectItem>}</SelectContent>
                                </Select>
                                </div>
                                <div><Label htmlFor="location">Locality / Area*</Label><Input id="location" placeholder="e.g., Koregaon Park" value={location} onChange={e => setLocation(e.target.value)} required/></div>
                            </div>
                            <div><Label htmlFor="address">Full Address*</Label><Textarea id="address" placeholder="House No, Street, Landmark..." value={address} onChange={e => setAddress(e.target.value)} required/></div>
                            <div><Label htmlFor="map-link">Google Maps Link (Optional)</Label><Input id="map-link" placeholder="Paste location link here" value={mapLink} onChange={e => setMapLink(e.target.value)}/></div>
                            <div><Label htmlFor="note">Note (Optional)</Label><Textarea id="note" placeholder="Any special requests or instructions..." value={note} onChange={e => setNote(e.target.value)}/></div>
                             <div>
                                <Label htmlFor="ref-photo">Reference Photo (Optional)</Label>
                                <div className="relative border-2 border-dashed border-muted-foreground/50 rounded-lg p-4 text-center hover:border-accent cursor-pointer">
                                    <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                                    <p className="mt-2 text-sm text-muted-foreground">Click to upload design reference</p>
                                    <Input id="ref-photo" type="file" className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                     {/* Booking Summary */}
                    <BookingSummary packages={selectedPackages} />

                    {/* Policies */}
                    <Card className="bg-amber-50 border-amber-200">
                        <CardHeader>
                            <CardTitle className="text-amber-800">Confirmation Policy</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-amber-700">Please confirm only if you wish to proceed. Bookings are accepted on a first-come, first-serve basis. Dates will be reserved only after receiving an advance payment.</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-red-50 border-red-200">
                        <CardHeader>
                            <CardTitle className="text-red-800">Refund Policy</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <p className="text-sm text-red-700">The advance amount is only refunded if the booking is cancelled 72 hours prior to the service date. Later cancellations are non-refundable. This is because the date will be exclusively reserved for you, and no other inquiries will be entertained for that day. Thank you for your understanding.</p>
                        </CardContent>
                    </Card>

                    {/* Action */}
                    <Button size="lg" className="w-full" onClick={handleCreateBooking} disabled={!isFormValid()}>
                       Create Booking & Proceed to Payment
                    </Button>
                </div>
            </main>
        </div>
    )
}

    