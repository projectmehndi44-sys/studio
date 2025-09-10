
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
import { signInWithEmailAndPassword, sendPasswordResetEmail, getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { getTeamMembers, updateTeamMemberId } from '@/lib/services';

export default function ArtistLoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [email, setEmail] = React.useState('admin');
    const [password, setPassword] = React.useState('Abhi@204567');
    const [isLoading, setIsLoading] = React.useState(false);
    const auth = getAuth(app);
    
    // State for forgot password
    const [isForgotPasswordOpen, setIsForgotPasswordOpen] = React.useState(false);
    const [forgotPasswordEmail, setForgotPasswordEmail] = React.useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        
        try {
            // Hardcode for Super Admin login to ensure correct email format
            const loginEmail = email === 'admin' ? 'admin@mehndify.com' : email;
            const userCredential = await signInWithEmailAndPassword(auth, loginEmail, password);
            const user = userCredential.user;

            if (user) {
                // Now that we are authenticated, we can fetch the user's role from Firestore
                const teamMembers = await getTeamMembers();
                let memberProfile = teamMembers.find(m => m.id === user.uid);

                // --- ONE-TIME ID SYNC LOGIC ---
                // If profile not found, check if this is the initial Super Admin login
                if (!memberProfile && email === 'admin') {
                    const placeholderAdmin = teamMembers.find(m => m.id === 'user_001' && m.role === 'Super Admin');
                    if (placeholderAdmin) {
                        // This is the first login. Update the placeholder ID to the real Firebase UID.
                        await updateTeamMemberId('user_001', user.uid);
                        // Re-fetch the team members to get the updated profile
                        const updatedTeamMembers = await getTeamMembers();
                        memberProfile = updatedTeamMembers.find(m => m.id === user.uid);
                    }
                }
                // --- END OF SYNC LOGIC ---

                if (!memberProfile) {
                    throw new Error("User profile not found in database.");
                }

                toast({
                    title: 'Login Successful',
                    description: `Welcome, ${memberProfile.name}! Redirecting...`,
                });

                localStorage.setItem('adminAuthenticated', 'true');
                router.push('/admin');
            }
        } catch (error: any) {
            console.error("Admin Login Error:", error);
            let description = 'Invalid username or password. Please try again.';
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
                description = 'Invalid credentials. Please check your username and password.';
            } else if (error.message.includes('User profile not found')) {
                description = error.message;
            }
            toast({
                title: 'Authentication Failed',
                description: description,
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!forgotPasswordEmail) return;

        try {
            await sendPasswordResetEmail(auth, forgotPasswordEmail);
            toast({
                title: 'Password Reset Email Sent',
                description: `If an account exists for ${forgotPasswordEmail}, you will receive a password reset link. Please check your inbox.`,
            });
            setIsForgotPasswordOpen(false);
            setForgotPasswordEmail('');
        } catch (error) {
            console.error("Password Reset Error:", error);
            toast({ title: 'An error occurred. Please try again.', variant: 'destructive' });
        }
    };

    // Redirect if already logged in
    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user && localStorage.getItem('adminAuthenticated') === 'true') {
                 router.push('/admin');
            }
        });
        return () => unsubscribe();
    }, [auth, router]);


    return (
        <>
        <div className="w-full flex items-center justify-center min-h-screen bg-muted/30">
            <div className="mx-auto grid w-[350px] gap-6">
                <div className="grid gap-2 text-center">
                    <h1 className="text-3xl font-bold text-primary">Admin Portal Login</h1>
                    <p className="text-balance text-muted-foreground">
                        Enter your credentials to access your dashboard
                    </p>
                </div>
                 <form onSubmit={handleLogin} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Username or Email</Label>
                        <Input
                            id="email"
                            type="text"
                            placeholder="admin"
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
           
            <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
                 <DialogContent className="sm:max-w-md">
                    <form onSubmit={handlePasswordReset}>
                        <DialogHeader>
                            <DialogTitle>Forgot Password</DialogTitle>
                            <DialogDescription>
                                Enter your registered email address to receive a password reset link.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Label htmlFor="forgot-email">Email Address</Label>
                            <Input id="forgot-email" type="email" value={forgotPasswordEmail} onChange={(e) => setForgotPasswordEmail(e.target.value)} required />
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
