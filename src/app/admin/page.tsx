
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, CheckCircle, XCircle, MoreHorizontal, Pencil, Trash2, Users, Eye, Download, ChevronDown, Calendar as CalendarIcon, Briefcase, Settings, DollarSign, BarChart, RefreshCw, Star, Bell, AlertOctagon, IndianRupee } from "lucide-react";
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
import type { Artist, Booking } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { exportToExcel } from '@/lib/export';
import { Calendar } from '@/components/ui/calendar';

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
    { id: 'book_01', artistIds: ['1'], customerName: 'Priya Patel', customerContact: "9876543210", serviceAddress: "address", date: new Date('2024-07-20'), service: 'Bridal Mehndi', amount: 5000, status: 'Completed', paidOut: true },
    { id: 'book_02', artistIds: ['2'], customerName: 'Anjali Sharma', customerContact: "9876543211", serviceAddress: "address", date: new Date('2024-07-25'), service: 'Party Makeup', amount: 3000, status: 'Completed', paidOut: false },
    { id: 'book_03', artistIds: ['3'], customerName: 'Sneha Reddy', customerContact: "9876543212", serviceAddress: "address", date: new Date('2024-08-05'), service: 'Mehndi & Makeup', amount: 8000, status: 'Pending Approval', paidOut: false },
    { id: 'book_04', artistIds: ['1'], customerName: 'Meera Iyer', customerContact: "9876543213", serviceAddress: "address", date: new Date('2024-08-10'), service: 'Engagement Makeup', amount: 4500, status: 'Confirmed', paidOut: false },
    { id: 'book_05', artistIds: [], customerName: 'Rohan Gupta', customerContact: "9876543214", serviceAddress: "address", date: new Date('2024-08-12'), service: 'Mehndi Package', amount: 1800, status: 'Needs Assignment', paidOut: false },
    { id: 'book_06', artistIds: ['4'], customerName: 'Kavita Singh', customerContact: "9876543215", serviceAddress: "address", date: new Date('2024-08-15'), service: 'Minimalist Mehndi', amount: 2200, status: 'Completed', paidOut: false },
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
        overall: { totalRevenue: 0, platformFee: 0, gst: 0, netPayout: 0, refunds: 0, netProfit: 0 },
        currentMonth: { totalRevenue: 0, platformFee: 0, gst: 0, netPayout: 0, refunds: 0, netProfit: 0 },
        lastMonth: { totalRevenue: 0, platformFee: 0, gst: 0, netPayout: 0, refunds: 0, netProfit: 0 },
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
        const isAdminAuthenticated = localStorage.getItem('isAdminAuthenticated');
        if (isAdminAuthenticated !== 'true') {
            router.push('/admin/login');
        } else {
            fetchAdminData();
             // Listen for storage changes to update lists
            window.addEventListener('storage', fetchAdminData);
            return () => window.removeEventListener('storage', fetchAdminData);
        }
    }, [router, fetchAdminData]);

     // Effect for calculating financials
    React.useEffect(() => {
        const calculateRevenue = (filteredBookings: Booking[]) => {
            const platformFeePercentage = parseFloat(localStorage.getItem('platformFeePercentage') || '10') / 100;
            const refundFee = parseFloat(localStorage.getItem('platformRefundFee') || '500');

            const completed = filteredBookings.filter(b => b.status === 'Completed');
            const totalRevenue = completed.reduce((sum, b) => sum + b.amount, 0);
            const platformFee = totalRevenue * platformFeePercentage;
            const gst = totalRevenue * 0.18; // 18% GST on artist's gross service value
            const refunds = refundFee; // Mocked data for now
            const netPayout = totalRevenue - platformFee - gst; // Artist payout after commission and GST
            const netProfit = platformFee - refunds; // Platform profit is the commission minus refunds

            return { totalRevenue, platformFee, gst, netPayout, refunds, netProfit };
        };
        
        const getMonthYear = (date: Date) => new Date(date).toLocaleString('default', { month: 'long', year: 'numeric' });
        
        const currentMonth = new Date();
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const currentMonthBookings = bookings.filter(b => getMonthYear(new Date(b.date)) === getMonthYear(currentMonth));
        const lastMonthBookings = bookings.filter(b => getMonthYear(new Date(b.date)) === getMonthYear(lastMonth));

        setFinancials({
            overall: calculateRevenue(bookings),
            currentMonth: calculateRevenue(currentMonthBookings),
            lastMonth: calculateRevenue(lastMonthBookings),
        });

    }, [bookings]);

    const handleLogout = () => {
        localStorage.removeItem('isAdminAuthenticated');
        localStorage.removeItem('adminRole');
        localStorage.removeItem('adminUsername');
        router.push('/admin/login');
    };

    const customers = [
        {
            id: 'cust_101',
            name: 'Priya Patel',
            email: 'priya.p@email.com',
            phone: '9123456780',
            registeredOn: '2023-10-25',
            status: 'Active'
        },
        {
            id: 'cust_102',
            name: 'Amit Singh',
            email: 'amit.singh@email.com',
            phone: '9098765432',
            registeredOn: '2023-10-24',
            status: 'Active'
        },
        {
            id: 'cust_103',
            name: 'Sunita Rao',
            email: 'sunita.r@email.com',
            phone: '9988776655',
            registeredOn: '2023-10-22',
            status: 'Suspended'
        }
    ];

    const allArtistsWithStatus = approvedArtists.map(artist => ({...artist, status: 'Approved'}));

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

    const bookedDates = bookings.filter(b => b.status === 'Confirmed' || b.status === 'Completed').map(b => new Date(b.date));
    const currentMonthYear = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthYear = lastMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
    

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <div className="flex flex-col sm:gap-4 sm:py-4">
                <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 justify-between">
                    <h1 className="flex items-center gap-2 text-2xl font-bold text-primary">
                        <Shield className="w-8 h-8" />
                        Admin Portal
                    </h1>
                    <Button onClick={handleLogout} variant="outline">Logout</Button>
                </header>
                <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
                    <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
                        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Manage Bookings</CardTitle>
                                     <CardDescription>
                                        You have {pendingBookingCount} pending booking(s).
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex items-center gap-2">
                                     <Link href="/admin/bookings">
                                        <Button>
                                            <Briefcase className="mr-2 h-4 w-4" />
                                            View All Bookings
                                        </Button>
                                     </Link>
                                     {pendingBookingCount > 0 && 
                                        <Badge variant="destructive">{pendingBookingCount}</Badge>
                                     }
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Notifications</CardTitle>
                                    <CardDescription>
                                        Send alerts to artists and customers.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Link href="/admin/notifications">
                                        <Button>
                                            <Bell className="mr-2 h-4 w-4" />
                                            Send Notification
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader>
                                    <CardTitle>Artist Payouts</CardTitle>
                                    <CardDescription>
                                       Manage artist earnings and payments.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Link href="/admin/payouts">
                                        <Button>
                                            <IndianRupee className="mr-2 h-4 w-4" />
                                            Go to Payouts
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader>
                                    <CardTitle>Settings</CardTitle>
                                    <CardDescription>
                                       Manage team, locations, and profile.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Link href="/admin/settings">
                                        <Button>
                                            <Settings className="mr-2 h-4 w-4" />
                                            Go to Settings
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        </div>
                        <Tabs defaultValue="approvals">
                             <TabsList>
                                <TabsTrigger value="approvals">Artist Approvals</TabsTrigger>
                                <TabsTrigger value="artists">Artist Management</TabsTrigger>
                                <TabsTrigger value="customers">Customer Management</TabsTrigger>
                                <TabsTrigger value="bookings">All Bookings</TabsTrigger>
                            </TabsList>
                            <TabsContent value="approvals">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Pending Artist Approvals</CardTitle>
                                        <CardDescription>
                                            Review and approve new artist registrations. There are currently {pendingArtists.length} pending approvals.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Artist Name</TableHead>
                                                    <TableHead>Contact</TableHead>
                                                    <TableHead>Location</TableHead>
                                                    <TableHead>Registered On</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>
                                                        <span className="sr-only">Actions</span>
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {pendingArtists.map((artist) => (
                                                    <TableRow key={artist.id}>
                                                        <TableCell className="font-medium">{artist.name}</TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-col">
                                                                <span>{artist.email}</span>
                                                                <span className="text-muted-foreground">{artist.phone}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>{artist.location}</TableCell>
                                                        <TableCell>{artist.date}</TableCell>
                                                        <TableCell>
                                                            <Badge variant={artist.status === 'Pending' ? 'secondary' : 'default'}>
                                                                {artist.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
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
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                             <TabsContent value="artists">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <div>
                                            <CardTitle>Artist Management</CardTitle>
                                            <CardDescription>
                                                View and manage all approved artists. {selectedArtistIds.length} of {approvedArtists.length} selected.
                                            </CardDescription>
                                        </div>
                                         <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button disabled={selectedArtistIds.length === 0}>
                                                    <Download className="mr-2 h-4 w-4" />
                                                    Download Selected ({selectedArtistIds.length})
                                                    <ChevronDown className="ml-2 h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={() => handleDownloadSelected('json')}>JSON</DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handleDownloadSelected('excel')}>Excel</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </CardHeader>
                                    <CardContent>
                                    <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-12">
                                                        <Checkbox 
                                                          checked={selectedArtistIds.length === approvedArtists.length && approvedArtists.length > 0}
                                                          onCheckedChange={(checked) => handleSelectAll(!!checked)}
                                                          aria-label="Select all"
                                                        />
                                                    </TableHead>
                                                    <TableHead>Artist</TableHead>
                                                    <TableHead>Location</TableHead>
                                                    <TableHead>Services</TableHead>
                                                    <TableHead>Charge</TableHead>
                                                    <TableHead>Rating</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>
                                                        <span className="sr-only">Actions</span>
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {allArtistsWithStatus.map((artist) => (
                                                    <TableRow key={artist.id}>
                                                         <TableCell>
                                                            <Checkbox
                                                                checked={selectedArtistIds.includes(artist.id)}
                                                                onCheckedChange={(checked) => handleSelectOne(artist.id, !!checked)}
                                                                aria-label={`Select ${artist.name}`}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="font-medium flex items-center gap-2">
                                                            <Avatar>
                                                                <AvatarImage src={artist.profilePicture} alt={artist.name} />
                                                                <AvatarFallback>{artist.name.charAt(0)}</AvatarFallback>
                                                            </Avatar>
                                                            {artist.name}
                                                        </TableCell>
                                                        <TableCell>{artist.location}</TableCell>
                                                        <TableCell className="capitalize">{artist.services.join(', ')}</TableCell>
                                                        <TableCell>₹{artist.charge}</TableCell>
                                                        <TableCell>{artist.rating}</TableCell>
                                                        <TableCell>
                                                            <Badge>
                                                                {artist.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                        <span className="sr-only">Toggle menu</span>
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                     <DropdownMenuItem onSelect={() => router.push(`/admin/artists/${artist.id}`)}>
                                                                        <Eye className="mr-2 h-4 w-4" />
                                                                        View Details
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onSelect={() => handleAction('Edit', 'Artist', artist.id)}>
                                                                        <Pencil className="mr-2 h-4 w-4" />
                                                                        Edit
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onSelect={() => handleAction('Delete', 'Artist', artist.id)}>
                                                                        <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                                                                        Delete
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                             </TabsContent>
                             <TabsContent value="customers">
                                 <Card>
                                    <CardHeader>
                                        <CardTitle>Customer Management</CardTitle>
                                        <CardDescription>
                                            View and manage registered customers.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                    <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Customer Name</TableHead>
                                                    <TableHead>Contact</TableHead>
                                                    <TableHead>Registered On</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>
                                                        <span className="sr-only">Actions</span>
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {customers.map((customer) => (
                                                    <TableRow key={customer.id}>
                                                        <TableCell className="font-medium">{customer.name}</TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-col">
                                                                <span>{customer.email}</span>
                                                                <span className="text-muted-foreground">{customer.phone}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>{customer.registeredOn}</TableCell>
                                                        <TableCell>
                                                            <Badge variant={customer.status === 'Active' ? 'default' : 'destructive'}>
                                                                {customer.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                        <span className="sr-only">Toggle menu</span>
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                    <DropdownMenuItem onSelect={() => handleAction('Suspend', 'Customer', customer.id)}>
                                                                        <XCircle className="mr-2 h-4 w-4 text-yellow-500" />
                                                                        Suspend
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onSelect={() => handleAction('Delete', 'Customer', customer.id)}>
                                                                        <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                                                                        Delete
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                             </TabsContent>
                              <TabsContent value="bookings">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>All Bookings</CardTitle>
                                        <CardDescription>
                                            View all bookings across the platform.
                                        </CardDescription>
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
                                                {bookings.map((booking) => {
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
                            </TabsContent>
                        </Tabs>
                    </div>
                     <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-1">
                        <Card>
                             <CardHeader>
                                <CardTitle className="flex items-center gap-2"><CalendarIcon className="w-5 h-5 text-primary"/> Platform Schedule</CardTitle>
                                <CardDescription>Consolidated view of all artist bookings. Red dates are booked.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex justify-center">
                                <Calendar
                                    mode="multiple"
                                    selected={bookedDates}
                                    className="rounded-md border"
                                    classNames={{ day_selected: "bg-red-500 text-white hover:bg-red-600 focus:bg-red-600" }}
                                    disabled
                                />
                            </CardContent>
                        </Card>
                       <Card>
                            <CardHeader>
                                <CardTitle>Overall Revenue</CardTitle>
                                <CardDescription>Financial overview for all time.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center border-b pb-2">
                                    <span className="text-muted-foreground flex items-center gap-2"><DollarSign /> Total Revenue</span>
                                    <span className="font-bold text-lg">₹{financials.overall.totalRevenue.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center border-b pb-2">
                                    <span className="text-muted-foreground flex items-center gap-2"><BarChart /> Platform Fees</span>
                                    <span className="font-bold text-lg">₹{financials.overall.platformFee.toLocaleString()}</span>
                                </div>
                                 <div className="flex justify-between items-center border-b pb-2">
                                    <span className="text-muted-foreground flex items-center gap-2"><BarChart /> GST on Revenue (18%)</span>
                                    <span className="font-bold text-lg">₹{financials.overall.gst.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center border-b pb-2">
                                    <span className="text-muted-foreground flex items-center gap-2"><Users /> Net Payout to Artists</span>
                                    <span className="font-bold text-lg">₹{financials.overall.netPayout.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center border-b pb-2">
                                    <span className="text-muted-foreground flex items-center gap-2"><RefreshCw /> Refunds Processed</span>
                                    <span className="font-bold text-lg text-amber-600">- ₹{financials.overall.refunds.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 bg-muted -mx-6 px-6 py-3 rounded-b-lg">
                                    <span className="font-bold text-primary flex items-center gap-2"><Star /> Net Profit</span>
                                    <span className="font-extrabold text-xl text-green-600">₹{financials.overall.netProfit.toLocaleString()}</span>
                                </div>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle>Monthly Revenue</CardTitle>
                                <CardDescription>This Month vs. Last Month</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-center text-primary">{currentMonthYear}</h4>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Revenue:</span>
                                        <span className="font-bold">₹{financials.currentMonth.totalRevenue.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Profit:</span>
                                        <span className="font-bold">₹{financials.currentMonth.netProfit.toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-center text-primary">{lastMonthYear}</h4>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Revenue:</span>
                                        <span className="font-bold">₹{financials.lastMonth.totalRevenue.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Profit:</span>
                                        <span className="font-bold">₹{financials.lastMonth.netProfit.toLocaleString()}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    );
}
