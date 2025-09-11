

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
import { Download, ChevronDown, CheckCircle, XCircle, MoreHorizontal, Eye, Pencil, Trash2, UserPlus, ShieldOff } from 'lucide-react';
import type { Artist, Notification } from '@/types';
import { listenToCollection, createArtist, deletePendingArtist, deleteArtist, updateArtist, createNotification } from '@/lib/services';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { exportToExcel } from '@/lib/export';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { createUser } from '@/lib/firebase';

type PendingArtist = Omit<Artist, 'id'> & {
  id: string; // email is used as ID here
  status: 'Pending';
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
    const { hasPermission } = useAdminAuth();

    const [approvedArtists, setApprovedArtists] = React.useState<Artist[]>([]);
    const [pendingArtists, setPendingArtists] = React.useState<PendingArtist[]>([]);
    const [selectedArtistIds, setSelectedArtistIds] = React.useState<string[]>([]);
    
    const form = useForm<OnboardFormValues>({
        resolver: zodResolver(onboardSchema),
        defaultValues: { name: '', email: '', phone: '', password: '', location: '', charge: 2500 },
    });
    
    React.useEffect(() => {
        const unsubscribeApproved = listenToCollection<Artist>('artists', setApprovedArtists);
        const unsubscribePending = listenToCollection<any>('pendingArtists', (data) => {
             const pending = data.map((p: any) => ({
                ...p,
                id: p.email,
                originalId: p.id,
                date: p.submissionDate ? new Date(p.submissionDate).toLocaleDateString() : 'N/A', 
                name: p.fullName,
                location: `${p.district}, ${p.state}`
             }));
            setPendingArtists(pending);
        });

        return () => {
            unsubscribeApproved();
            unsubscribePending();
        };
    }, []);

    const handleApprove = async (artistId: string) => {
        const artistToApprove = pendingArtists.find(p => p.id === artistId);
        if (!artistToApprove) return;
        
        try {
            const authUser = await createUser(artistToApprove.email, artistToApprove.password);

            const newArtist: Omit<Artist, 'id'> = {
                name: artistToApprove.fullName,
                email: artistToApprove.email,
                phone: artistToApprove.phone,
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
                status: 'active',
            };
            
            await createArtist(authUser.uid, newArtist);
            await deletePendingArtist(artistToApprove.originalId);
            
            toast({
                title: "Artist Approved",
                description: `A notification has been sent to ${newArtist.name}.`,
            });
        } catch (error: any) {
            toast({
                title: "Approval Failed",
                description: error.message,
                variant: 'destructive',
            });
        }
    };

     const handleReject = async (artistId: string) => {
        const artistToReject = pendingArtists.find(p => p.id === artistId);
        if (!artistToReject) return;

        await deletePendingArtist(artistToReject.originalId);
        
        toast({
            title: "Artist Rejected",
            description: `A notification has been sent to ${artistToReject.name}.`,
            variant: "destructive"
        });
    };
    
    const handleDeleteArtist = async (artist: Artist) => {
        if (window.confirm(`Are you sure you want to permanently delete ${artist.name}? This action cannot be undone.`)) {
            await deleteArtist(artist.id);
            toast({
                title: "Artist Deleted",
                description: `${artist.name} has been removed from the platform.`,
                variant: 'destructive',
            });
        }
    };

    const handleToggleSuspend = async (artist: Artist) => {
        const newStatus = artist.status === 'suspended' ? 'active' : 'suspended';
        await updateArtist(artist.id, { status: newStatus });
        toast({
            title: `Artist ${newStatus === 'active' ? 'Reinstated' : 'Suspended'}`,
            description: `${artist.name}'s status has been updated.`,
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
    
    const onOnboardSubmit: SubmitHandler<OnboardFormValues> = async (data) => {
         if (approvedArtists.some(a => a.email === data.email)) {
            form.setError('email', { message: 'An artist with this email already exists.' });
            return;
        }

        try {
            // 1. Create the user in Firebase Auth
            const authUser = await createUser(data.email, data.password);
            
            // 2. Prepare the artist data for Firestore
            const newArtistData: Omit<Artist, 'id'> = {
                name: data.name,
                email: data.email,
                phone: data.phone,
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
                status: 'active',
            };
            
            // 3. Save the artist data to Firestore using the UID from Auth
            await createArtist(authUser.uid, newArtistData);

            // 4. Send a welcome notification to the artist
            const welcomeMessage = `Welcome to the platform! Your account is active. \nUsername: ${data.email}\nPassword: ${data.password}\nLogin at: ${window.location.origin}/artist/login`;
            const notification: Omit<Notification, 'id'> = {
                artistId: authUser.uid,
                title: 'Welcome to MehendiFy!',
                message: welcomeMessage,
                type: 'announcement',
                isRead: false,
                timestamp: new Date().toISOString(),
            };
            await createNotification(notification);

            toast({
                title: "Artist Onboarded Successfully",
                description: `${data.name} has been added to the platform and can now log in.`,
            });
            form.reset();

        } catch (error: any) {
            toast({
                title: "Onboarding Failed",
                description: error.message || "An unexpected error occurred.",
                variant: "destructive",
            });
        }
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
                                        <TableHead>Status</TableHead>
                                        <TableHead>Base Charge</TableHead>
                                        <TableHead>Rating</TableHead>
                                        <TableHead><span className="sr-only">Actions</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {approvedArtists.map((artist) => (
                                        <TableRow key={artist.id} className={artist.status === 'suspended' ? 'bg-red-50' : ''}>
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
                                                <Badge variant={artist.status === 'suspended' ? 'destructive' : 'default'} className="capitalize">{artist.status || 'active'}</Badge>
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
                                                        <DropdownMenuItem onSelect={() => {}} disabled={!hasPermission('artists', 'edit')}>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onSelect={() => handleToggleSuspend(artist)} disabled={!hasPermission('artists', 'edit')}>
                                                            <ShieldOff className="mr-2 h-4 w-4" />
                                                            {artist.status === 'suspended' ? 'Reinstate' : 'Suspend'}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onSelect={() => handleDeleteArtist(artist)} disabled={!hasPermission('artists', 'edit')} className="text-red-600">
                                                            <Trash2 className="mr-2 h-4 w-4" />
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
                                                        <Button aria-haspopup="true" size="icon" variant="ghost" disabled={!hasPermission('artists', 'edit')}>
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
                                    <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || !hasPermission('artists', 'edit')}>
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
