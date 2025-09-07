
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, CheckCircle, XCircle, MoreHorizontal, Pencil, Trash2, Users, Eye, Download, ChevronDown, Calendar as CalendarIcon, Briefcase, Settings, DollarSign, BarChart, RefreshCw, Star, Bell, AlertOctagon, IndianRupee, FileSpreadsheet, Package, ListTree } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { artists as initialArtists } from '@/lib/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Artist, Booking, Transaction, PayoutHistory } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { exportToExcel } from '@/lib/export';


// Define a type for pending artist data, which might be slightly different
type PendingArtist = {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  date: string;
  status: 'Pending';
  password?: string;
  [key: string]: any; // To accommodate other registration fields
};

// Mock data for bookings across all artists for the master calendar
const allBookings: Booking[] = [
    { id: 'book_01', customerId: 'cust_101', artistIds: ['1'], customerName: 'Priya Patel', customerContact: "9876543210", eventType: 'Wedding', serviceAddress: "address", date: new Date('2024-07-20'), service: 'Bridal Mehndi', amount: 5000, status: 'Completed', paidOut: true, eventDate: new Date('2024-07-22'), state: 'Maharashtra', district: 'Mumbai', location: 'Bandra West' },
    { id: 'book_02', customerId: 'cust_102', artistIds: ['2'], customerName: 'Anjali Sharma', customerContact: "9876543211", eventType: 'Party', serviceAddress: "address", date: new Date('2024-07-25'), service: 'Party Makeup', amount: 3000, status: 'Completed', paidOut: false, eventDate: new Date('2024-07-25'), state: 'Delhi', district: 'South Delhi', location: 'Saket' },
    { id: 'book_03', customerId: 'cust_103', artistIds: ['3'], customerName: 'Sneha Reddy', customerContact: "9876543212", eventType: 'Wedding', serviceAddress: "address", date: new Date('2024-08-05'), service: 'Mehndi & Makeup', amount: 8000, status: 'Pending Approval', paidOut: false, eventDate: new Date('2024-08-07'), state: 'Karnataka', district: 'Bengaluru Urban', location: 'Koramangala' },
    { id: 'book_04', customerId: 'cust_101', artistIds: ['1'], customerName: 'Meera Iyer', customerContact: "9876543213", eventType: 'Engagement', serviceAddress: "address", date: new Date('2024-08-10'), service: 'Engagement Makeup', amount: 4500, status: 'Confirmed', paidOut: false, eventDate: new Date('2024-08-11'), state: 'Maharashtra', district: 'Mumbai Suburban', location: 'Powai' },
    { id: 'book_05', customerId: 'cust_104', artistIds: [], customerName: 'Rohan Gupta', customerContact: "9876543214", eventType: 'Festival', serviceAddress: "address", date: new Date('2024-08-12'), service: 'Mehndi Package', amount: 1800, status: 'Needs Assignment', paidOut: false, eventDate: new Date('2024-08-13'), state: 'Maharashtra', district: 'Pune', location: 'MG Road' },
    { id: 'book_06', customerId: 'cust_105', artistIds: ['4'], customerName: 'Kavita Singh', customerContact: "9876543215", eventType: 'Wedding', serviceAddress: "address", date: new Date('2024-08-15'), service: 'Minimalist Mehndi', amount: 2200, status: 'Completed', paidOut: false, eventDate: new Date('2024-08-18'), state: 'Haryana', district: 'Gurugram', location: 'Cyber City' },
];


export default function AdminPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [approvedArtists, setApprovedArtists] = React.useState<Artist[]>([]);
    const [pendingArtists, setPendingArtists] = React.useState<PendingArtist[]>([]);
    const [selectedArtistIds, setSelectedArtistIds] = React.useState<string[]>([]);
    const [bookings, setBookings] = React.useState<Booking[]>([]);
    
    const [pendingBookingCount, setPendingBookingCount] = React.useState(0);
    const [financials, setFinancials] = React.useState({
        totalRevenue: 0,
        platformFee: 0,
        netProfit: 0
    });


    const fetchAdminData = React.useCallback(() => {
        // Fetch approved artists
        const storedArtists = localStorage.getItem('artists');
        const localArtists = storedArtists ? JSON.parse(storedArtists) : [];
        const allApproved = [...initialArtists.filter(a => !localArtists.some((la: Artist) => la.id === a.id)), ...localArtists];
        setApprovedArtists(allApproved);

        // Fetch pending artists
        const storedPending = localStorage.getItem('pendingArtists');
        try {
            const pending = storedPending ? JSON.parse(storedPending) : [];
            setPendingArtists(pending.map((p: any) => ({...p, id: p.email, date: new Date(p.submissionDate).toLocaleDateString(), name: p.fullName, location: `${p.district}, ${p.state}` })));
        } catch (e) {
            console.error("Failed to parse pending artists:", e);
            setPendingArtists([]);
        }
        
        // Fetch and count pending bookings
        const storedBookings = localStorage.getItem('bookings');
        const currentBookings: Booking[] = storedBookings ? JSON.parse(storedBookings).map((b: any) => ({...b, date: new Date(b.date)})) : allBookings;
        setBookings(currentBookings);
        const pendingCount = currentBookings.filter((b: Booking) => b.status === 'Pending Approval' || b.status === 'Needs Assignment').length;
        setPendingBookingCount(pendingCount);

    }, []);

    React.useEffect(() => {
        fetchAdminData();
        // Listen for storage changes to update lists
        window.addEventListener('storage', fetchAdminData);
        return () => window.removeEventListener('storage', fetchAdminData);
    }, [fetchAdminData]);

     // Effect for calculating financials
    React.useEffect(() => {
        const calculateRevenue = (filteredBookings: Booking[]) => {
            const platformFeePercentage = parseFloat(localStorage.getItem('platformFeePercentage') || '10') / 100;
            const refundFee = parseFloat(localStorage.getItem('platformRefundFee') || '500');

            const completed = filteredBookings.filter(b => b.status === 'Completed');
            const totalRevenue = completed.reduce((sum, b) => sum + b.amount, 0);
            const platformFee = totalRevenue * platformFeePercentage;
            const refunds = refundFee; // Mocked data for now
            const netProfit = platformFee - refunds; // Platform profit is the commission minus refunds

            return { totalRevenue, platformFee, netProfit };
        };

        setFinancials(calculateRevenue(bookings));

    }, [bookings]);

    const handleApprove = (artistId: string) => {
        const artistToApprove = pendingArtists.find(p => p.id === artistId);
        if (!artistToApprove) return;
        
        // Add to approved artists list
        const newArtist: Artist = {
            id: artistToApprove.id, // Using email as a unique ID for this prototype
            name: artistToApprove.name,
            email: artistToApprove.email,
            phone: artistToApprove.phone,
            password: artistToApprove.password, // Pass the password
            profilePicture: `https://picsum.photos/200/200?random=${Math.floor(Math.random() * 100)}`,
            workImages: [
                `https://picsum.photos/600/400?random=${Math.floor(Math.random() * 1000)}`,
                `https://picsum.photos/600/400?random=${Math.floor(Math.random() * 1000)}`,
            ],
            services: ['mehndi', 'makeup'], // Default for now
            location: artistToApprove.location,
            charge: 2000, // Default charge
            rating: 0, // New artist rating
            styleTags: ['new', 'verified'],
        };
        const updatedApprovedArtists = [...approvedArtists, newArtist];
        localStorage.setItem('artists', JSON.stringify(updatedApprovedArtists));

        // Remove from pending list
        const updatedPendingArtists = pendingArtists.filter(p => p.id !== artistId);
        localStorage.setItem('pendingArtists', JSON.stringify(updatedPendingArtists));
        
        // Update state
        fetchAdminData();

        toast({
            title: "Artist Approved",
            description: `Welcome! A notification has been sent to ${newArtist.name}'s app, email, and phone, informing them of the approval. They can now log in.`,
        });
    };

     const handleReject = (artistId: string) => {
        const artistToReject = pendingArtists.find(p => p.id === artistId);
        if (!artistToReject) return;

        // Remove from pending list
        const updatedPendingArtists = pendingArtists.filter(p => p.id !== artistId);
        localStorage.setItem('pendingArtists', JSON.stringify(updatedPendingArtists.map(({ id, ...rest }) => rest)));
        
        fetchAdminData();
        
        toast({
            title: "Artist Rejected",
            description: `A notification has been sent to ${artistToReject.name}'s app, email, and phone, informing them of the rejection.`,
            variant: "destructive"
        });
    };
    
    const handleAction = (action: string, type: string, id: string) => {
        toast({
            title: `${action} ${type}`,
            description: `Action '${action}' performed on ${type} with ID ${id}.`,
        });
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedArtistIds(approvedArtists.map(a => a.id));
        } else {
            setSelectedArtistIds([]);
        }
    };

    const handleSelectOne = (artistId: string, checked: boolean) => {
        if (checked) {
            setSelectedArtistIds(prev => [...prev, artistId]);
        } else {
            setSelectedArtistIds(prev => prev.filter(id => id !== artistId));
        }
    };

    const handleDownloadSelected = (format: 'json' | 'excel') => {
        const artistsToDownload = approvedArtists.filter(a => selectedArtistIds.includes(a.id));
        
        if (artistsToDownload.length === 0) {
            toast({
                title: "No artists selected",
                description: "Please select at least one artist to download.",
                variant: "destructive"
            });
            return;
        }

        if (format === 'json') {
            const dataStr = JSON.stringify(artistsToDownload, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `selected-artists-${new Date().toISOString()}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } else if (format === 'excel') {
            // We map to the format expected by our export utility
            const excelData = artistsToDownload.map(artist => ({ artist, bookings: [], reviews: [] }));
            exportToExcel(excelData, `selected-artists-${new Date().toISOString()}`);
        }
        
        toast({
            title: "Download Started",
            description: `Downloading details for ${artistsToDownload.length} artist(s) as a ${format.toUpperCase()} file.`,
        });
        setSelectedArtistIds([]);
    };

    const getStatusVariant = (status: Booking['status']) => {
        switch (status) {
            case 'Completed': return 'default';
            case 'Confirmed': return 'default';
            case 'Pending Approval': return 'secondary';
            case 'Needs Assignment': return 'destructive';
            case 'Cancelled': return 'destructive';
            case 'Disputed': return 'destructive';
            default: return 'outline';
        }
    };

    return (
        <>
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1>
            </div>
            <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{financials.totalRevenue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Based on completed bookings</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{bookings.length}</div>
                        <p className="text-xs text-muted-foreground">All-time bookings</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                        <Star className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">₹{financials.netProfit.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Total platform fees minus refunds</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Bookings</CardTitle>
                        <Bell className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingBookingCount}</div>
                        <p className="text-xs text-muted-foreground">Require assignment or approval</p>
                    </CardContent>
                </Card>
            </div>
            <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
                <div className="xl:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Bookings</CardTitle>
                            <CardDescription>A list of the most recent bookings on the platform.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Artist</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {bookings.slice(0, 5).map((booking) => {
                                        const assignedArtists = approvedArtists.filter(a => booking.artistIds.includes(a.id));
                                        return (
                                            <TableRow key={booking.id}>
                                                <TableCell>{booking.customerName}</TableCell>
                                                <TableCell>{assignedArtists.length > 0 ? assignedArtists.map(a => a.name).join(', ') : <span className="text-muted-foreground">N/A</span>}</TableCell>
                                                <TableCell>{new Date(booking.date).toLocaleDateString()}</TableCell>
                                                <TableCell>₹{booking.amount}</TableCell>
                                                <TableCell>
                                                    <Badge variant={getStatusVariant(booking.status)}>
                                                        {booking.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
                 <div className="xl:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pending Artist Approvals</CardTitle>
                            <CardDescription>
                                Review and approve new artist registrations.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Artist</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                     {pendingArtists.length > 0 ? pendingArtists.slice(0, 5).map((artist) => (
                                        <TableRow key={artist.id}>
                                            <TableCell>
                                                <div className="font-medium">{artist.name}</div>
                                                <div className="text-sm text-muted-foreground">{artist.location}</div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button aria-haspopup="true" size="icon" variant="ghost">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                            <span className="sr-only">Toggle menu</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem onSelect={() => handleApprove(artist.id)}>
                                                            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                                            Approve
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onSelect={() => handleReject(artist.id)}>
                                                            <XCircle className="mr-2 h-4 w-4 text-red-500" />
                                                            Reject
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center text-muted-foreground">No pending approvals</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            {pendingArtists.length > 5 && 
                                <div className="text-center mt-4">
                                     <Button variant="outline" size="sm" asChild>
                                         <Link href="/admin/approvals">View All Approvals</Link>
                                     </Button>
                                </div>
                            }
                        </CardContent>
                    </Card>
                 </div>
            </div>
        </>
    );
}

