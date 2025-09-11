
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
import { Download, ChevronDown, CheckCircle, XCircle, MoreHorizontal, Eye, Trash2, UserPlus, ShieldOff, KeyRound, ShieldCheck, Star } from 'lucide-react';
import type { Artist, Notification } from '@/types';
import { listenToCollection, createArtistWithId, deletePendingArtist, deleteArtist, updateArtist, createNotification, getArtistByEmail, getTeamMembers, getArtist } from '@/lib/services';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { exportToExcel } from '@/lib/export';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useAdminAuth } from '@/hooks/use-admin-auth';
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
import { createUserWithEmailAndPassword, getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { Switch } from '@/components/ui/switch';


type PendingArtist = Omit<Artist, 'id'> & {
  id: string; // email is used as ID here
  status: 'Pending';
  [key: string]: any;
};

const onboardSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^\d{10}$/, "Must be a 10-digit phone number"),
  location: z.string().min(3, "Location is required"),
  charge: z.coerce.number().min(0, "Charge must be a positive number"),
});
type OnboardFormValues = z.infer<typeof onboardSchema>;


export default function ArtistManagementPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { hasPermission } = useAdminAuth();
    const auth = getAuth(app);

    const [approvedArtists, setApprovedArtists] = React.useState<Artist[]>([]);
    const [pendingArtists, setPendingArtists] = React.useState<PendingArtist[]>([]);
    const [selectedArtistIds, setSelectedArtistIds] = React.useState<string[]>([]);
    
    // State for showing modals
    const [showCodeAlert, setShowCodeAlert] = React.useState(false);
    const [generatedCode, setGeneratedCode] = React.useState('');
    const [generatedArtistName, setGeneratedArtistName] = React.useState('');
    const [artistToDelete, setArtistToDelete] = React.useState<Artist | null>(null);
    
    const form = useForm<OnboardFormValues>({
        resolver: zodResolver(onboardSchema),
        defaultValues: { name: '', email: '', phone: '', location: '', charge: 2500 },
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

    const displayOneTimeCode = (artistName: string, code: string) => {
        setGeneratedArtistName(artistName);
        setGeneratedCode(code);
        setShowCodeAlert(true);
    };

    const handleApprove = async (artistId: string) => {
        const artistToApprove = pendingArtists.find(p => p.id === artistId);
        if (!artistToApprove) return;
        
        try {
            const existingArtistProfile = await getArtistByEmail(artistToApprove.email);
            if (existingArtistProfile) {
                toast({
                    title: "Artist Profile Exists",
                    description: `${artistToApprove.email} already has an approved profile.`,
                    variant: "destructive"
                });
                return;
            }

            // Create user in Firebase Auth first
            const userCredential = await createUserWithEmailAndPassword(auth, artistToApprove.email, `temp_password_${Date.now()}`);
            const authUser = userCredential.user;

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
                styleTags: ['new'],
                status: 'active',
                verified: false,
                isFoundersClubMember: false,
                state: artistToApprove.state,
                district: artistToApprove.district,
                locality: artistToApprove.locality,
                servingAreas: artistToApprove.servingAreas,
                firstTimeLoginCodeUsed: false,
            };
            
            await createArtistWithId({ ...newArtist, id: authUser.uid });
            await deletePendingArtist(artistToApprove.originalId);
             
            toast({
                title: "Artist Approved",
                description: `${newArtist.name} is now an active artist. Please send them a password creation link.`,
                duration: 9000,
            });

            await sendPasswordResetEmail(auth, newArtist.email);
            toast({
                title: 'Password Reset Email Sent',
                description: `An email to create a new password has been sent to ${newArtist.email}.`,
                duration: 9000
            });

        } catch (error: any) {
            console.error("Approval Error: ", error);
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
            description: `${artistToReject.name}'s application has been rejected.`,
            variant: "destructive"
        });
    };
    
    const confirmDeleteArtist = async () => {
        if (!artistToDelete) return;
        try {
            await deleteArtist(artistToDelete.id); // This now also handles Firebase Auth deletion via a function
            toast({
                title: "Artist Deleted",
                description: `${artistToDelete.name} has been permanently removed from the platform.`,
                variant: 'destructive',
            });
        } catch (error: any) {
            toast({
                title: "Deletion Failed",
                description: error.message || "Could not delete artist. They may have related data that needs to be cleared first.",
                variant: 'destructive'
            });
        } finally {
            setArtistToDelete(null);
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

    const handleToggleVerified = async (artist: Artist) => {
        const newStatus = !artist.verified;
        await updateArtist(artist.id, { verified: newStatus });
        toast({
            title: `Artist status updated`,
            description: `${artist.name} has been ${newStatus ? 'verified' : 'unverified'}.`,
        });
    };

    const handleToggleFoundersClub = async (artist: Artist) => {
        const newStatus = !artist.isFoundersClubMember;
        await updateArtist(artist.id, { isFoundersClubMember: newStatus });
        toast({
            title: `Artist status updated`,
            description: `${artist.name} is ${newStatus ? 'now a Founder\'s Club member' : 'no longer a Founder\'s Club member'}.`,
        });
    }

    const handlePasswordReset = async (artist: Artist) => {
        try {
            await sendPasswordResetEmail(auth, artist.email);
            toast({
                title: 'Password Reset Email Sent',
                description: `An email to reset the password has been sent to ${artist.email}.`,
                duration: 9000,
            });
        } catch (error) {
            console.error("Failed to send password reset email:", error);
            toast({ title: 'Error', description: 'Could not send password reset email.', variant: 'destructive'});
        }
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
            form.setError('email', { message: 'An artist with this email already exists in the database.' });
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, data.email, `temp-password-${Date.now()}`);
            const authUser = userCredential.user;

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
                styleTags: ['new'],
                status: 'active',
                verified: false,
                isFoundersClubMember: false,
                firstTimeLoginCodeUsed: false,
            };
            
            await createArtistWithId({ ...newArtistData, id: authUser.uid });
            await sendPasswordResetEmail(auth, data.email);

            toast({
                title: "Artist Onboarded & Notified",
                description: `${data.name} can now set their password via the link sent to their email.`,
                duration: 9000,
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
                                        <TableRow key={artist.id} className={artist.status === 'suspended' ? 'bg-red-50 dark:bg-red-900/20' : ''}>
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
                                                    <div className="flex items-center gap-2">
                                                        <span>{artist.name}</span>
                                                        {artist.verified && <ShieldCheck className="w-4 h-4 text-green-600" title="Verified"/>}
                                                        {artist.isFoundersClubMember && <Star className="w-4 h-4 text-amber-500 fill-current" title="Founder's Club Member"/>}
                                                    </div>
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
                                                        <DropdownMenuItem onSelect={() => handleToggleVerified(artist)} disabled={!hasPermission('artists', 'edit')}>
                                                            <ShieldCheck className="mr-2 h-4 w-4" />
                                                            {artist.verified ? 'Un-verify' : 'Verify'}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onSelect={() => handleToggleSuspend(artist)} disabled={!hasPermission('artists', 'edit')}>
                                                            <ShieldOff className="mr-2 h-4 w-4" />
                                                            {artist.status === 'suspended' ? 'Reinstate' : 'Suspend'}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onSelect={() => handleToggleFoundersClub(artist)} disabled={!hasPermission('artists', 'edit')}>
                                                            <Star className="mr-2 h-4 w-4" />
                                                            Toggle Founder's Club
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onSelect={() => handlePasswordReset(artist)} disabled={!hasPermission('artists', 'edit')}>
                                                            <KeyRound className="mr-2 h-4 w-4" />
                                                            Send Password Reset
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onSelect={() => setArtistToDelete(artist)} disabled={!hasPermission('artists', 'edit')} className="text-red-600 focus:bg-red-100 focus:text-red-700">
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
                                                        <DropdownMenuItem onSelect={() => handleReject(artist.id)} className="text-red-600 focus:text-red-700 focus:bg-red-100">
                                                            <XCircle className="mr-2 h-4 w-4" />
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
                                Directly create a new artist profile. An email will be sent to them to create their password.
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
                                        {form.formState.isSubmitting ? 'Onboarding...' : 'Onboard Artist & Send Invite'}
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
             <AlertDialog open={showCodeAlert} onOpenChange={setShowCodeAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>One-Time Login Code Generated!</AlertDialogTitle>
                        <AlertDialogDescription>
                            Please securely share this code with{' '}
                            <span className="font-bold">{generatedArtistName}</span>. They will need it to create their
                            password and log in for the first time.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="my-4 p-4 bg-muted rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">Code for {generatedArtistName}</p>
                        <p className="text-3xl font-bold tracking-widest text-primary">{generatedCode}</p>
                    </div>
                     <AlertDialogDescription>
                        This code can only be used once and will expire after its first use. If the artist loses this code, you can generate a new one from their profile page.
                    </AlertDialogDescription>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setShowCodeAlert(false)}>Close</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <AlertDialog open={!!artistToDelete} onOpenChange={() => setArtistToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the artist profile for{' '}
                            <span className="font-bold">{artistToDelete?.name}</span> and remove them from the platform. Note: this does not delete their auth account.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteArtist} className="bg-destructive hover:bg-destructive/90">
                            Yes, delete artist
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

    