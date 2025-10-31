'use client';

import * as React from 'react';
import { useArtistPortal } from '../layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Calendar as CalendarIcon, Loader2, Save } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import type { Booking } from '@/lib/types';
import { listenToCollection, updateArtist } from '@/lib/services';
import { getSafeDate } from '@/lib/utils';
import { query, collection, where } from 'firebase/firestore';
import { getDb } from '@/firebase';

export default function ArtistAvailabilityPage() {
    const { artist } = useArtistPortal();
    const { toast } = useToast();
    const [bookings, setBookings] = React.useState<Booking[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [unavailableDates, setUnavailableDates] = React.useState<Date[]>([]);
    const [isSaving, setIsSaving] = React.useState(false);

    React.useEffect(() => {
        if (!artist) return;
        setIsLoading(true);
        setUnavailableDates((artist.unavailableDates || []).map(d => getSafeDate(d)));

        const db = getDb();
        const bookingsQuery = query(collection(db, 'bookings'), where('artistIds', 'array-contains', artist.id));
        const unsub = listenToCollection<Booking>('bookings', (artistBookings) => {
            setBookings(artistBookings);
            setIsLoading(false);
        }, bookingsQuery);

        return () => unsub();
    }, [artist]);
    
    const bookedDates = React.useMemo(() => {
        return bookings
            .filter(b => b.status === 'Confirmed' || b.status === 'Completed')
            .flatMap(b => b.serviceDates?.map(getSafeDate) || []);
    }, [bookings]);

    const handleDayClick = (day: Date, modifiers: { booked?: boolean }) => {
        if (modifiers.booked) {
            toast({
                title: "Booked Date",
                description: "This date is already confirmed for a booking and cannot be marked as unavailable.",
                variant: "default"
            });
            return;
        }

        setUnavailableDates(prev => {
            const isAlreadyUnavailable = prev.some(d => d.getTime() === day.getTime());
            if (isAlreadyUnavailable) {
                return prev.filter(d => d.getTime() !== day.getTime());
            } else {
                return [...prev, day];
            }
        });
    };

    const handleSaveChanges = async () => {
        if (!artist) return;
        setIsSaving(true);
        try {
            // Convert dates to ISO strings for Firestore
            const isoDates = unavailableDates.map(d => d.toISOString());
            await updateArtist(artist.id, { unavailableDates: isoDates });
            toast({
                title: "Availability Updated",
                description: "Your calendar has been saved successfully."
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Could not save your availability. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };


    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin w-8 h-8 text-primary"/></div>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><CalendarIcon className="w-6 h-6 text-primary"/>Your Availability</CardTitle>
                    <CardDescription>View your schedule and manage your days off. Click a date to mark it as unavailable. Click again to make it available.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-6">
                     <div className="flex justify-center">
                           <Calendar
                                mode="multiple"
                                selected={{ booked: bookedDates, unavailable: unavailableDates }}
                                onDayClick={handleDayClick}
                                modifiers={{ booked: bookedDates, unavailable: unavailableDates }}
                                className="rounded-md border"
                                classNames={{
                                    day_modifier_booked: "bg-orange-500 text-white hover:bg-orange-600 focus:bg-orange-600 cursor-not-allowed",
                                    day_modifier_unavailable: "bg-red-500 text-white hover:bg-red-600 focus:bg-red-600"
                                }}
                            />
                        </div>
                     <div className="flex gap-4 items-center self-start">
                        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-orange-500"/><span>Booked Date</span></div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-red-500"/><span>Manually Unavailable</span></div>
                    </div>
                </CardContent>
                 <CardFooter>
                    <Button onClick={handleSaveChanges} disabled={isSaving} className="w-full">
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                        Save Changes
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
