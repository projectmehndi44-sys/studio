
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm, UseFormReturn } from "react-hook-form";
import * as z from "zod";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { CalendarIcon, Minus, Plus, MapPin } from "lucide-react";
import { Calendar } from "../ui/calendar";
import { format } from "date-fns";
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import type { Artist } from "@/lib/types";
import { Badge } from "../ui/badge";
import React from "react";
import { MapPicker } from "../utsavlook/MapPicker";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";

export const bookingFormSchema = z.object({
    name: z.string().min(2, { message: "Name is required."}),
    eventType: z.string().min(2, { message: "Event type is required." }),
    eventDate: z.date({ required_error: "Event date is required." }),
    serviceDates: z.array(z.date()).min(1, { message: "At least one service date is required." }),
    state: z.string().min(1, "State is required."),
    district: z.string().min(1, "District is required."),
    locality: z.string().min(1, "Locality/neighborhood is required."),
    address: z.string().min(10, { message: "Please enter a full valid address." }),
    mapLink: z.string().url({ message: "Please enter a valid Google Maps URL."}).optional().or(z.literal('')),
    contact: z.string().regex(/^(\+91)?\d{10}$/, { message: "Must be a valid 10-digit phone number, optionally with +91." }),
    alternateContact: z.string().optional(),
    travelCharges: z.coerce.number().min(0).optional(),
    guestMehndi: z.object({
        included: z.boolean().default(false),
        expectedCount: z.coerce.number().min(0).default(0),
    }).optional(),
    guestMakeup: z.object({
        included: z.boolean().default(false),
        expectedCount: z.coerce.number().min(0).default(0),
    }).optional(),
    notes: z.string().optional(),
});

export type BookingFormValues = z.infer<typeof bookingFormSchema>;

interface BookingFormProps {
    form: UseFormReturn<BookingFormValues>;
    availableLocations: Record<string, string[]>;
    showGuestFields: {
        mehndi: boolean;
        makeup: boolean;
    }
    artists: Artist[];
}


export const BookingForm = ({ form, availableLocations, showGuestFields, artists }: BookingFormProps) => {
    
    const [isMapOpen, setIsMapOpen] = React.useState(false);
    const availableStates = Object.keys(availableLocations);
    const watchedState = form.watch('state');
    const watchedDistrict = form.watch('district');
    const districtsForState = watchedState ? availableLocations[watchedState] : [];

    const suggestedLocalities = React.useMemo(() => {
        if (!watchedDistrict || artists.length === 0) return [];
        
        const localities = new Set<string>();
        artists.forEach(artist => {
            artist.serviceAreas?.forEach(area => {
                if (area.district === watchedDistrict) {
                    area.localities.split(',').forEach(loc => {
                        const trimmedLoc = loc.trim();
                        if (trimmedLoc) localities.add(trimmedLoc);
                    });
                }
            });
        });
        return Array.from(localities);
    }, [artists, watchedDistrict]);

    const handleSuggestionClick = (locality: string) => {
        const currentLocalities = form.getValues('locality') || '';
        const newLocalities = currentLocalities ? `${currentLocalities}, ${locality}` : locality;
        form.setValue('locality', newLocalities, { shouldValidate: true });
    };

    const handleLocationSelect = (location: { address: string, url: string }) => {
        form.setValue('address', location.address, { shouldValidate: true });
        form.setValue('mapLink', location.url, { shouldValidate: true });
        setIsMapOpen(false);
    };


    const GuestServiceToggle = ({ serviceType }: { serviceType: 'mehndi' | 'makeup' }) => {
        const fieldName = `guest${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)}` as 'guestMehndi' | 'guestMakeup';
        const isIncluded = form.watch(`${fieldName}.included`);

        return (
            <Card className="p-4 bg-muted/50">
                <div className="flex items-center justify-between">
                     <FormLabel>Add Guest {serviceType.charAt(0).toUpperCase() + serviceType.slice(1)}</FormLabel>
                     <FormField
                        control={form.control}
                        name={`${fieldName}.included`}
                        render={({ field }) => (
                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        )}
                    />
                </div>
                 {isIncluded && (
                    <div className="mt-4 space-y-2">
                        <FormField
                            control={form.control}
                            name={`${fieldName}.expectedCount`}
                            render={({ field }) => (
                                <FormItem>
                                     <FormLabel>Number of Guests</FormLabel>
                                     <div className="flex items-center gap-2">
                                         <Button type="button" size="icon" variant="outline" onClick={() => field.onChange(Math.max(0, (field.value || 0) - 1))}><Minus className="h-4 w-4"/></Button>
                                         <FormControl><Input type="number" className="w-16 text-center" {...field} /></FormControl>
                                         <Button type="button" size="icon" variant="outline" onClick={() => field.onChange((field.value || 0) + 1)}><Plus className="h-4 w-4"/></Button>
                                     </div>
                                </FormItem>
                            )}
                        />
                        <FormDescription className="text-xs">
                           Final price (approx. ₹200-₹1000 per side for Mehendi) to be decided with the artist and paid at the venue.
                        </FormDescription>
                    </div>
                )}
            </Card>
        )
    }

    return (
        <>
        <Card className="shadow-lg rounded-lg">
            <CardHeader>
                <CardTitle>Booking Details</CardTitle>
                <CardDescription>Please provide the details for your event.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form className="space-y-6">
                        {/* Guest Add-ons */}
                        {(showGuestFields.mehndi || showGuestFields.makeup) && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-primary">Guest Services</h3>
                                {showGuestFields.mehndi && <GuestServiceToggle serviceType="mehndi" />}
                                {showGuestFields.makeup && <GuestServiceToggle serviceType="makeup" />}
                                 <FormDescription>Note: Customizations like portraits for mehndi are available with extra charges to be decided with the artist.</FormDescription>
                            </div>
                        )}
                        
                        <h3 className="text-lg font-semibold text-primary pt-4 border-t">Event Information</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Your full name" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                            <FormField control={form.control} name="eventType" render={({ field }) => ( <FormItem><FormLabel>Event Type</FormLabel><FormControl><Input placeholder="e.g. Wedding, Sangeet" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                        </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <FormField control={form.control} name="eventDate" render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>Main Event Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal",!field.value && "text-muted-foreground" )}>{field.value ? (format(field.value, "PPP")) : (<span>Pick a date</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date()} initialFocus/></PopoverContent></Popover><FormMessage /></FormItem>)}/>
                             <FormField control={form.control} name="serviceDates" render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>Service Delivery Date(s)</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal",!field.value?.length && "text-muted-foreground" )}>{field.value?.length ? (field.value.map(d => format(d, "PPP")).join(', ')) : (<span>Select service dates</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="multiple" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date()}/></PopoverContent></Popover><FormMessage /></FormItem>)}/>
                        </div>
                        
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <FormField control={form.control} name="state" render={({ field }) => ( <FormItem><FormLabel>State</FormLabel><Select onValueChange={(v) => {field.onChange(v); form.setValue('district', ''); form.setValue('locality', '');}} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select state"/></SelectTrigger></FormControl><SelectContent>{availableStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                             <FormField control={form.control} name="district" render={({ field }) => ( <FormItem><FormLabel>District</FormLabel><Select onValueChange={(v) => {field.onChange(v); form.setValue('locality', '');}} value={field.value} disabled={!watchedState}><FormControl><SelectTrigger><SelectValue placeholder="Select district"/></SelectTrigger></FormControl><SelectContent>{districtsForState.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                        </div>

                         <FormField control={form.control} name="locality" render={({ field }) => ( 
                             <FormItem>
                                <FormLabel>Locality / Area</FormLabel>
                                <FormControl><Input placeholder="e.g. Koregaon Park" {...field}/></FormControl>
                                {suggestedLocalities.length > 0 && (
                                    <div className="pt-2">
                                        <p className="text-xs text-muted-foreground mb-2">Suggestions:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {suggestedLocalities.map(loc => (
                                                <Badge key={loc} variant="outline" className="cursor-pointer" onClick={() => handleSuggestionClick(loc)}>{loc}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <FormMessage />
                            </FormItem> 
                        )}/>

                        <FormField control={form.control} name="address" render={({ field }) => ( 
                            <FormItem>
                                <FormLabel>Full Service Address</FormLabel>
                                <div className="flex gap-2">
                                    <FormControl><Textarea placeholder="Building name, street, landmark..." {...field} /></FormControl>
                                    <Button type="button" variant="outline" className="h-auto" onClick={() => setIsMapOpen(true)}>
                                        <MapPin className="mr-2 h-4 w-4"/> Pin on Map
                                    </Button>
                                </div>
                                <FormMessage />
                            </FormItem> 
                        )}/>
                        <FormField control={form.control} name="mapLink" render={({ field }) => ( 
                            <FormItem>
                                <FormLabel>Google Maps Link (Optional)</FormLabel>
                                <FormControl><Input placeholder="Auto-filled from map or paste precise location link" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem> 
                        )}/>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField control={form.control} name="contact" render={({ field }) => ( <FormItem><FormLabel>Contact Number</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                            <FormField control={form.control} name="alternateContact" render={({ field }) => ( <FormItem><FormLabel>Alternate Number (Optional)</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                        </div>

                        <FormField control={form.control} name="notes" render={({ field }) => ( <FormItem><FormLabel>Additional Notes (Optional)</FormLabel><FormControl><Textarea placeholder="Any special requests or instructions for the artists..." {...field} /></FormControl><FormMessage /></FormItem>)}/>

                    </form>
                </Form>
            </CardContent>
        </Card>
        <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
            <DialogContent className="sm:max-w-3xl h-[80vh]">
                <DialogHeader>
                    <DialogTitle>Pin Venue Location</DialogTitle>
                    <DialogDescription>Search for your venue or drag the pin to the exact location. Click "Confirm Location" when done.</DialogDescription>
                </DialogHeader>
                <div className="h-full py-4">
                    <MapPicker onLocationSelect={handleLocationSelect} />
                </div>
            </DialogContent>
        </Dialog>
        </>
    );
};
