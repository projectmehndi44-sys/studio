'use client';

import * as React from 'react';
import type { Artist, Booking } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { isSameDay } from 'date-fns';
import { getSafeDate } from '@/lib/utils';

interface AssignArtistModalProps {
  booking: Booking | null;
  artists: Artist[];
  allBookings: Booking[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAssign: (bookingId: string, artistIds: string[]) => void;
}

export function AssignArtistModal({ booking, artists, allBookings, isOpen, onOpenChange, onAssign }: AssignArtistModalProps) {
  const { toast } = useToast();
  const [selectedArtistIds, setSelectedArtistIds] = React.useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;
    if (selectedArtistIds.length === 0) {
      toast({
        title: "No Artist Selected",
        description: "Please select at least one artist to assign to this booking.",
        variant: "destructive",
      });
      return;
    }
    onAssign(booking.id, selectedArtistIds);
    onOpenChange(false);
  };
  
  const handleCheckboxChange = (artistId: string, checked: boolean | 'indeterminate') => {
      setSelectedArtistIds(prev => {
          if (checked) {
              return [...prev, artistId];
          } else {
              return prev.filter(id => id !== artistId);
          }
      });
  }

  React.useEffect(() => {
    if (booking?.artistIds && isOpen) {
      setSelectedArtistIds(booking.artistIds.filter(id => id !== null) as string[]);
    } else {
      setSelectedArtistIds([]);
    }
  }, [booking, isOpen]);

  const unavailableArtistIds = React.useMemo(() => {
    if (!booking) return new Set();
    
    const unavailableIds = new Set<string>();
    const bookingDates = booking.serviceDates.map(d => getSafeDate(d));

    // Add artists who are already booked on any of the same days
    allBookings
        .filter(b => 
            b.id !== booking.id &&
            (b.status === 'Confirmed' || b.status === 'Completed') &&
            b.artistIds.length > 0 &&
            b.serviceDates.some(bookedDate => 
                bookingDates.some(bookingDate => isSameDay(getSafeDate(bookedDate), bookingDate)))
        )
        .forEach(b => b.artistIds.forEach(id => id && unavailableIds.add(id)));

    // Add artists who have marked any of the days as unavailable
    artists.forEach(artist => {
        if (artist.unavailableDates?.some(unavailableDateStr => 
            bookingDates.some(bookingDate => isSameDay(getSafeDate(unavailableDateStr), bookingDate))
        )) {
            unavailableIds.add(artist.id);
        }
    });

    return unavailableIds;
  }, [booking, allBookings, artists]);

  const sortedArtists = React.useMemo(() => {
    if (!booking) return [];
    return [...artists].sort((a, b) => {
        const aIsUnavailable = unavailableArtistIds.has(a.id);
        const bIsUnavailable = unavailableArtistIds.has(b.id);
        if (aIsUnavailable && !bIsUnavailable) return 1;
        if (!aIsUnavailable && bIsUnavailable) return -1;
        
        const aIsLocal = a.district === booking.district;
        const bIsLocal = b.district === booking.district;
        if (aIsLocal && !bIsLocal) return -1;
        if (!aIsLocal && bIsLocal) return 1;
        
        return a.name.localeCompare(b.name);
    });
  }, [artists, booking, unavailableArtistIds]);

  if (!booking) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-primary font-bold text-2xl">{booking.artistIds && booking.artistIds.length > 0 ? 'Change' : 'Assign'} Artists</DialogTitle>
          <DialogDescription>
            Select one or more available artists for booking #{booking.id.substring(0,7)}. Local artists are shown first.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Select Artists</Label>
              <ScrollArea className="h-48 w-full rounded-md border p-4">
                 <div className="space-y-2">
                    {sortedArtists.map(artist => {
                       const isUnavailable = unavailableArtistIds.has(artist.id);
                       const isLocal = artist.district === booking.district;
                       return (
                       <div key={artist.id} className="flex items-center space-x-2">
                           <Checkbox
                                id={`artist-${artist.id}`}
                                checked={selectedArtistIds.includes(artist.id)}
                                onCheckedChange={(checked) => handleCheckboxChange(artist.id, !!checked)}
                                disabled={isUnavailable}
                           />
                           <Label htmlFor={`artist-${artist.id}`} className={`font-normal w-full flex justify-between ${isUnavailable ? 'text-muted-foreground' : ''}`}>
                               <span>{artist.name} <span className="text-xs text-muted-foreground">({artist.location})</span></span>
                               <div className="flex gap-2 items-center">
                               {isLocal && !isUnavailable && <Badge variant="outline">Local</Badge>}
                               {isUnavailable ? (
                                    <Badge variant="destructive">Unavailable</Badge>
                               ) : (
                                    <Badge variant="secondary" className="bg-green-100 text-green-800">Available</Badge>
                               )}
                               </div>
                           </Label>
                       </div>
                       )
                    })}
                 </div>
              </ScrollArea>
            </div>
            <div className='text-sm'>
              <p><span className='font-semibold'>Customer:</span> {booking.customerName}</p>
              <p><span className='font-semibold'>Service:</span> {booking.items.map(i => i.servicePackage.name).join(', ')}</p>
              <p><span className='font-semibold'>Date:</span> {getSafeDate(booking.eventDate).toLocaleDateString()}</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="bg-accent hover:bg-accent/90 w-full">{booking.artistIds && booking.artistIds.length > 0 ? 'Update Assignment' : 'Assign Artists'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
