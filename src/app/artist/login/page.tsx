

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
import { getAuth, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirebaseApp } from '@/lib/firebase';
import { Separator } from '@/components/ui/separator';
import { getArtist } from '@/lib/services';

export default function ArtistLoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const auth = getAuth(getFirebaseApp());
    
    // State for forgot password
    const [isForgotPasswordOpen, setIsForgotPasswordOpen] = React.useState(false);
    const [forgotPasswordEmail, setForgotPasswordEmail] = React.useState('');

    // This effect will handle redirecting already logged-in users.
    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // User is logged in, verify if they are an artist
                const artistProfile = await getArtist(user.uid);
                if (artistProfile) {
                    // If they are an artist, redirect to dashboard
                    router.push('/artist/dashboard');
                }
                // If not an artist, they will be signed out by other layout effects,
                // so we don't need to do anything here.
            }
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, [auth, router]);


    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
             const artistProfile = await getArtist(userCredential.user.uid);
             if (!artistProfile) {
                await auth.signOut();
                toast({ title: 'Access Denied', description: 'This account is not registered as an artist.', variant: 'destructive' });
             } else {
                toast({ title: 'Login Successful', description: `Welcome back! Redirecting...` });
                router.push('/artist/dashboard'); // The missing redirect
             }
        } catch (error: any) {
            console.error("Login error:", error);
            let description = 'An error occurred during login. Please try again.';
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                description = 'Invalid email or password. Please check your credentials and try again.';
            } else if (error.code === 'auth/user-disabled') {
                description = 'Your account has been suspended by an administrator.';
            }
            toast({ title: 'Login Failed', description, variant: 'destructive'});
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!forgotPasswordEmail) {
             toast({
                title: 'Email Required',
                description: 'Please enter your email address.',
                variant: 'destructive',
            });
            return;
        }

        try {
            await sendPasswordResetEmail(auth, forgotPasswordEmail);
            toast({
                title: 'Password Reset Email Sent',
                description: `If an account exists for ${forgotPasswordEmail}, you will receive an email to reset your password shortly.`,
                duration: 9000,
            });
            setIsForgotPasswordOpen(false);
        } catch (error) {
            console.error("Forgot password error:", error);
             toast({
                title: 'Error',
                description: 'Could not send password reset email. Please ensure the email is correct and registered.',
                variant: 'destructive',
            });
        }
    };

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
                        <Label htmlFor="email">Email</Label>
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
                <Separator />
                 <div className="mt-2 text-center text-sm space-y-2">
                         <Link href="/artist/register">
                            <Button variant="outline" className="w-full">
                                Don't have an account? Register Here
                            </Button>
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
           
            <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
                 <DialogContent className="sm:max-w-md">
                    <form onSubmit={handleForgotPassword}>
                        <DialogHeader>
                            <DialogTitle>Forgot Your Password?</DialogTitle>
                            <DialogDescription>
                                Enter your registered email address below. We'll send you a link to create a new password.
                            </DialogDescription>
                        </DialogHeader>
                            <div className="py-4 space-y-4">
                            <div>
                                <Label htmlFor="forgot-email">Registered Email</Label>
                                <Input id="forgot-email" type="email" value={forgotPasswordEmail} onChange={(e) => setForgotPasswordEmail(e.target.value)} required />
                            </div>
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

    

    
