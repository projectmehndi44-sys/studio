
'use client';

import * as React from 'react';
import type { Artist } from '@/types';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';
import { artists as initialArtists } from '@/lib/data';
import { formatISO } from 'date-fns';

interface ArtistAvailabilityPageProps {
    artist: Artist;
    setArtist: React.Dispatch<React.SetStateAction<Artist | null>>;
}

export default function ArtistAvailabilityPage({ artist: initialArtistData, setArtist }: ArtistAvailabilityPageProps) {
    const { toast } = useToast();
    const [unavailableDates, setUnavailableDates] = React.useState<Date[]>([]);
    
    React.useEffect(() => {
        if (initialArtistData?.unavailableDates) {
            setUnavailableDates(initialArtistData.unavailableDates.map(d => new Date(d)));
        }
    }, [initialArtistData]);
    
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
        const allArtists = getArtists();
        const artistIndex = allArtists.findIndex(a => a.id === initialArtistData.id);
        
        if (artistIndex === -1) {
            toast({ title: "Error", description: "Could not find your profile to update.", variant: "destructive" });
            return;
        }

        // Convert dates to timezone-agnostic format 'yyyy-MM-dd'
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

    return (
        <Card>
            <CardHeader>
                <CardTitle>Manage Your Availability</CardTitle>
                <CardDescription>
                    Select dates you are unavailable. Customers won't be able to book you on these days, and admins won't assign you to bookings.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-center">
                    <Calendar
                        mode="multiple"
                        selected={unavailableDates}
                        onSelect={setUnavailableDates}
                        className="rounded-md border"
                        disabled={{ before: new Date() }}
                    />
                </div>
                 <Button onClick={handleSave} className="w-full">
                    <Save className="mr-2 h-4 w-4" /> Save Availability
                </Button>
            </CardContent>
        </Card>
    );
}
