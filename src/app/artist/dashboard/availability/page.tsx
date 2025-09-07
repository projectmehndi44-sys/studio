
'use client';

import * as React from 'react';
import type { Artist } from '@/types';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';
import { artists as initialArtists } from '@/lib/data';
import { formatISO, isSameDay } from 'date-fns';
import { useArtistPortal } from '../layout';
import { Badge } from '@/components/ui/badge';


export default function ArtistAvailabilityPage() {
    const { artist, setArtist, artistBookings } = useArtistPortal();
    const { toast } = useToast();
    const [unavailableDates, setUnavailableDates] = React.useState<Date[]>([]);
    
    React.useEffect(() => {
        if (artist?.unavailableDates) {
            // Dates from storage are strings, convert them back to Date objects, accounting for timezone.
            const savedDates = artist.unavailableDates.map(dateStr => {
                const [year, month, day] = dateStr.split('-').map(Number);
                return new Date(year, month - 1, day);
            });
            setUnavailableDates(savedDates);
        }
    }, [artist]);

    const bookedDates = React.useMemo(() => {
        return artistBookings
            .filter(b => b.status === 'Confirmed' || b.status === 'Completed')
            .map(b => new Date(b.date));
    }, [artistBookings]);
    
    const getArtists = (): Artist[] => {
         const storedArtists = localStorage.getItem('artists');
         const localArtists: Artist[] = storedArtists ? JSON.parse(storedArtists) : [];
         const allArtistsMap = new Map<string, Artist>();
         initialArtists.forEach(a => allArtistsMap.set(a.id, a));
         localArtists.forEach(a => allArtistsMap.set(a.id, a));
         return Array.from(allArtistsMap.values());
    }
    
    const saveArtists = (artists: Artist[]) => {
        const artistsToStore = artists.filter(a => {
            const initial = initialArtists.find(ia => ia.id === a.id);
            if (!initial) return true;
            return JSON.stringify(initial) !== JSON.stringify(a);
        });
        localStorage.setItem('artists', JSON.stringify(artistsToStore));
        window.dispatchEvent(new Event('storage'));
    };

    const handleSave = () => {
        if (!artist) return;
        
        const allArtists = getArtists();
        const artistIndex = allArtists.findIndex(a => a.id === artist.id);
        
        if (artistIndex === -1) {
            toast({ title: "Error", description: "Could not find your profile to update.", variant: "destructive" });
            return;
        }

        // Convert dates to timezone-agnostic format 'yyyy-MM-dd' for storage
        const datesToSave = unavailableDates.map(d => formatISO(d, { representation: 'date' }));
        const updatedArtist = { ...allArtists[artistIndex], unavailableDates: datesToSave };
        
        allArtists[artistIndex] = updatedArtist;
        saveArtists(allArtists);
        setArtist(updatedArtist);

        toast({
            title: "Availability Saved",
            description: "Your calendar has been updated successfully.",
        });
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
        const isUnavailable = unavailableDates.some(d => isSameDay(d, day));
        if (isUnavailable) {
            setUnavailableDates(prev => prev.filter(d => !isSameDay(d, day)));
        } else {
            setUnavailableDates(prev => [...prev, day]);
        }
    };


    return (
        <Card>
            <CardHeader>
                <CardTitle>Manage Your Availability</CardTitle>
                <CardDescription>
                   Click on a date to toggle its status. Booked dates cannot be changed.
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
                            available: { from: new Date(), disabled: [...bookedDates, ...unavailableDates] }
                        }}
                        modifiersClassNames={{
                            selected: 'bg-red-500 text-white hover:bg-red-600 focus:bg-red-600',
                            booked: 'bg-orange-500 text-white cursor-not-allowed',
                            available: 'bg-green-100'
                        }}
                        className="rounded-md border"
                        disabled={{ before: new Date() }}
                    />
                </div>
                 <div className="flex justify-center gap-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-green-100 border"></div>
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
                    <Save className="mr-2 h-4 w-4" /> Save Availability
                </Button>
            </CardContent>
        </Card>
    );
}
