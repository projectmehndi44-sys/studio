
'use client';

import * as React from 'react';
import type { Artist, Booking, MehndiPackage } from '@/types';
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
import { Calendar as CalendarIcon, Clock, IndianRupee, User, Package as PackageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

interface BookingModalProps {
  artist: Artist | null;
  pkg: MehndiPackage | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function BookingModal({ artist, pkg: selectedPackage, isOpen, onOpenChange }: BookingModalProps) {
  const { toast } = useToast();
  const [date, setDate] = React.useState<Date | undefined>();
  const [time, setTime] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');

  const bookingTargetName = artist?.name || selectedPackage?.name || '';
  const bookingCharge = artist?.charge || selectedPackage?.price || 0;
  const bookingService = selectedPackage ? selectedPackage.name : artist?.services.join(' & ') || 'Service';

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
        // If booking a package, artistIds is empty. Admin will assign.
        // If booking an artist, their ID is pre-filled.
        artistIds: artist ? [artist.id] : [],
        customerName: name,
        customerContact: phone,
        serviceAddress: address,
        date: date,
        service: bookingService,
        amount: bookingCharge,
        status: artist ? 'Pending Approval' : 'Needs Assignment'
    };

    // Save to localStorage to simulate backend and notify admin
    const allBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    localStorage.setItem('bookings', JSON.stringify([newBooking, ...allBookings]));
    window.dispatchEvent(new Event('storage')); // Notify admin page of change


    toast({
      title: "Booking Request Sent!",
      description: `Your request to book ${bookingTargetName} has been sent. The admin will review it and you will be notified upon confirmation.`,
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
          <DialogTitle className="text-primary font-bold text-2xl flex items-center gap-2">
            {artist && (
                <Image className="h-9 w-9 rounded-full object-cover" src={artist.profilePicture} alt={artist.name} width={36} height={36} />
            )}
            Book {bookingTargetName}
            </DialogTitle>
          <DialogDescription>
            Fill in the details below to request a booking. Your request will be sent for approval.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-2">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted border">
                <div className="flex items-center gap-2">
                    {artist && <User className="w-5 h-5 text-muted-foreground" />}
                    {selectedPackage && <PackageIcon className="w-5 h-5 text-muted-foreground" />}
                    <span className="font-semibold text-muted-foreground">{artist ? "Artist's Base Charge" : "Package Price"}</span>
                </div>
                <span className="font-bold text-lg text-primary flex items-center"><IndianRupee className="w-4 h-4 mr-1"/>{bookingCharge.toLocaleString()}</span>
            </div>

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
