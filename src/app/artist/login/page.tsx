
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Palette, Home } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

export default function ArtistLoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const [isForgotPasswordOpen, setIsForgotPasswordOpen] = React.useState(false);
    const [forgotPasswordEmail, setForgotPasswordEmail] = React.useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // This is a more realistic client-side authentication for prototyping.
        // It checks against artists who were approved in the admin portal.
        setTimeout(() => {
            const approvedArtists = JSON.parse(localStorage.getItem('artists') || '[]');
            const artist = approvedArtists.find(
                (a: any) => a.email === email && a.password === password
            );

            if (artist) {
                 toast({
                    title: 'Login Successful',
                    description: `Welcome back, ${artist.name}!`,
                });
                // In a real app, you would use a proper session/token management system.
                // For this prototype, we'll use localStorage.
                localStorage.setItem('isArtistAuthenticated', 'true');
                localStorage.setItem('artistId', artist.id);
                router.push('/artist/dashboard'); // Redirect to artist dashboard
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

    const handleForgotPassword = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: "Check your email",
            description: `If an account exists for ${forgotPasswordEmail}, a password reset link has been sent.`,
        });
        setIsForgotPasswordOpen(false);
        setForgotPasswordEmail('');
    };

    return (
        <>
            <div className="flex items-center justify-center min-h-screen bg-muted/40">
                <Card className="w-full max-w-sm">
                    <CardHeader className="text-center">
                        <Palette className="mx-auto w-12 h-12 text-primary" />
                        <CardTitle className="text-2xl font-bold mt-2">Artist Portal</CardTitle>
                        <CardDescription>Enter your credentials to access your dashboard</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
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
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                    <Button variant="link" type="button" className="p-0 h-auto text-xs" onClick={() => setIsForgotPasswordOpen(true)}>
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
                         <div className="mt-4 text-center text-sm">
                            <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors">
                                <Home className="mr-1 h-4 w-4" />
                                Back to Home
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Forgot Password</DialogTitle>
                        <DialogDescription>
                            Enter your registered email address. We will send you instructions to reset your password.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleForgotPassword}>
                        <div className="py-4">
                            <Label htmlFor="forgot-email">Email Address</Label>
                            <Input
                                id="forgot-email"
                                type="email"
                                placeholder="your.email@example.com"
                                value={forgotPasswordEmail}
                                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                                required
                            />
                        </div>
                        <DialogFooter>
                            <Button type="submit">Send Reset Link</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
