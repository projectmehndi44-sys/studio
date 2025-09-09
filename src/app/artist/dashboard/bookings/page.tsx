

'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Booking } from '@/types';
import { useArtistPortal } from '../layout';
import { MapPin, User, Phone } from 'lucide-react';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ArtistBookingsPage() {
    const { artistBookings, allBookings } = useArtistPortal();
    const { toast } = useToast();
    const [isCompletionModalOpen, setIsCompletionModalOpen] = React.useState(false);
    const [selectedBooking, setSelectedBooking] = React.useState<Booking | null>(null);
    const [completionCode, setCompletionCode] = React.useState('');

    const handleStatusUpdate = () => {
        if (!selectedBooking) return;
        
        // Validate the completion code
        if (selectedBooking.completionCode !== completionCode) {
            toast({
                title: "Invalid Code",
                description: "The completion code you entered is incorrect. Please check with the customer.",
                variant: "destructive"
            });
            return;
        }

        const newAllBookings = allBookings.map((b: Booking) => 
            b.id === selectedBooking.id ? { ...b, status: 'Completed' } : b
        );
        localStorage.setItem('bookings', JSON.stringify(newAllBookings));

        // Dispatch a storage event to notify other open tabs (like the admin portal)
        window.dispatchEvent(new Event('storage'));
        
        toast({
            title: "Booking Completed!",
            description: `Booking #${selectedBooking.id} has been successfully marked as completed. Your payout will be processed in the next cycle.`
        });

        // Close and reset the modal
        setIsCompletionModalOpen(false);
        setSelectedBooking(null);
        setCompletionCode('');
    }

    const openCompletionModal = (booking: Booking) => {
        setSelectedBooking(booking);
        setIsCompletionModalOpen(true);
    };

    const getStatusVariant = (status: Booking['status']) => {
        switch (status) {
            case 'Completed': return 'default';
            case 'Confirmed': return 'secondary';
            case 'Pending Approval': return 'outline';
            case 'Cancelled': return 'destructive';
            case 'Disputed': return 'destructive';
            default: return 'outline';
        }
    };

    if (!artistBookings) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Your Bookings</CardTitle>
                    <CardDescription>Manage your upcoming and past bookings.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Loading bookings...</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <>
        <Card>
            <CardHeader>
                <CardTitle>Your Bookings</CardTitle>
                <CardDescription>Manage your upcoming and past bookings. Use the customer's unique completion code to mark bookings as 'Completed' and request your payout.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Customer Details</TableHead>
                            <TableHead>Event Details</TableHead>
                            <TableHead>Service Dates</TableHead>
                            <TableHead>Venue</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {artistBookings.length > 0 ? artistBookings.map(booking => (
                            <TableRow key={booking.id}>
                                <TableCell className="font-medium">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <span>{booking.customerName}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Phone className="h-4 w-4" />
                                            <span>{booking.customerContact}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                     <div className="flex flex-col">
                                        <span>{booking.eventType}</span>
                                        <span className="text-xs text-muted-foreground">{new Date(booking.eventDate).toLocaleDateString()}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        {booking.serviceDates.map((date, index) => (
                                            <Badge key={index} variant="outline" className="text-xs">
                                                {format(new Date(date), "PPP")}
                                            </Badge>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span>{booking.serviceAddress}</span>
                                        {booking.mapLink && (
                                            <a href={booking.mapLink} target="_blank" rel="noopener noreferrer">
                                                <Button variant="link" className="p-0 h-auto text-xs text-primary">
                                                    <MapPin className="mr-1 h-3 w-3"/>
                                                    Track Location
                                                </Button>
                                            </a>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={getStatusVariant(booking.status)}>{booking.status}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    {booking.status === 'Confirmed' && (
                                        <Button size="sm" onClick={() => openCompletionModal(booking)}>
                                            Complete Job
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center">You have no bookings yet.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        
        <AlertDialog open={isCompletionModalOpen} onOpenChange={setIsCompletionModalOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Complete Booking & Request Payout</AlertDialogTitle>
                    <AlertDialogDescription>
                       To confirm that the service has been successfully delivered, please ask the customer for their unique 6-digit completion code and enter it below.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                    <Label htmlFor="completion-code">Customer's Completion Code</Label>
                    <Input 
                        id="completion-code" 
                        value={completionCode}
                        onChange={(e) => setCompletionCode(e.target.value)}
                        placeholder="e.g., 123456"
                        maxLength={6}
                    />
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setCompletionCode('')}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleStatusUpdate}>Submit &amp; Mark as Completed</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        </>
    );
}
