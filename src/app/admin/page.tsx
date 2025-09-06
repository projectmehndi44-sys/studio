
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, CheckCircle, XCircle, MoreHorizontal, Pencil, Trash2, MapPin } from "lucide-react";
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
import { artists as approvedArtistsData } from '@/lib/data';

export default function AdminPage() {
    const router = useRouter();
    const { toast } = useToast();

    React.useEffect(() => {
        const isAdminAuthenticated = localStorage.getItem('isAdminAuthenticated');
        if (isAdminAuthenticated !== 'true') {
            router.push('/admin/login');
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('isAdminAuthenticated');
        router.push('/admin/login');
    };

    // In a real application, you would fetch this data from your backend.
    const pendingArtists = [
        { 
            id: 'artist_001', 
            name: 'Creative Hands by S', 
            email: 's@example.com', 
            phone: '9876543210',
            location: 'Mumbai, Maharashtra',
            date: '2023-10-27',
            status: 'Pending'
        },
        { 
            id: 'artist_002', 
            name: 'Makeup by Riya', 
            email: 'riya@example.com', 
            phone: '8765432109',
            location: 'South Delhi, Delhi',
            date: '2023-10-26',
            status: 'Pending'
        },
        { 
            id: 'artist_003', 
            name: 'Modern Mehndi', 
            email: 'modern@example.com', 
            phone: '7654321098',
            location: 'Koregaon Park, Pune',
            date: '2023-10-28',
            status: 'Pending'
        },
    ];

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

    const approvedArtists = approvedArtistsData.map(artist => ({...artist, status: 'Approved'}));

    const handleApprove = (artistId: string) => {
        toast({
            title: "Artist Approved",
            description: `Artist with ID ${artistId} has been approved.`,
        });
        // Here you would add logic to update the artist's status in your database.
    };

     const handleReject = (artistId: string) => {
        toast({
            title: "Artist Rejected",
            description: `Artist with ID ${artistId} has been rejected.`,
            variant: "destructive"
        });
        // Here you would add logic to update the artist's status in your database.
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
                         <Card>
                            <CardHeader>
                                <CardTitle>All Data Control - Artists</CardTitle>
                                <CardDescription>
                                    Manage all approved artists from this central hub.
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
                                        {approvedArtists.map((artist) => (
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
                    </div>
                </main>
            </div>
        </div>
    );
}

    