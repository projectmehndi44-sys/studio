
'use client';

import * as React from 'react';
import type { Booking } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  IndianRupee,
  Calendar,
  User,
  MapPin,
  MessageSquare,
  Users
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { format, parseISO, isValid } from 'date-fns';
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

interface BookingDetailsModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  platformFeePercentage: number;
  isAdminView?: boolean;
}

export function BookingDetailsModal({
  booking,
  isOpen,
  onOpenChange,
  platformFeePercentage,
  isAdminView = false,
}: BookingDetailsModalProps) {
  if (!booking) return null;

  const bookingShare = booking.amount / (booking.artistIds?.length || 1);
  const taxableAmount = bookingShare / 1.18;
  const gstOnService = bookingShare - taxableAmount;
  const platformFee = taxableAmount * platformFeePercentage;
  const netPayout = taxableAmount - platformFee;
  const travelCharges = booking.travelCharges || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-primary">Booking Details</DialogTitle>
          <DialogDescription>Full details for booking #{booking.id.substring(0, 7)}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
          {/* Customer & Event Details */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
              <User className="w-8 h-8 text-primary" />
              <div>
                <CardTitle>{booking.customerName}</CardTitle>
                <CardDescription>{booking.customerContact}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>
                  Event: {booking.eventType} on {format(getSafeDate(booking.eventDate), 'PPP')}
                </span>
              </div>
              {booking.mapLink ? (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <a href={booking.mapLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {booking.serviceAddress}
                  </a>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{booking.serviceAddress}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Service Items */}
          <Card>
            <CardHeader>
                <CardTitle className="text-base">Services Booked</CardTitle>
            </CardHeader>
            <CardContent>
                {booking.items.map(item => (
                    <div key={item.id} className="flex justify-between items-center">
                        <p>{item.servicePackage.name} - <Badge variant="secondary">{item.selectedTier.name}</Badge></p>
                        <p className="font-semibold">₹{item.price.toLocaleString()}</p>
                    </div>
                ))}
            </CardContent>
          </Card>


          {/* Service Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Service Dates</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {(booking.serviceDates || []).map((date, index) => (
                <Badge key={index} variant="secondary">
                  {format(getSafeDate(date), 'E, PPP')}
                </Badge>
              ))}
            </CardContent>
          </Card>

          {/* Guest Services */}
          {(booking.guestMehndi?.included || booking.guestMakeup?.included) && (
              <Card>
                  <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2"><Users /> Guest Services</CardTitle>
                  </CardHeader>
                  <CardContent>
                      {booking.guestMehndi?.included && <p>Guest Mehndi: {booking.guestMehndi.expectedCount} person(s)</p>}
                      {booking.guestMakeup?.included && <p>Guest Makeup: {booking.guestMakeup.expectedCount} person(s)</p>}
                  </CardContent>
              </Card>
          )}

          {/* Special Notes */}
          {booking.note && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><MessageSquare /> Special Notes from Customer</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground italic">"{booking.note}"</p>
              </CardContent>
            </Card>
          )}

          {/* Payout Calculation */}
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <IndianRupee /> {isAdminView ? 'Booking Financials' : 'Your Estimated Payout'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Total Booking Value</span> <span>₹{booking.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
                <Separator />
              <div className="flex justify-between"><span>Artist Share of Booking (per artist)</span> <span>₹{bookingShare.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
              <Separator />
              <div className="flex justify-between text-muted-foreground"><span>Less: 18% GST on service</span> <span>- ₹{gstOnService.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
              <div className="flex justify-between"><strong>Taxable Value</strong> <strong>₹{taxableAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong></div>
              <Separator />
              <div className="flex justify-between text-muted-foreground"><span>Less: {platformFeePercentage * 100}% Platform Fee</span> <span>- ₹{platformFee.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
              <Separator />
              <div className="flex justify-between font-bold text-lg text-green-600"><span>Net Payout to Artist</span> <span>₹{netPayout.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
              {travelCharges > 0 && (
                <div className="flex justify-between font-semibold text-blue-600 pt-2 border-t mt-2">
                  <span>+ Travel Charges (Payable by customer)</span>
                  <span>₹{travelCharges.toLocaleString()}</span>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground">This is an estimate. Final payout will be processed by admin after job completion. Travel charges are to be collected directly from the customer.</p>
            </CardFooter>
          </Card>
        </div>
        <DialogClose asChild>
          <Button type="button" variant="secondary" className="w-full mt-4">Close</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
