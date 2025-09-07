
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

export default function ArtistLoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // This is a basic, client-side-only authentication for prototyping.
        // It checks against artists who were approved in the admin portal.
        setTimeout(() => {
            const approvedArtists = JSON.parse(localStorage.getItem('artists') || '[]');
            const artist = approvedArtists.find(
                (a: any) => a.email === email // Password check removed for demo simplicity
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
                    description: 'Invalid credentials or your account is not yet approved.',
                    variant: 'destructive',
                });
            }
            setIsLoading(false);
        }, 1000);
    };

    return (
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
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                // Note: For this demo, any password will work if the email exists.
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
    );
}
