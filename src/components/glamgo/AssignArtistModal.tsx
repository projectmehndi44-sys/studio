
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '../ui/label';

interface AssignArtistModalProps {
  booking: Booking;
  artists: Artist[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAssign: (bookingId: string, artistId: string, originalArtistId: string | null | undefined) => void;
}

export function AssignArtistModal({ booking, artists, isOpen, onOpenChange, onAssign }: AssignArtistModalProps) {
  const { toast } = useToast();
  const [selectedArtistId, setSelectedArtistId] = React.useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArtistId) {
      toast({
        title: "No Artist Selected",
        description: "Please select an artist to assign to this booking.",
        variant: "destructive",
      });
      return;
    }
    onAssign(booking.id, selectedArtistId, booking.artistId);
    onOpenChange(false);
  };

  React.useEffect(() => {
    // Pre-fill the dropdown if an artist is already assigned
    if (booking?.artistId) {
      setSelectedArtistId(booking.artistId);
    } else {
      setSelectedArtistId(null);
    }
  }, [booking]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-primary font-bold text-2xl">{booking.artistId ? 'Change' : 'Assign'} Artist</DialogTitle>
          <DialogDescription>
            Select an available artist for booking #{booking.id}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Select Artist</Label>
              <Select onValueChange={setSelectedArtistId} value={selectedArtistId ?? undefined}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an artist" />
                </SelectTrigger>
                <SelectContent>
                  {artists.map(artist => (
                    <SelectItem key={artist.id} value={artist.id}>
                      <div className="flex items-center gap-2">
                        <span>{artist.name}</span>
                        <span className="text-xs text-muted-foreground">({artist.location})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='text-sm'>
              <p><span className='font-semibold'>Customer:</span> {booking.customerName}</p>
              <p><span className='font-semibold'>Service:</span> {booking.service}</p>
              <p><span className='font-semibold'>Date:</span> {booking.date.toLocaleDateString()}</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="bg-accent hover:bg-accent/90 w-full">{booking.artistId ? 'Change' : 'Assign'} Artist</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
