
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, CheckCircle, XCircle, MoreHorizontal, Pencil, Trash2, MapPin, Image as ImageIcon, Users, Bell, User, Eye, Download, ChevronDown, Calendar as CalendarIcon, Briefcase } from "lucide-react";
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
  [key: string]: any; // To accommodate other registration fields
};

// Mock data for bookings across all artists for the master calendar
const allBookings: Booking[] = [
    { id: 'book_01', artistId: '1', customerName: 'Priya Patel', customerContact: "9876543210", serviceAddress: "address", date: new Date('2024-07-20'), service: 'Bridal Mehndi', amount: 5000, status: 'Completed' },
    { id: 'book_02', artistId: '2', customerName: 'Anjali Sharma', customerContact: "9876543211", serviceAddress: "address", date: new Date('2024-07-25'), service: 'Party Makeup', amount: 3000, status: 'Completed' },
    { id: 'book_03', artistId: '3', customerName: 'Sneha Reddy', customerContact: "9876543212", serviceAddress: "address", date: new Date('2024-08-05'), service: 'Mehndi & Makeup', amount: 8000, status: 'Pending Approval' },
    { id: 'book_04', artistId: '1', customerName: 'Meera Iyer', customerContact: "9876543213", serviceAddress: "address", date: new Date('2024-08-10'), service: 'Engagement Makeup', amount: 4500, status: 'Confirmed' },
    { id: 'book_05', artistId: null, customerName: 'Rohan Gupta', customerContact: "9876543214", serviceAddress: "address", date: new Date('2024-08-12'), service: 'Mehndi Package', amount: 1800, status: 'Needs Assignment' },
    { id: 'book_06', artistId: '4', customerName: 'Kavita Singh', customerContact: "9876543215", serviceAddress: "address", date: new Date('2024-08-15'), service: 'Minimalist Mehndi', amount: 2200, status: 'Pending Approval' },
];


export default function AdminPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [approvedArtists, setApprovedArtists] = React.useState<Artist[]>([]);
    const [pendingArtists, setPendingArtists] = React.useState<PendingArtist[]>([]);
    const [selectedArtistIds, setSelectedArtistIds] = React.useState<string[]>([]);
    const [bookings, setBookings] = React.useState<Booking[]>(allBookings);
    const [pendingBookingCount, setPendingBookingCount] = React.useState(0);

    const fetchAdminData = React.useCallback(() => {
        // Fetch approved artists
        const storedArtists = localStorage.getItem('artists');
        setApprovedArtists(storedArtists ? JSON.parse(storedArtists) : initialArtists);

        // Fetch pending artists
        const storedPending = localStorage.getItem('pendingArtists');
        const pending = storedPending ? JSON.parse(storedPending) : [];
        setPendingArtists(pending.map((p: any) => ({...p, id: p.email, date: new Date(p.submissionDate).toLocaleDateString(), name: p.fullName, location: `${p.district}, ${p.state}` })));
        
        // Fetch and count pending bookings
        const storedBookings = localStorage.getItem('bookings');
        const currentBookings = storedBookings ? JSON.parse(storedBookings) : allBookings;
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
            id: artistToApprove.id,
            name: artistToApprove.name,
            email: artistToApprove.email, // Make sure email is carried over
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
        localStorage.setItem('pendingArtists', JSON.stringify(updatedPendingArtists.map(({ id, ...rest }) => rest)));
        
        // Update state
        fetchAdminData();

        toast({
            title: "Artist Approved",
            description: `A notification has been sent to ${artistToApprove.name}'s app, email, and phone, informing them of the approval. They can now log in.`,
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
            default: return 'outline';
        }
    };

    const bookedDates = bookings.filter(b => b.status === 'Confirmed' || b.status === 'Completed').map(b => new Date(b.date));

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
                        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Team Management</CardTitle>
                                    <CardDescription>
                                       Add or manage team members and their roles.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Link href="/admin/team">
                                        <Button>
                                            <Users className="mr-2 h-4 w-4" />
                                            Manage Team
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader>
                                    <CardTitle>Notifications</CardTitle>
                                     <CardDescription>
                                        You have {pendingBookingCount} pending booking(s).
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex items-center gap-2">
                                     <Link href="/admin/bookings">
                                        <Button>
                                            <Bell className="mr-2 h-4 w-4" />
                                            View Bookings
                                        </Button>
                                     </Link>
                                     {pendingBookingCount > 0 && 
                                        <Badge variant="destructive">{pendingBookingCount}</Badge>
                                     }
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>My Profile</CardTitle>
                                    <CardDescription>
                                        Update your admin account details and password.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Link href="/admin/profile">
                                        <Button>
                                            <User className="mr-2 h-4 w-4" />
                                            Manage Profile
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
                                                    const artist = approvedArtists.find(a => a.id === booking.artistId);
                                                    return (
                                                        <TableRow key={booking.id}>
                                                            <TableCell>{booking.customerName}</TableCell>
                                                            <TableCell>{artist ? artist.name : <span className="text-muted-foreground">N/A</span>}</TableCell>
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
                                <CardTitle>Site Configuration</CardTitle>
                                <CardDescription>
                                    Manage global settings for the application.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4">
                               <Link href="/admin/locations">
                                    <Button variant="outline" className="w-full justify-start gap-2">
                                        <MapPin />
                                        Manage Locations
                                    </Button>
                                </Link>
                                <Link href="/admin/images">
                                    <Button variant="outline" className="w-full justify-start gap-2">
                                        <ImageIcon />
                                        Manage Images
                                    </Button>
                                </Link>
                                <Link href="/admin/bookings">
                                    <Button variant="outline" className="w-full justify-start gap-2">
                                        <Briefcase />
                                        Manage Bookings
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    );
}
