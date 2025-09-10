

'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Home } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import type { Artist } from '@/types';
import { getArtists, updateArtist } from '@/lib/services';

export default function ArtistLoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    
    // State for the multi-step forgot password modal
    const [isForgotPasswordOpen, setIsForgotPasswordOpen] = React.useState(false);
    const [forgotPasswordStep, setForgotPasswordStep] = React.useState<'email' | 'phone' | 'reset'>('email');
    const [forgotPasswordEmail, setForgotPasswordEmail] = React.useState('');
    const [forgotPasswordPhone, setForgotPasswordPhone] = React.useState('');
    const [newPassword, setNewPassword] = React.useState('');
    const [confirmNewPassword, setConfirmNewPassword] = React.useState('');
    const [verifiedArtist, setVerifiedArtist] = React.useState<Artist | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        
        const approvedArtists = await getArtists();
        
        setTimeout(() => {
            const artist = approvedArtists.find(
                (a: Artist) => a.email === email && a.password === password
            );

            if (artist) {
                 toast({
                    title: 'Login Successful',
                    description: `Welcome back, ${artist.name}!`,
                });
                localStorage.setItem('isArtistAuthenticated', 'true');
                localStorage.setItem('artistId', artist.id);
                router.push('/artist/dashboard');
            } else {
                 toast({
                    title: 'Login Failed',
                    description: 'Invalid credentials or your account is not yet approved. Please try again.',
                    variant: 'destructive',
                });
            }
            setIsLoading(false);
        }, 1000);
    };
    
    // Reset modal state when it's closed
    const resetForgotPasswordModal = () => {
        setForgotPasswordStep('email');
        setForgotPasswordEmail('');
        setForgotPasswordPhone('');
        setNewPassword('');
        setConfirmNewPassword('');
        setVerifiedArtist(null);
    };

    const handleForgotPasswordEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const approvedArtists = await getArtists();
        const artist = approvedArtists.find(a => a.email === forgotPasswordEmail);

        if (artist) {
            setVerifiedArtist(artist);
            setForgotPasswordStep('phone');
        } else {
            toast({
                title: 'User Not Found',
                description: 'No approved artist found with that email address.',
                variant: 'destructive',
            });
        }
    };
    
    const handleForgotPasswordPhoneSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, an OTP would be sent. Here we just verify the number.
        if (verifiedArtist && verifiedArtist.phone === forgotPasswordPhone) {
            setForgotPasswordStep('reset');
             toast({
                title: 'Phone Verified',
                description: 'Please enter your new password.',
            });
        } else {
             toast({
                title: 'Verification Failed',
                description: 'The phone number does not match our records for this account.',
                variant: 'destructive',
            });
        }
    };
    
    const handlePasswordResetSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!verifiedArtist) return;

        if (newPassword !== confirmNewPassword) {
            toast({ title: 'Passwords do not match.', variant: 'destructive' });
            return;
        }
        if (newPassword.length < 6) {
             toast({ title: 'Password must be at least 6 characters.', variant: 'destructive' });
            return;
        }

        try {
            await updateArtist(verifiedArtist.id, { password: newPassword });
            toast({
                title: 'Password Reset Successful',
                description: 'You can now log in with your new password.',
            });
            setIsForgotPasswordOpen(false);
        } catch (error) {
             console.error("Password Reset Error:", error);
             toast({ title: 'An error occurred. Please try again.', variant: 'destructive' });
        }
    };
    
    const renderForgotPasswordContent = () => {
        switch (forgotPasswordStep) {
            case 'email':
                return (
                    <form onSubmit={handleForgotPasswordEmailSubmit}>
                        <DialogHeader>
                            <DialogTitle>Forgot Password</DialogTitle>
                            <DialogDescription>
                                Enter your registered email address to begin the recovery process.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Label htmlFor="forgot-email">Email Address</Label>
                            <Input id="forgot-email" type="email" value={forgotPasswordEmail} onChange={(e) => setForgotPasswordEmail(e.target.value)} required />
                        </div>
                        <DialogFooter>
                            <Button type="submit">Verify Email</Button>
                        </DialogFooter>
                    </form>
                );
            case 'phone':
                 return (
                    <form onSubmit={handleForgotPasswordPhoneSubmit}>
                        <DialogHeader>
                            <DialogTitle>Verify Phone Number</DialogTitle>
                            <DialogDescription>
                                For security, please enter the 10-digit phone number you used during registration.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Label htmlFor="forgot-phone">Phone Number</Label>
                            <Input id="forgot-phone" type="tel" value={forgotPasswordPhone} onChange={(e) => setForgotPasswordPhone(e.target.value)} required />
                        </div>
                        <DialogFooter>
                             <Button variant="ghost" onClick={() => setForgotPasswordStep('email')}>Back</Button>
                            <Button type="submit">Verify Phone & Send OTP</Button>
                        </DialogFooter>
                    </form>
                );
            case 'reset':
                 return (
                    <form onSubmit={handlePasswordResetSubmit}>
                        <DialogHeader>
                            <DialogTitle>Reset Your Password</DialogTitle>
                            <DialogDescription>
                                Create a new secure password for your account.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                                <Input id="confirm-new-password" type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit">Reset Password</Button>
                        </DialogFooter>
                    </form>
                );
            default: return null;
        }
    }


    return (
        <>
        <div className="w-full flex items-center justify-center min-h-screen bg-muted/30">
            <div className="mx-auto grid w-[350px] gap-6">
                <div className="grid gap-2 text-center">
                    <h1 className="text-3xl font-bold text-primary">Artist Portal Login</h1>
                    <p className="text-balance text-muted-foreground">
                        Enter your credentials to access your dashboard
                    </p>
                </div>
                 <form onSubmit={handleLogin} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email (Username)</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="your.email@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                         <div className="flex items-center">
                            <Label htmlFor="password">Password</Label>
                            <Button variant="link" type="button" className="ml-auto inline-block text-sm underline" onClick={() => setIsForgotPasswordOpen(true)}>
                                Forgot Password?
                            </Button>
                        </div>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Logging in...' : 'Login'}
                    </Button>
                </form>
                 <div className="mt-4 text-center text-sm">
                        Don't have an account?{' '}
                        <Link href="/#artist-register" className="underline">
                           Register here
                        </Link>
                    </div>
                 <div className="mt-2 text-center text-sm">
                    <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors">
                        <Home className="mr-1 h-4 w-4" />
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
           

            <Dialog open={isForgotPasswordOpen} onOpenChange={(isOpen) => {
                setIsForgotPasswordOpen(isOpen);
                if (!isOpen) {
                    resetForgotPasswordModal();
                }
            }}>
                <DialogContent className="sm:max-w-md">
                    {renderForgotPasswordContent()}
                </DialogContent>
            </Dialog>
        </>
    );
}
