

'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Briefcase, MoreHorizontal, AlertOctagon, CheckSquare, FileText, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import type { Booking, Artist } from '@/lib/types';
import { listenToCollection, updateBooking, getFinancialSettings } from '@/lib/services';
import { AssignArtistModal } from '@/components/utsavlook/AssignArtistModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, parseISO, isValid } from 'date-fns';
import { useAdminAuth } from '@/firebase/auth/use-admin-auth';
import { Timestamp } from 'firebase/firestore';
import { BookingDetailsModal } from '@/components/utsavlook/BookingDetailsModal';
import { callFirebaseFunction } from '@/lib/firebase';
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

export default function BookingManagementPage() {
    const { hasPermission } = useAdminAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [bookings, setBookings] = React.useState<Booking[]>([]);
    const [artists, setArtists] = React.useState<Artist[]>([]);
    const [isAssignModalOpen, setIsAssignModalOpen] = React.useState(false);
    const [selectedBooking, setSelectedBooking] = React.useState<Booking | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = React.useState(false);
    const [platformFee, setPlatformFee] = React.useState(0.1);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);

     React.useEffect(() => {
        getFinancialSettings().then(settings => {
            setPlatformFee(settings.platformFeePercentage / 100);
        });
        const unsubscribeArtists = listenToCollection<Artist>('artists', setArtists);
        const unsubscribeBookings = listenToCollection<Booking>('bookings', (data) => {
            setBookings(data.sort((a, b) => getSafeDate(b.eventDate).getTime() - getSafeDate(a.eventDate).getTime()));
        });

        return () => {
            unsubscribeArtists();
            unsubscribeBookings();
        };
    }, []);
    
    const handleUpdateBookingStatus = async (bookingId: string, status: Booking['status'], artistIds?: string[]) => {
        const bookingToUpdate = bookings.find(b => b.id === bookingId);
        if (!bookingToUpdate) return;
        
        const updateData: Partial<Booking> = { status };
        if (artistIds !== undefined) {
            updateData.artistIds = artistIds;
        }

        await updateBooking(bookingId, updateData);
    };

    const handleOfflineConfirm = async (bookingId: string) => {
        const booking = bookings.find(b => b.id === bookingId);
        if (!booking) return;

        const newStatus = booking.artistIds && booking.artistIds.length > 0 ? 'Pending Approval' : 'Needs Assignment';
        await handleUpdateBookingStatus(bookingId, newStatus);
        
        toast({
            title: "Booking Manually Confirmed",
            description: `Booking ${bookingId} is now moved to the pending queue.`,
        });
    }
    
    const handleApproveBooking = async (bookingId: string) => {
        const booking = bookings.find(b => b.id === bookingId);
        if (!booking || !booking.artistIds || booking.artistIds.length === 0) return;

        await handleUpdateBookingStatus(bookingId, 'Confirmed');
        
        // This will now be handled by a Cloud Function Trigger
        
        toast({
            title: "Booking Approved",
            description: `Booking ${bookingId} has been confirmed. Notifications sent to assigned artists.`,
        });
    };
    
    const handleCancelBooking = async (bookingId: string) => {
        const booking = bookings.find(b => b.id === bookingId);
        if (!booking) return;

        await handleUpdateBookingStatus(bookingId, 'Cancelled');

        if(booking.artistIds && booking.artistIds.length > 0) {
           // Cloud function will handle this notification
        }
        
        toast({
            title: "Booking Cancelled",
            description: `Booking ${bookingId} has been cancelled. A notification has been sent.`,
            variant: "destructive"
        });
    };

    const handleDisputeBooking = async (bookingId: string) => {
        const booking = bookings.find(b => b.id === bookingId);
        if (!booking) return;

        await handleUpdateBookingStatus(bookingId, 'Disputed');
        
        if (booking.artistIds && booking.artistIds.length > 0) {
            // Cloud function will handle this notification
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
    
    const handleOpenDetailsModal = (booking: Booking) => {
        setSelectedBooking(booking);
        setIsDetailsModalOpen(true);
    }
    
    const handleAssignArtist = async (bookingId: string, assignedArtistIds: string[]) => {
        const booking = bookings.find(b => b.id === bookingId);
        if (!booking) return;
        
        const newStatus = booking.paymentMethod === 'offline' ? 'Pending Approval' : 'Confirmed';
        await handleUpdateBookingStatus(bookingId, newStatus, assignedArtistIds);
        
        // This will be handled by a cloud function now

        toast({
            title: `Artists Assigned`,
            description: `${assignedArtistIds.length} artist(s) have been assigned to booking ${bookingId}.`,
        });
        
    };

    const handleDeleteAllBookings = async () => {
        try {
            await callFirebaseFunction('deleteAllBookings', {});
            toast({
                title: "Bookings Deleted",
                description: "All booking records have been permanently deleted.",
                variant: "destructive"
            });
        } catch (error: any) {
            toast({
                title: "Deletion Failed",
                description: error.message || "You do not have permission to perform this action.",
                variant: "destructive"
            });
        } finally {
            setIsDeleteAlertOpen(false);
        }
    };

    const getStatusVariant = (status: Booking['status']) => {
        switch (status) {
            case 'Completed': return 'default';
            case 'Confirmed': return 'default';
            case 'Pending Approval': return 'secondary';
            case 'Needs Assignment': return 'destructive';
            case 'Pending Confirmation': return 'outline';
            case 'Disputed': return 'destructive';
            case 'Cancelled': return 'destructive';
            default: return 'outline';
        }
    };
    
    const filterBookings = (tab: string | null) => {
        if (tab === 'pending') {
            return bookings.filter(b => b.status === 'Pending Approval' || b.status === 'Needs Assignment');
        }
        if (tab === 'disputed') {
            return bookings.filter(b => b.status === 'Disputed');
        }
        if (tab === 'offline') {
            return bookings.filter(b => b.status === 'Pending Confirmation');
        }
        return bookings.filter(b => b.status !== 'Disputed' && b.status !== 'Pending Confirmation');
    };

    const initialTab = searchParams.get('filter') || 'all';
    const filteredBookings = filterBookings(initialTab);
    
    const renderTable = (bookingsToRender: Booking[]) => (
         <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Booking ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Artists</TableHead>
                    <TableHead>Service Dates</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    {hasPermission('bookings', 'edit') && (
                        <TableHead className="text-right">Actions</TableHead>
                    )}
                </TableRow>
            </TableHeader>
            <TableBody>
                {bookingsToRender.length > 0 ? bookingsToRender.map(booking => {
                    const assignedArtists = artists.filter(a => booking.artistIds && booking.artistIds.includes(a.id));
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
                            <TableCell>
                                <div className="flex flex-col gap-1">
                                    {(booking.serviceDates || []).map((date, index) => (
                                        <Badge key={index} variant="outline" className="text-xs">
                                            {format(getSafeDate(date), "PPP")}
                                        </Badge>
                                    ))}
                                </div>
                            </TableCell>
                            <TableCell>₹{booking.amount}</TableCell>
                            <TableCell>
                                <Badge variant={getStatusVariant(booking.status)}>
                                    {booking.status}
                                </Badge>
                            </TableCell>
                             {hasPermission('bookings', 'edit') && (
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
                                             <DropdownMenuItem onSelect={() => handleOpenDetailsModal(booking)}>
                                                <FileText className="mr-2 h-4 w-4"/> View Full Details
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            {booking.status === 'Pending Confirmation' && (
                                                <DropdownMenuItem onSelect={() => handleOfflineConfirm(booking.id)}>
                                                    <CheckSquare className="mr-2 h-4 w-4" />
                                                    Manually Confirm
                                                </DropdownMenuItem>
                                            )}
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
                                                    <DropdownMenuItem onSelect={() => handleUpdateBookingStatus(booking.id, 'Completed')}>Resolve (Mark as Complete)</DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={() => handleCancelBooking(booking.id)}>Resolve (Cancel Booking)</DropdownMenuItem>
                                                </>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                             )}
                        </TableRow>
                    )
                }) : (
                     <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                            No bookings found for this category.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );

    return (
        <>
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Booking Management</h1>
                 {hasPermission('bookings', 'edit') && (
                    <Button variant="destructive" onClick={() => setIsDeleteAlertOpen(true)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear All Bookings
                    </Button>
                )}
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
                    <Tabs defaultValue={initialTab} onValueChange={(tab) => router.push(`/admin/bookings?filter=${tab}`)}>
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="all">All Bookings</TabsTrigger>
                            <TabsTrigger value="pending">Pending</TabsTrigger>
                            <TabsTrigger value="offline">Offline Confirmation</TabsTrigger>
                            <TabsTrigger value="disputed">
                                <AlertOctagon className="mr-2 h-4 w-4" />
                                Disputed Bookings
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value={initialTab} className="mt-4">
                            {renderTable(filteredBookings)}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
            {selectedBooking && hasPermission('bookings', 'edit') && (
                <AssignArtistModal
                    isOpen={isAssignModalOpen}
                    onOpenChange={setIsAssignModalOpen}
                    booking={selectedBooking}
                    artists={artists}
                    allBookings={bookings}
                    onAssign={handleAssignArtist}
                />
            )}
             {selectedBooking && (
                <BookingDetailsModal
                    booking={selectedBooking}
                    isOpen={isDetailsModalOpen}
                    onOpenChange={setIsDetailsModalOpen}
                    platformFeePercentage={platformFee}
                    isAdminView={true}
                />
            )}
             <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will permanently delete all booking records from the database. This cannot be undone. Are you sure you want to proceed?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAllBookings} className="bg-destructive hover:bg-destructive/80">
                            Yes, Delete Everything
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
