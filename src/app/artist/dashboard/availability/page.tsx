
'use client';

import * as React from 'react';
import type { Artist } from '@/lib/types';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';
import { formatISO, isSameDay, parseISO, isValid } from 'date-fns';
import { useArtistPortal } from '../layout';
import { updateArtist } from '@/lib/services';
import { Timestamp } from 'firebase/firestore';

function getSafeDate(date: any): Date {
    if (!date) return new Date();
    if (date instanceof Date && isValid(date)) return date;
    if (date instanceof Timestamp) return date.toDate();
    if (typeof date === 'string') {
        const parsed = parseISO(date);
        if (isValid(parsed)) return parsed;
    }
    return new Date();
}

export default function ArtistAvailabilityPage() {
    const { artist, setArtist, artistBookings } = useArtistPortal();
    const { toast } = useToast();
    const [unavailableDates, setUnavailableDates] = React.useState<Date[]>([]);
    
    React.useEffect(() => {
        if (artist?.unavailableDates) {
            // Dates from storage are strings, parse them into Date objects.
            const savedDates = artist.unavailableDates.map(dateStr => parseISO(dateStr));
            setUnavailableDates(savedDates);
        }
    }, [artist]);

    const bookedDates = React.useMemo(() => {
        return artistBookings
            .filter(b => b.status === 'Confirmed' || b.status === 'Completed')
            .flatMap(b => b.serviceDates.map(d => getSafeDate(d)));
    }, [artistBookings]);

    const handleSave = async () => {
        if (!artist) return;
        
        try {
             // Convert dates to timezone-agnostic format 'yyyy-MM-dd' for reliable storage
            const datesToSave = unavailableDates.map(d => formatISO(d, { representation: 'date' }));
            
            await updateArtist(artist.id, { unavailableDates: datesToSave });

            if (setArtist) {
                setArtist(prev => prev ? { ...prev, unavailableDates: datesToSave } : null);
            }

            toast({
                title: "Availability Saved",
                description: "Your calendar has been updated successfully.",
            });

        } catch (error) {
             console.error("Failed to save availability:", error);
             toast({ title: "Error", description: "Could not save your availability.", variant: "destructive" });
        }
    };
    
    const handleDayClick = (day: Date, modifiers: { booked?: boolean }) => {
        // Prevent changing dates that are already booked
        if (modifiers.booked) {
             toast({
                title: "Date is Booked",
                description: "You cannot change availability for a date with a confirmed booking.",
                variant: "destructive"
            });
            return;
        }
        
        // Add or remove the date from the unavailable list
        setUnavailableDates(currentDates => {
            const isAlreadyUnavailable = currentDates.some(d => isSameDay(d, day));
            if (isAlreadyUnavailable) {
                return currentDates.filter(d => !isSameDay(d, day));
            } else {
                return [...currentDates, day];
            }
        });
    };


    return (
        <Card>
            <CardHeader>
                <CardTitle>Manage Your Availability</CardTitle>
                <CardDescription>
                   All dates are available by default. Click on a date to toggle its status to unavailable (red). Booked dates (orange) cannot be changed. Click 'Save' to confirm your changes.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-center">
                    <Calendar
                        mode="multiple"
                        selected={unavailableDates}
                        onDayClick={handleDayClick}
                        modifiers={{ 
                            booked: bookedDates,
                        }}
                        classNames={{
                            day_selected: 'bg-red-500 text-white hover:bg-red-600 focus:bg-red-600',
                            day_outside: 'text-muted-foreground opacity-50',
                            day_disabled: 'text-muted-foreground opacity-50',
                            day_modifier_booked: 'bg-orange-500 text-white cursor-not-allowed',
                        }}
                        className="rounded-md border"
                        disabled={{ before: new Date() }}
                    />
                </div>
                 <div className="flex justify-center gap-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-background border"></div>
                        <span className="text-sm">Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-red-500"></div>
                        <span className="text-sm">Unavailable</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                        <span className="text-sm">Booked</span>
                    </div>
                </div>
                 <Button onClick={handleSave} className="w-full">
                    <Save className="mr-2 h-4 w-4" />
                    {unavailableDates.length > (artist?.unavailableDates?.length ?? 0) ? `Save ${unavailableDates.length} Dates as Unavailable` : 'Save Availability'}
                </Button>
            </CardContent>
        </Card>
    );
}
