
'use client';

import * as React from 'react';
import type { Artist, Booking } from '@/types';
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

interface AssignArtistModalProps {
  booking: Booking;
  artists: Artist[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAssign: (bookingId: string, artistIds: string[]) => void;
}

export function AssignArtistModal({ booking, artists, isOpen, onOpenChange, onAssign }: AssignArtistModalProps) {
  const { toast } = useToast();
  const [selectedArtistIds, setSelectedArtistIds] = React.useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
    // Pre-fill the checkboxes if artists are already assigned
    if (booking?.artistIds) {
      setSelectedArtistIds(booking.artistIds.filter(id => id !== null) as string[]);
    } else {
      setSelectedArtistIds([]);
    }
  }, [booking]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-primary font-bold text-2xl">{booking.artistIds.length > 0 ? 'Change' : 'Assign'} Artists</DialogTitle>
          <DialogDescription>
            Select one or more available artists for booking #{booking.id}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Select Artists</Label>
              <ScrollArea className="h-48 w-full rounded-md border p-4">
                 <div className="space-y-2">
                    {artists.map(artist => (
                       <div key={artist.id} className="flex items-center space-x-2">
                           <Checkbox
                                id={`artist-${artist.id}`}
                                checked={selectedArtistIds.includes(artist.id)}
                                onCheckedChange={(checked) => handleCheckboxChange(artist.id, checked)}
                           />
                           <Label htmlFor={`artist-${artist.id}`} className="font-normal w-full flex justify-between">
                               <span>{artist.name}</span>
                               <span className="text-xs text-muted-foreground">({artist.location})</span>
                           </Label>
                       </div>
                    ))}
                 </div>
              </ScrollArea>
            </div>
            <div className='text-sm'>
              <p><span className='font-semibold'>Customer:</span> {booking.customerName}</p>
              <p><span className='font-semibold'>Service:</span> {booking.service}</p>
              <p><span className='font-semibold'>Date:</span> {booking.date.toLocaleDateString()}</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="bg-accent hover:bg-accent/90 w-full">{booking.artistIds.length > 0 ? 'Update Assignment' : 'Assign Artists'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
