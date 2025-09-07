
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, CheckCircle, XCircle, MoreHorizontal, Pencil, Trash2, MapPin, Image as ImageIcon, Users, Bell, User, Eye } from "lucide-react";
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
import type { Artist } from '@/types';

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


export default function AdminPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [approvedArtists, setApprovedArtists] = React.useState<Artist[]>([]);
    const [pendingArtists, setPendingArtists] = React.useState<PendingArtist[]>([]);


    const fetchArtists = React.useCallback(() => {
        // Fetch approved artists
        const storedArtists = localStorage.getItem('artists');
        setApprovedArtists(storedArtists ? JSON.parse(storedArtists) : initialArtists);

        // Fetch pending artists
        const storedPending = localStorage.getItem('pendingArtists');
        const pending = storedPending ? JSON.parse(storedPending) : [];
        setPendingArtists(pending.map((p: any) => ({...p, id: p.email, date: new Date(p.submissionDate).toLocaleDateString(), name: p.fullName, location: `${p.district}, ${p.state}` })));

    }, []);

    React.useEffect(() => {
        const isAdminAuthenticated = localStorage.getItem('isAdminAuthenticated');
        if (isAdminAuthenticated !== 'true') {
            router.push('/admin/login');
        } else {
            fetchArtists();
             // Listen for storage changes to update lists
            window.addEventListener('storage', fetchArtists);
            return () => window.removeEventListener('storage', fetchArtists);
        }
    }, [router, fetchArtists]);

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
        fetchArtists();

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
        
        fetchArtists();
        
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
    }

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
                <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                    <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
                        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5">
                            <Card>
                                 <CardHeader>
                                    <CardTitle>Location Management</CardTitle>
                                    <CardDescription>
                                        Define the states and districts where your services are available.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Link href="/admin/locations">
                                        <Button>
                                            <MapPin className="mr-2 h-4 w-4" />
                                            Manage Locations
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader>
                                    <CardTitle>Image Management</CardTitle>
                                    <CardDescription>
                                       Manage gallery and background images for the homepage.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Link href="/admin/images">
                                        <Button>
                                            <ImageIcon className="mr-2 h-4 w-4" />
                                            Manage Images
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
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
                                       Send notifications to artists and customers.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Link href="/admin/notifications">
                                        <Button>
                                            <Bell className="mr-2 h-4 w-4" />
                                            Send Notifications
                                        </Button>
                                    </Link>
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
                                    <CardHeader>
                                        <CardTitle>Artist Management</CardTitle>
                                        <CardDescription>
                                            View and manage all approved artists.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                    <Table>
                                            <TableHeader>
                                                <TableRow>
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
                        </Tabs>
                    </div>
                </main>
            </div>
        </div>
    );
}
