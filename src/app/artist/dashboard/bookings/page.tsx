'use client';

import * as React from 'react';
import { useArtistPortal } from '../layout';
import type { Booking } from '@/lib/types';
import { listenToCollection } from '@/lib/services';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Briefcase, MoreHorizontal, FileText, Check, X, Clock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getSafeDate } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { BookingDetailsModal } from '@/components/utsavlook/BookingDetailsModal';
import { callFirebaseFunction } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { query, collection, where } from 'firebase/firestore';
import { getDb } from '@/firebase';


export default function ArtistBookingsPage() {
    const { artist, financialSettings } = useArtistPortal();
    const { toast } = useToast();
    const [bookings, setBookings] = React.useState<Booking[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [selectedBooking, setSelectedBooking] = React.useState<Booking | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = React.useState(false);


    React.useEffect(() => {
        if (!artist) return;
        setIsLoading(true);

        const db = getDb();
        const bookingsQuery = query(collection(db, 'bookings'), where('artistIds', 'array-contains', artist.id));
        
        const unsub = listenToCollection<Booking>('bookings', (artistBookings) => {
            setBookings(artistBookings.sort((a, b) => getSafeDate(b.eventDate).getTime() - getSafeDate(a.eventDate).getTime()));
            setIsLoading(false);
        }, bookingsQuery);

        return () => unsub();
    }, [artist]);

    const handleAction = async (bookingId: string, action: 'confirm' | 'reject') => {
        try {
            await callFirebaseFunction('handleBookingAction', { bookingId, action });
            toast({
                title: `Booking ${action === 'confirm' ? 'Confirmed' : 'Rejected'}`,
                description: `You have successfully ${action === 'confirm' ? 'confirmed' : 'rejected'} the booking.`,
            });
        } catch (error: any) {
            console.error("Action failed:", error);
            toast({
                title: "Action Failed",
                description: error.message || "Could not update the booking status.",
                variant: 'destructive',
            });
        }
    };
    
    const handleOpenDetails = (booking: Booking) => {
        setSelectedBooking(booking);
        setIsDetailsModalOpen(true);
    };

    const getStatusVariant = (status: Booking['status']) => {
        switch (status) {
            case 'Completed': return 'default';
            case 'Confirmed': return 'default';
            case 'Pending Approval': return 'secondary';
            case 'Pending Confirmation': return 'secondary';
            case 'Needs Assignment': return 'outline';
            case 'Cancelled': return 'destructive';
            case 'Disputed': return 'destructive';
            default: return 'outline';
        }
    };
    
    const renderTable = (bookingsToRender: Booking[]) => (
         <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Event Date</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center">Loading bookings...</TableCell></TableRow>
                ) : bookingsToRender.length > 0 ? bookingsToRender.map(booking => (
                    <TableRow key={booking.id}>
                        <TableCell>
                            <div className="font-medium">{booking.customerName}</div>
                            <div className="text-sm text-muted-foreground">{booking.eventType}</div>
                        </TableCell>
                        <TableCell>{getSafeDate(booking.eventDate).toLocaleDateString()}</TableCell>
                        <TableCell>{booking.items.map(i => i.servicePackage.name).join(', ')}</TableCell>
                        <TableCell><Badge variant={getStatusVariant(booking.status)}>{booking.status}</Badge></TableCell>
                        <TableCell className="text-right">
                            {booking.status === 'Pending Confirmation' && (
                                <div className="flex gap-2 justify-end">
                                    <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => handleAction(booking.id, 'reject')}><X className="mr-2 h-4 w-4" /> Reject</Button>
                                    <Button size="sm" onClick={() => handleAction(booking.id, 'confirm')}><Check className="mr-2 h-4 w-4" /> Confirm</Button>
                                </div>
                            )}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4"/></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => handleOpenDetails(booking)}>
                                        <FileText className="mr-2 h-4 w-4"/> View Full Details
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                )) : (
                    <TableRow><TableCell colSpan={5} className="text-center h-24">No bookings in this category.</TableCell></TableRow>
                )}
            </TableBody>
        </Table>
    );

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Briefcase className="w-6 h-6 text-primary"/>Booking Management</CardTitle>
                    <CardDescription>Review and manage all your bookings.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="pending">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="pending"><Clock className="w-4 h-4 mr-2"/>Pending</TabsTrigger>
                            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                            <TabsTrigger value="past">Past</TabsTrigger>
                            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                        </TabsList>
                        <TabsContent value="pending" className="mt-4">
                            {renderTable(bookings.filter(b => b.status === 'Pending Confirmation' || b.status === 'Pending Approval'))}
                        </TabsContent>
                         <TabsContent value="upcoming" className="mt-4">
                            {renderTable(bookings.filter(b => b.status === 'Confirmed' && getSafeDate(b.eventDate) >= new Date()))}
                        </TabsContent>
                         <TabsContent value="past" className="mt-4">
                            {renderTable(bookings.filter(b => b.status === 'Completed' || (b.status==='Confirmed' && getSafeDate(b.eventDate) < new Date())))}
                        </TabsContent>
                         <TabsContent value="cancelled" className="mt-4">
                            {renderTable(bookings.filter(b => b.status === 'Cancelled'))}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {selectedBooking && financialSettings && (
                <BookingDetailsModal
                    booking={selectedBooking}
                    isOpen={isDetailsModalOpen}
                    onOpenChange={setIsDetailsModalOpen}
                    platformFeePercentage={financialSettings.platformFeePercentage / 100}
                />
            )}
        </div>
    );
}
