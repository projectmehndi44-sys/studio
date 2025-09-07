
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Shield, Briefcase, MoreHorizontal, AlertOctagon } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import type { Booking, Artist, Notification } from '@/types';
import { artists as initialArtists } from '@/lib/data';
import { AssignArtistModal } from '@/components/glamgo/AssignArtistModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


const allBookings: Booking[] = [
    { id: 'book_01', artistIds: ['1'], customerName: 'Priya Patel', customerContact: '9876543210', eventType: 'Wedding', serviceAddress: '123, Rose Villa, Bandra West, Mumbai', date: new Date('2024-07-20'), service: 'Bridal Mehndi', amount: 5000, status: 'Completed', paidOut: true, eventDate: new Date('2024-07-22'), state: 'Maharashtra', district: 'Mumbai', location: 'Bandra West' },
    { id: 'book_02', artistIds: ['2'], customerName: 'Anjali Sharma', customerContact: '9876543211', eventType: 'Party', serviceAddress: '456, Sunshine Apts, Saket, New Delhi', date: new Date('2024-07-25'), service: 'Party Makeup', amount: 3000, status: 'Completed', paidOut: false, eventDate: new Date('2024-07-25'), state: 'Delhi', district: 'South Delhi', location: 'Saket' },
    { id: 'book_03', artistIds: ['3'], customerName: 'Sneha Reddy', customerContact: '9876543212', eventType: 'Wedding', serviceAddress: '789, Tech Park, Koramangala, Bangalore', date: new Date('2024-08-05'), service: 'Mehndi & Makeup', amount: 8000, status: 'Pending Approval', paidOut: false, eventDate: new Date('2024-08-07'), state: 'Karnataka', district: 'Bengaluru Urban', location: 'Koramangala' },
    { id: 'book_04', artistIds: ['1'], customerName: 'Meera Iyer', customerContact: '9876543213', eventType: 'Engagement', serviceAddress: '321, Lakeview, Powai, Mumbai', date: new Date('2024-08-10'), service: 'Engagement Makeup', amount: 4500, status: 'Confirmed', paidOut: false, eventDate: new Date('2024-08-11'), state: 'Maharashtra', district: 'Mumbai Suburban', location: 'Powai' },
    { id: 'book_05', artistIds: [], customerName: 'Rohan Gupta', customerContact: '9876543214', eventType: 'Festival', serviceAddress: '654, MG Road, Pune', date: new Date('2024-08-12'), service: 'Mehndi Package', amount: 1800, status: 'Needs Assignment', paidOut: false, eventDate: new Date('2024-08-13'), state: 'Maharashtra', district: 'Pune', location: 'MG Road' },
    { id: 'book_06', artistIds: ['4'], customerName: 'Kavita Singh', customerContact: '9876543215', eventType: 'Wedding', serviceAddress: '987, Cyber City, Gurgaon', date: new Date('2024-08-15'), service: 'Minimalist Mehndi', amount: 2200, status: 'Pending Approval', paidOut: false, eventDate: new Date('2024-08-18'), state: 'Haryana', district: 'Gurugram', location: 'Cyber City' },
    { id: 'book_07', artistIds: ['5'], customerName: 'Divya Kumar', customerContact: '9876543216', eventType: 'Wedding', serviceAddress: '111, Jubilee Hills, Hyderabad', date: new Date('2024-07-28'), service: 'Bridal Makeup', amount: 9000, status: 'Disputed', paidOut: false, eventDate: new Date('2024-07-30'), state: 'Telangana', district: 'Hyderabad', location: 'Jubilee Hills' },
];

export default function BookingManagementPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [bookings, setBookings] = React.useState<Booking[]>([]);
    const [artists, setArtists] = React.useState<Artist[]>([]);
    const [isAssignModalOpen, setIsAssignModalOpen] = React.useState(false);
    const [selectedBooking, setSelectedBooking] = React.useState<Booking | null>(null);

    React.useEffect(() => {
        const isAdminAuthenticated = localStorage.getItem('isAdminAuthenticated');
        if (isAdminAuthenticated !== 'true') {
            router.push('/admin/login');
        }
        
        const storedArtists = localStorage.getItem('artists');
        setArtists(storedArtists ? JSON.parse(storedArtists) : initialArtists);

        const storedBookings = localStorage.getItem('bookings');
        setBookings(storedBookings ? JSON.parse(storedBookings).map((b: Booking) => ({...b, date: new Date(b.date), eventDate: b.eventDate ? new Date(b.eventDate) : new Date(b.date) })) : allBookings);

    }, [router]);
    
    const sendNotification = (artistId: string, booking: Booking, title: string, message: string) => {
        const existingNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
        const newNotification: Notification = {
            id: `notif_${Date.now()}_${artistId}`,
            artistId,
            bookingId: booking.id,
            title,
            message,
            timestamp: new Date().toISOString(),
            isRead: false,
        };
        localStorage.setItem('notifications', JSON.stringify([newNotification, ...existingNotifications]));
        window.dispatchEvent(new Event('storage'));
    };

    const updateBookingStatus = (bookingId: string, status: Booking['status'], artistIds?: string[]) => {
        const updatedBookings = bookings.map(b => 
            b.id === bookingId 
            ? { ...b, status, artistIds: artistIds !== undefined ? artistIds : b.artistIds } 
            : b
        );
        setBookings(updatedBookings);
        // Persist to localStorage to notify other clients
        localStorage.setItem('bookings', JSON.stringify(updatedBookings));
        window.dispatchEvent(new Event('storage'));
    };
    
    const handleApproveBooking = (bookingId: string) => {
        const booking = bookings.find(b => b.id === bookingId);
        if (!booking || !booking.artistIds || booking.artistIds.length === 0) return;

        updateBookingStatus(bookingId, 'Confirmed');
        
        booking.artistIds.forEach(artistId => {
            if (artistId) {
                sendNotification(
                    artistId,
                    booking,
                    'Booking Approved!',
                    `Your booking for ${booking.service} with ${booking.customerName} has been approved by the admin.`
                );
            }
        });
        
        toast({
            title: "Booking Approved",
            description: `Booking ${bookingId} has been confirmed. Notifications sent to assigned artists.`,
        });
    };
    
    const handleCancelBooking = (bookingId: string) => {
        const booking = bookings.find(b => b.id === bookingId);
        if (!booking) return;

        updateBookingStatus(bookingId, 'Cancelled');

        if(booking.artistIds && booking.artistIds.length > 0) {
            booking.artistIds.forEach(artistId => {
                if (artistId) {
                     sendNotification(
                        artistId,
                        booking,
                        'Booking Cancelled',
                        `Your booking for ${booking.service} with ${booking.customerName} has been cancelled by the admin.`
                    );
                }
            });
        }
        
        toast({
            title: "Booking Cancelled",
            description: `Booking ${bookingId} has been cancelled. A notification has been sent.`,
            variant: "destructive"
        });
    };

    const handleDisputeBooking = (bookingId: string) => {
        const booking = bookings.find(b => b.id === bookingId);
        if (!booking) return;

        updateBookingStatus(bookingId, 'Disputed');
        
        if (booking.artistIds && booking.artistIds.length > 0) {
             booking.artistIds.forEach(artistId => {
                if (artistId) {
                     sendNotification(
                        artistId,
                        booking,
                        'Booking Disputed',
                        `A dispute has been raised for your booking with ${booking.customerName}. Please contact admin.`
                    );
                }
            });
        }

        toast({
            title: 'Booking Disputed',
            description: `Booking ${bookingId} is now marked as disputed.`,
            variant: 'destructive',
        });
    };

    const handleOpenAssignModal = (booking: Booking) => {
        setSelectedBooking(booking);
        setIsAssignModalOpen(true);
    };
    
    const handleAssignArtist = (bookingId: string, assignedArtistIds: string[]) => {
        const booking = bookings.find(b => b.id === bookingId);
        if (!booking) return;
        
        const originalArtistIds = booking.artistIds || [];
        updateBookingStatus(bookingId, 'Confirmed', assignedArtistIds);
        
        assignedArtistIds.forEach(artistId => {
            const artist = artists.find(a => a.id === artistId);
            if (!artist) return;

            const isNewAssignment = !originalArtistIds.includes(artistId);
            const title = isNewAssignment ? 'New Booking Assigned!' : 'Booking Updated';
            const message = isNewAssignment
                ? `You have been assigned a new booking for ${booking.service} with ${booking.customerName}.`
                : `The details for booking #${bookingId} have been updated.`;

            sendNotification(artistId, booking, title, message);
        });

        toast({
            title: `Artists Assigned`,
            description: `${assignedArtistIds.length} artist(s) have been assigned to booking ${bookingId}.`,
        });
    };

    const getStatusVariant = (status: Booking['status']) => {
        switch (status) {
            case 'Completed': return 'default';
            case 'Confirmed': return 'default';
            case 'Pending Approval': return 'secondary';
            case 'Needs Assignment': return 'destructive';
            case 'Disputed': return 'destructive';
            case 'Cancelled': return 'destructive';
            default: return 'outline';
        }
    };
    
    const renderTable = (filteredBookings: Booking[]) => (
         <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Booking ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Artists</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredBookings.map(booking => {
                    const assignedArtists = artists.filter(a => booking.artistIds.includes(a.id));
                    return (
                        <TableRow key={booking.id}>
                            <TableCell className="font-mono text-xs">{booking.id}</TableCell>
                            <TableCell>{booking.customerName}</TableCell>
                            <TableCell>
                                {assignedArtists.length > 0 ? (
                                    <div className="flex flex-col">
                                        {assignedArtists.map(artist => (
                                            <span key={artist.id}>{artist.name}</span>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground">Not Assigned</span>
                                )}
                            </TableCell>
                            <TableCell>{booking.date.toLocaleDateString()}</TableCell>
                            <TableCell>₹{booking.amount}</TableCell>
                            <TableCell>
                                <Badge variant={getStatusVariant(booking.status)}>
                                    {booking.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button aria-haspopup="true" size="icon" variant="ghost">
                                            <MoreHorizontal className="h-4 w-4" />
                                            <span className="sr-only">Toggle menu</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {booking.status === 'Pending Approval' && (
                                            <>
                                                <DropdownMenuItem onSelect={() => handleApproveBooking(booking.id)} disabled={assignedArtists.length === 0}>Approve</DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handleOpenAssignModal(booking)}>Assign Artist</DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handleCancelBooking(booking.id)}>Cancel Booking</DropdownMenuItem>
                                            </>
                                        )}
                                        {booking.status === 'Needs Assignment' && (
                                             <DropdownMenuItem onSelect={() => handleOpenAssignModal(booking)}>Assign Artist</DropdownMenuItem>
                                        )}
                                        {booking.status === 'Confirmed' && (
                                            <>
                                                <DropdownMenuItem onSelect={() => handleOpenAssignModal(booking)}>Change Artists</DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handleCancelBooking(booking.id)}>Cancel Booking</DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handleDisputeBooking(booking.id)}>Mark as Disputed</DropdownMenuItem>
                                            </>
                                        )}
                                        {booking.status === 'Disputed' && (
                                             <>
                                                <DropdownMenuItem onSelect={() => updateBookingStatus(booking.id, 'Completed')}>Resolve (Mark as Complete)</DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handleCancelBooking(booking.id)}>Resolve (Cancel Booking)</DropdownMenuItem>
                                            </>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    )
                })}
            </TableBody>
        </Table>
    );

    return (
        <>
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Booking Management</h1>
            </div>
            <Card className="flex-1">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Briefcase className="w-6 h-6 text-primary"/> All Bookings
                    </CardTitle>
                    <CardDescription>
                        Approve, assign, change, or cancel any booking on the platform.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="all">
                        <TabsList>
                            <TabsTrigger value="all">All Bookings</TabsTrigger>
                            <TabsTrigger value="disputed">
                                <AlertOctagon className="mr-2 h-4 w-4" />
                                Disputed Bookings
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="all" className="mt-4">
                            {renderTable(bookings.filter(b => b.status !== 'Disputed'))}
                        </TabsContent>
                        <TabsContent value="disputed" className="mt-4">
                            {renderTable(bookings.filter(b => b.status === 'Disputed'))}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
            {selectedBooking && (
                <AssignArtistModal
                    isOpen={isAssignModalOpen}
                    onOpenChange={setIsAssignModalOpen}
                    booking={selectedBooking}
                    artists={artists}
                    allBookings={bookings}
                    onAssign={handleAssignArtist}
                />
            )}
        </>
    );
}

