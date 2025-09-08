
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';
import { Download, ChevronDown, CheckCircle, XCircle, MoreHorizontal, Eye, Pencil, Trash2, UserPlus } from 'lucide-react';
import type { Artist } from '@/types';
import { artists as initialArtists } from '@/lib/data';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { exportToExcel } from '@/lib/export';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

type PendingArtist = {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  date: string;
  status: 'Pending';
  password?: string;
  [key: string]: any;
};

const onboardSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^\d{10}$/, "Must be a 10-digit phone number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  location: z.string().min(3, "Location is required"),
  charge: z.coerce.number().min(0, "Charge must be a positive number"),
});
type OnboardFormValues = z.infer<typeof onboardSchema>;


export default function ArtistManagementPage() {
    const router = useRouter();
    const { toast } = useToast();

    const [approvedArtists, setApprovedArtists] = React.useState<Artist[]>([]);
    const [pendingArtists, setPendingArtists] = React.useState<PendingArtist[]>([]);
    const [selectedArtistIds, setSelectedArtistIds] = React.useState<string[]>([]);
    
    const form = useForm<OnboardFormValues>({
        resolver: zodResolver(onboardSchema),
        defaultValues: { name: '', email: '', phone: '', password: '', location: '', charge: 2500 },
    });

    const getArtists = React.useCallback((): Artist[] => {
        const storedArtists = localStorage.getItem('artists');
        const localArtists: Artist[] = storedArtists ? JSON.parse(storedArtists) : [];
        const allArtistsMap = new Map<string, Artist>();
        initialArtists.forEach(a => allArtistsMap.set(a.id, a));
        localArtists.forEach(a => allArtistsMap.set(a.id, a));
        return Array.from(allArtistsMap.values());
    }, []);

    const fetchAdminData = React.useCallback(() => {
        setApprovedArtists(getArtists());
        const storedPending = localStorage.getItem('pendingArtists');
        try {
            const pending = storedPending ? JSON.parse(storedPending) : [];
            setPendingArtists(pending.map((p: any) => ({...p, id: p.email, date: new Date(p.submissionDate).toLocaleDateString(), name: p.fullName, location: `${p.district}, ${p.state}` })));
        } catch (e) {
            setPendingArtists([]);
        }
    }, [getArtists]);

    React.useEffect(() => {
        const isAdminAuthenticated = localStorage.getItem('isAdminAuthenticated');
        if (isAdminAuthenticated !== 'true') {
            router.push('/admin/login');
        } else {
            fetchAdminData();
            window.addEventListener('storage', fetchAdminData);
            return () => window.removeEventListener('storage', fetchAdminData);
        }
    }, [router, fetchAdminData]);

    const handleApprove = (artistId: string) => {
        const artistToApprove = pendingArtists.find(p => p.id === artistId);
        if (!artistToApprove) return;
        
        const newArtist: Artist = {
            id: artistToApprove.id,
            name: artistToApprove.name,
            email: artistToApprove.email,
            phone: artistToApprove.phone,
            password: artistToApprove.password,
            profilePicture: `https://picsum.photos/200/200?random=${Math.floor(Math.random() * 100)}`,
            workImages: [
                `https://picsum.photos/600/400?random=${Math.floor(Math.random() * 1000)}`,
                `https://picsum.photos/600/400?random=${Math.floor(Math.random() * 1000)}`,
            ],
            services: ['mehndi', 'makeup'],
            location: artistToApprove.location,
            charge: 2000,
            charges: { mehndi: 2000, makeup: 3000 },
            rating: 0,
            styleTags: ['new', 'verified'],
        };
        const currentArtists = getArtists();
        const updatedApprovedArtists = [...currentArtists, newArtist];
        const updatedLocalArtists = JSON.parse(localStorage.getItem('artists') || '[]').filter((a: Artist) => a.id !== newArtist.id);
        localStorage.setItem('artists', JSON.stringify([...updatedLocalArtists, newArtist]));

        const updatedPendingArtists = pendingArtists.filter(p => p.id !== artistId);
        localStorage.setItem('pendingArtists', JSON.stringify(updatedPendingArtists));
        
        fetchAdminData();

        toast({
            title: "Artist Approved",
            description: `A notification has been sent to ${newArtist.name}.`,
        });
    };

     const handleReject = (artistId: string) => {
        const artistToReject = pendingArtists.find(p => p.id === artistId);
        if (!artistToReject) return;

        const updatedPendingArtists = pendingArtists.filter(p => p.id !== artistId);
        localStorage.setItem('pendingArtists', JSON.stringify(updatedPendingArtists.map(({ id, ...rest }) => rest)));
        
        fetchAdminData();
        
        toast({
            title: "Artist Rejected",
            description: `A notification has been sent to ${artistToReject.name}.`,
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
            const excelData = artistsToDownload.map(artist => ({ artist, bookings: [], reviews: [] }));
            exportToExcel(excelData, `selected-artists-${new Date().toISOString()}`);
        }
        
        toast({
            title: "Download Started",
            description: `Downloading details for ${artistsToDownload.length} artist(s) as a ${format.toUpperCase()} file.`,
        });
        setSelectedArtistIds([]);
    };
    
    const onOnboardSubmit: SubmitHandler<OnboardFormValues> = (data) => {
        const currentArtists = getArtists();
        if (currentArtists.some(a => a.email === data.email)) {
            form.setError('email', { message: 'An artist with this email already exists.' });
            return;
        }

        const newArtist: Artist = {
            id: data.email, // Using email as a unique ID for admin-added artists
            name: data.name,
            email: data.email,
            phone: data.phone,
            password: data.password,
            profilePicture: `https://picsum.photos/200/200?random=${Math.floor(Math.random() * 100)}`,
            workImages: [
                `https://picsum.photos/600/400?random=${Math.floor(Math.random() * 1000)}`,
                `https://picsum.photos/600/400?random=${Math.floor(Math.random() * 1000)}`,
            ],
            services: ['mehndi', 'makeup'],
            location: data.location,
            charge: data.charge,
            charges: { mehndi: data.charge, makeup: data.charge },
            rating: 0,
            styleTags: ['new', 'verified'],
        };
        
        const updatedLocalArtists = JSON.parse(localStorage.getItem('artists') || '[]');
        localStorage.setItem('artists', JSON.stringify([...updatedLocalArtists, newArtist]));

        fetchAdminData();
        toast({
            title: "Artist Onboarded",
            description: `${newArtist.name} has been added to the platform.`,
        });
        form.reset();
    };

    return (
        <>
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Artist Management</h1>
            </div>
            <Tabs defaultValue="approved">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="approved">Approved Artists</TabsTrigger>
                    <TabsTrigger value="pending">Pending Approvals</TabsTrigger>
                    <TabsTrigger value="onboard">Onboard Artist</TabsTrigger>
                </TabsList>
                <TabsContent value="approved">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Approved Artists</CardTitle>
                                <CardDescription>
                                    View and manage all approved artists. {selectedArtistIds.length} of {approvedArtists.length} selected.
                                </CardDescription>
                            </div>
                                <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button disabled={selectedArtistIds.length === 0}>
                                        <Download className="mr-2 h-4 w-4" />
                                        Download ({selectedArtistIds.length})
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
                                        <TableHead>Contact Info</TableHead>
                                        <TableHead>Services</TableHead>
                                        <TableHead>Base Charge</TableHead>
                                        <TableHead>Rating</TableHead>
                                        <TableHead><span className="sr-only">Actions</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {approvedArtists.map((artist) => (
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
                                                <div className="flex flex-col">
                                                    <span>{artist.name}</span>
                                                    <span className="text-xs text-muted-foreground">{artist.location}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span>{artist.email}</span>
                                                    <span className="text-xs text-muted-foreground">{artist.phone}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {artist.services.map(service => (
                                                        <Badge key={service} variant="secondary" className="capitalize">{service}</Badge>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell>₹{artist.charge}</TableCell>
                                            <TableCell>{artist.rating}</TableCell>
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
                <TabsContent value="pending">
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
                                        <TableHead><span className="sr-only">Actions</span></TableHead>
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
                 <TabsContent value="onboard">
                    <Card>
                        <CardHeader>
                            <CardTitle>Onboard New Artist</CardTitle>
                            <CardDescription>
                                Directly create a new artist profile, bypassing the registration queue.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onOnboardSubmit)} className="space-y-6">
                                     <div className="grid md:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="name" render={({ field }) => (
                                            <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Artist's full name" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                         <FormField control={form.control} name="email" render={({ field }) => (
                                            <FormItem><FormLabel>Email (will be username)</FormLabel><FormControl><Input type="email" placeholder="artist@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="phone" render={({ field }) => (
                                            <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input type="tel" placeholder="10-digit number" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="password" render={({ field }) => (
                                            <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder="Set a password" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </div>
                                    <Separator />
                                     <div className="grid md:grid-cols-2 gap-4">
                                         <FormField control={form.control} name="location" render={({ field }) => (
                                            <FormItem><FormLabel>Location</FormLabel><FormControl><Input placeholder="e.g., Pune, Maharashtra" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="charge" render={({ field }) => (
                                            <FormItem><FormLabel>Base Charge (per service)</FormLabel><FormControl><Input type="number" placeholder="2500" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </div>
                                    <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                                        <UserPlus className="mr-2 h-4 w-4"/>
                                        {form.formState.isSubmitting ? 'Onboarding...' : 'Onboard Artist'}
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </>
    );
}
