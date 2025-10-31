'use client';

import * as React from 'react';
import { useArtistPortal } from '../layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { User, Save, Loader2, Image as ImageIcon, Copy, KeyRound, PlusCircle, Trash2 } from 'lucide-react';
import { updateArtist, uploadSiteImage, getAvailableLocations } from '@/lib/services';
import type { Artist, ServiceArea } from '@/lib/types';
import { Switch } from '@/components/ui/switch';
import NextImage from 'next/image';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { v4 as uuidv4 } from 'uuid';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ArtistProfilePage() {
    const { artist } = useArtistPortal();
    const { toast } = useToast();
    const auth = useAuth();
    const [isSaving, setIsSaving] = React.useState(false);
    const [isUploading, setIsUploading] = React.useState<Record<string, boolean>>({});
    const [localArtist, setLocalArtist] = React.useState<Artist | null>(null);
    const [availableLocations, setAvailableLocations] = React.useState<Record<string, string[]>>({});

    React.useEffect(() => {
        if (artist) {
            setLocalArtist(JSON.parse(JSON.stringify(artist))); // Deep copy
        }
        getAvailableLocations().then(setAvailableLocations);
    }, [artist]);
    
    const handleInputChange = (field: keyof Artist, value: any) => {
        if (!localArtist) return;
        setLocalArtist(prev => prev ? { ...prev, [field]: value } : null);
    };

    const handleServiceAreaChange = (index: number, field: keyof ServiceArea, value: string) => {
        if (!localArtist) return;
        const updatedAreas = [...localArtist.serviceAreas];
        updatedAreas[index] = { ...updatedAreas[index], [field]: value };
        if (field === 'state') {
             updatedAreas[index].district = ''; // Reset district when state changes
        }
        handleInputChange('serviceAreas', updatedAreas);
    };

    const addServiceArea = () => {
        if (!localArtist) return;
        const newArea: ServiceArea = { id: uuidv4(), state: '', district: '', localities: '' };
        handleInputChange('serviceAreas', [...localArtist.serviceAreas, newArea]);
    };
    
    const removeServiceArea = (index: number) => {
         if (!localArtist || localArtist.serviceAreas.length <= 1) {
            toast({ title: "Cannot remove", description: "You must have at least one service area.", variant: "destructive" });
            return;
        };
        const updatedAreas = localArtist.serviceAreas.filter((_, i) => i !== index);
        handleInputChange('serviceAreas', updatedAreas);
    }
    
    const handleProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!localArtist || !e.target.files?.[0]) return;
        setIsUploading(prev => ({...prev, profile: true}));
        try {
            const url = await uploadSiteImage(e.target.files[0], `artists/${localArtist.id}/profile`, true);
            handleInputChange('profilePicture', url);
            toast({ title: "Profile picture updated!" });
        } catch (error) {
            toast({ title: "Upload Failed", variant: "destructive" });
        } finally {
            setIsUploading(prev => ({...prev, profile: false}));
        }
    }
    
    const handleCoverPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!localArtist || !e.target.files?.[0]) return;
        setIsUploading(prev => ({...prev, cover: true}));
        try {
            const url = await uploadSiteImage(e.target.files[0], `artists/${localArtist.id}/cover`, true);
            handleInputChange('coverPhoto', url);
            toast({ title: "Cover photo updated!" });
        } catch (error) {
            toast({ title: "Upload Failed", variant: "destructive" });
        } finally {
            setIsUploading(prev => ({...prev, cover: false}));
        }
    }

    const handleSaveChanges = async () => {
        if (!localArtist) return;
        setIsSaving(true);
        try {
            const { id, ...dataToSave } = localArtist;
            await updateArtist(id, dataToSave);
            toast({ title: 'Profile Saved', description: 'Your details have been updated successfully.' });
        } catch (error: any) {
            toast({ title: 'Error Saving Profile', description: error.message, variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    const handlePasswordReset = async () => {
        if (!artist?.email) return;
        try {
            await sendPasswordResetEmail(auth, artist.email);
            toast({
                title: "Password Reset Email Sent",
                description: `A link to reset your password has been sent to ${artist.email}.`,
                duration: 7000
            });
        } catch (error) {
            toast({ title: "Error", description: "Could not send password reset email.", variant: "destructive" });
        }
    };

    const availableStates = Object.keys(availableLocations);

    if (!localArtist) return <div>Loading profile...</div>;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><User className="w-6 h-6 text-primary"/>Manage Your Profile</CardTitle>
                    <CardDescription>Keep your information up-to-date to attract more clients.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Profile Picture */}
                        <div className="space-y-2">
                            <Label>Profile Picture</Label>
                            <div className="flex items-center gap-4">
                                <NextImage src={localArtist.profilePicture} alt="Profile" width={80} height={80} className="rounded-full border object-cover aspect-square"/>
                                <div className="relative border-2 border-dashed rounded-lg p-4 text-center hover:border-accent flex-1">
                                    {isUploading.profile ? <Loader2 className="animate-spin h-6 w-6"/> : <ImageIcon className="mx-auto h-6 w-6 text-muted-foreground"/>}
                                    <p className="text-xs mt-1 text-muted-foreground">Click to change</p>
                                    <Input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleProfilePicUpload} disabled={isUploading.profile}/>
                                </div>
                            </div>
                        </div>
                         {/* Cover Photo */}
                        <div className="space-y-2">
                            <Label>Cover Photo</Label>
                             <div className="flex items-center gap-4">
                                <NextImage src={localArtist.coverPhoto || 'https://picsum.photos/seed/cover/300/150'} alt="Cover" width={160} height={80} className="rounded-md border object-cover aspect-video"/>
                                <div className="relative border-2 border-dashed rounded-lg p-4 text-center hover:border-accent flex-1">
                                    {isUploading.cover ? <Loader2 className="animate-spin h-6 w-6"/> : <ImageIcon className="mx-auto h-6 w-6 text-muted-foreground"/>}
                                    <p className="text-xs mt-1 text-muted-foreground">Click to change</p>
                                    <Input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleCoverPhotoUpload} disabled={isUploading.cover}/>
                                </div>
                            </div>
                        </div>
                    </div>
                     <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" value={localArtist.name} onChange={(e) => handleInputChange('name', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                             <Label>Referral Code</Label>
                             <div className="flex items-center">
                                <Input value={localArtist.referralCode || 'N/A'} readOnly />
                                <Button variant="ghost" size="icon" onClick={() => navigator.clipboard.writeText(localArtist.referralCode || '')}><Copy className="w-4 h-4"/></Button>
                            </div>
                        </div>
                    </div>
                     <div className="space-y-2">
                         <Label>Style Tags</Label>
                         <Textarea placeholder="e.g., Arabic, Intricate, Minimalist, Glam, Natural" value={localArtist.styleTags.join(', ')} onChange={(e) => handleInputChange('styleTags', e.target.value.split(',').map(t => t.trim()))} />
                         <p className="text-xs text-muted-foreground">Comma-separated tags that describe your style. This helps clients find you.</p>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                            <Label>Show Contact Info on Profile</Label>
                            <p className="text-xs text-muted-foreground">Allow customers to see your phone and email before booking.</p>
                        </div>
                         <Switch
                            checked={localArtist.showContactInfo}
                            onCheckedChange={(checked) => handleInputChange('showContactInfo', checked)}
                         />
                    </div>
                     <div className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                            <Label>Reset Password</Label>
                            <p className="text-xs text-muted-foreground">Send a password reset link to your registered email.</p>
                        </div>
                        <Button variant="outline" onClick={handlePasswordReset}><KeyRound className="mr-2 h-4 w-4"/> Send Link</Button>
                    </div>

                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Service Areas</CardTitle>
                    <CardDescription>Define the locations you serve. Be specific to get relevant booking requests.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {localArtist.serviceAreas.map((area, index) => {
                         const districtsForState = availableLocations[area.state] || [];
                        return (
                        <div key={area.id} className="grid md:grid-cols-4 gap-4 p-3 border rounded-md items-start relative">
                           {localArtist.serviceAreas.length > 1 && <Button size="icon" variant="ghost" className="absolute top-1 right-1 h-7 w-7" onClick={() => removeServiceArea(index)}><Trash2 className="w-4 h-4 text-destructive"/></Button>}
                            <div className="space-y-1">
                                <Label>State</Label>
                                <Select onValueChange={(v) => handleServiceAreaChange(index, 'state', v)} value={area.state}>
                                    <SelectTrigger><SelectValue placeholder="Select State" /></SelectTrigger>
                                    <SelectContent>{availableStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label>District</Label>
                                <Select onValueChange={(v) => handleServiceAreaChange(index, 'district', v)} value={area.district} disabled={!area.state || districtsForState.length === 0}>
                                    <SelectTrigger><SelectValue placeholder="Select District" /></SelectTrigger>
                                    <SelectContent>{districtsForState.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1 md:col-span-2">
                                 <Label>Localities Served</Label>
                                <Input value={area.localities} onChange={(e) => handleServiceAreaChange(index, 'localities', e.target.value)} placeholder="e.g., Koregaon Park, Viman Nagar"/>
                                <p className="text-xs text-muted-foreground">Comma-separated list of neighborhoods.</p>
                            </div>
                        </div>
                    )})}
                    <Button variant="outline" onClick={addServiceArea}><PlusCircle className="w-4 h-4 mr-2"/> Add New Area</Button>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSaveChanges} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                    Save All Changes
                </Button>
            </div>
        </div>
    );
}
