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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface BookingModalProps {
  artist: Artist;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function BookingModal({ artist, isOpen, onOpenChange }: BookingModalProps) {
  const { toast } = useToast();
  const [date, setDate] = React.useState<Date | undefined>();
  const [time, setTime] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time || !address || !name || !phone) {
      toast({
        title: "Incomplete Information",
        description: "Please fill out all fields to request a booking.",
        variant: "destructive",
      });
      return;
    }
    
    // In a real app, this would trigger a server action to create a booking
    const newBooking: Booking = {
        id: `book_${Date.now()}`,
        artistId: artist.id,
        customerName: name,
        customerContact: phone,
        serviceAddress: address,
        date: date,
        service: artist.services.join(' & '), // Simple service name
        amount: artist.charge,
        status: 'Pending Approval'
    };

    // Save to localStorage to simulate backend and notify admin
    const allBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    localStorage.setItem('bookings', JSON.stringify([newBooking, ...allBookings]));
    window.dispatchEvent(new Event('storage')); // Notify admin page of change


    toast({
      title: "Booking Request Sent!",
      description: `Your request to book ${artist.name} has been sent. The admin will review it and you will be notified upon confirmation.`,
    });
    onOpenChange(false);
    // Reset form
    setDate(undefined);
    setTime('');
    setAddress('');
    setName('');
    setPhone('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-primary font-bold text-2xl">Book {artist.name}</DialogTitle>
          <DialogDescription>
            Fill in the details below to request a booking. Your request will be sent to the admin for approval.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-2">
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input id="name" className="col-span-3" value={name} onChange={(e) => setName(e.target.value)} required/>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <Input id="phone" type="tel" className="col-span-3" value={phone} onChange={(e) => setPhone(e.target.value)} required/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'col-span-3 justify-start text-left font-normal',
                      !date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="time" className="text-right">
                Time
              </Label>
              <div className="relative col-span-3">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="time"
                  type="time"
                  className="pl-9"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">
                Address
              </Label>
              <Textarea
                id="address"
                className="col-span-3"
                placeholder="Full address for the service"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="bg-accent hover:bg-accent/90 w-full">Submit Request</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
