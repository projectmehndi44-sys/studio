
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Shield, Briefcase, ArrowLeft } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import type { Booking, Artist } from '@/types';
import { artists as initialArtists } from '@/lib/data';
import { AssignArtistModal } from '@/components/glamgo/AssignArtistModal';


const allBookings: Booking[] = [
    { id: 'book_01', artistId: '1', customerName: 'Priya Patel', date: new Date('2024-07-20'), service: 'Bridal Mehndi', amount: 5000, status: 'Completed' },
    { id: 'book_02', artistId: '2', customerName: 'Anjali Sharma', date: new Date('2024-07-25'), service: 'Party Makeup', amount: 3000, status: 'Completed' },
    { id: 'book_03', artistId: '3', customerName: 'Sneha Reddy', date: new Date('2024-08-05'), service: 'Mehndi & Makeup', amount: 8000, status: 'Pending Approval' },
    { id: 'book_04', artistId: '1', customerName: 'Meera Iyer', date: new Date('2024-08-10'), service: 'Engagement Makeup', amount: 4500, status: 'Confirmed' },
    { id: 'book_05', artistId: null, customerName: 'Rohan Gupta', date: new Date('2024-08-12'), service: 'Mehndi Package', amount: 1800, status: 'Needs Assignment' },
    { id: 'book_06', artistId: '4', customerName: 'Kavita Singh', date: new Date('2024-08-15'), service: 'Minimalist Mehndi', amount: 2200, status: 'Pending Approval' },
];

export default function BookingManagementPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [bookings, setBookings] = React.useState<Booking[]>(allBookings);
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

    }, [router]);

    const updateBookingStatus = (bookingId: string, status: Booking['status'], artistId?: string | null) => {
        setBookings(prevBookings => 
            prevBookings.map(b => 
                b.id === bookingId 
                ? { ...b, status, artistId: artistId !== undefined ? artistId : b.artistId } 
                : b
            )
        );
    };
    
    const handleApproveBooking = (bookingId: string) => {
        updateBookingStatus(bookingId, 'Confirmed');
        toast({
            title: "Booking Approved",
            description: `Booking ${bookingId} has been confirmed.`,
        });
    };
    
    const handleCancelBooking = (bookingId: string) => {
        updateBookingStatus(bookingId, 'Cancelled');
        toast({
            title: "Booking Cancelled",
            description: `Booking ${bookingId} has been cancelled. A notification has been sent.`,
            variant: "destructive"
        });
    };

    const handleOpenAssignModal = (booking: Booking) => {
        setSelectedBooking(booking);
        setIsAssignModalOpen(true);
    };
    
    const handleAssignArtist = (bookingId: string, artistId: string) => {
        updateBookingStatus(bookingId, 'Confirmed', artistId);
        const artist = artists.find(a => a.id === artistId);
        toast({
            title: "Artist Assigned",
            description: `${artist?.name} has been assigned to booking ${bookingId}.`,
        });
    };

    const getStatusVariant = (status: Booking['status']) => {
        switch (status) {
            case 'Completed': return 'default';
            case 'Confirmed': return 'default';
            case 'Pending Approval': return 'secondary';
            case 'Needs Assignment': return 'destructive';
            case 'Cancelled': return 'destructive';
            default: return 'outline';
        }
    };


    return (
        <>
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6 justify-between">
                <h1 className="flex items-center gap-2 text-xl font-bold text-primary">
                    <Shield className="w-6 h-6" />
                    Admin Portal
                </h1>
                <Link href="/admin">
                     <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4"/> Back to Dashboard</Button>
                </Link>
            </header>
            <main className="flex-1 p-4 sm:px-6 sm:py-0 md:gap-8">
                <Card className="max-w-7xl mx-auto">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Briefcase className="w-6 h-6 text-primary"/> Booking Management
                        </CardTitle>
                        <CardDescription>
                            Approve, assign, or cancel any booking on the platform.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                       <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Booking ID</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Artist</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bookings.map(booking => {
                                    const artist = artists.find(a => a.id === booking.artistId);
                                    return (
                                        <TableRow key={booking.id}>
                                            <TableCell className="font-mono text-xs">{booking.id}</TableCell>
                                            <TableCell>{booking.customerName}</TableCell>
                                            <TableCell>{artist ? artist.name : <span className="text-muted-foreground">Not Assigned</span>}</TableCell>
                                            <TableCell>{booking.date.toLocaleDateString()}</TableCell>
                                            <TableCell>₹{booking.amount}</TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusVariant(booking.status)}>
                                                    {booking.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                {booking.status === 'Pending Approval' && (
                                                     <Button 
                                                        variant="default"
                                                        size="sm"
                                                        onClick={() => handleApproveBooking(booking.id)}
                                                    >
                                                        Approve
                                                    </Button>
                                                )}
                                                {booking.status === 'Needs Assignment' && (
                                                     <Button 
                                                        variant="default"
                                                        size="sm"
                                                        onClick={() => handleOpenAssignModal(booking)}
                                                    >
                                                        Assign Artist
                                                    </Button>
                                                )}
                                                {(booking.status === 'Confirmed' || booking.status === 'Pending Approval') && (
                                                     <Button 
                                                        variant="destructive" 
                                                        size="sm"
                                                        onClick={() => handleCancelBooking(booking.id)}
                                                    >
                                                        Cancel
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </main>
        </div>
         {selectedBooking && (
            <AssignArtistModal
                isOpen={isAssignModalOpen}
                onOpenChange={setIsAssignModalOpen}
                booking={selectedBooking}
                artists={artists}
                onAssign={handleAssignArtist}
            />
        )}
        </>
    );
}

