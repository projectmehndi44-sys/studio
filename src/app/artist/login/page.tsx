'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Home } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { getArtistByEmail } from '@/lib/services';
import { useArtistAuth } from '@/hooks/use-artist-auth';
import { useAuth, useUser } from '@/firebase';

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(1, { message: "Password is required." }),
});
type LoginFormValues = z.infer<typeof loginSchema>;


export default function ArtistLoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    const auth = useAuth();
    const { artist, isArtistLoading } = useArtistAuth();
    
    const [isForgotPasswordOpen, setIsForgotPasswordOpen] = React.useState(false);
    const [forgotPasswordEmail, setForgotPasswordEmail] = React.useState('');

    React.useEffect(() => {
        if (!isArtistLoading && artist) {
            router.push('/artist/dashboard');
        }
    }, [isArtistLoading, artist, router]);

    const loginForm = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' },
    });
    
    const handleLogin = async (data: LoginFormValues) => {
        try {
            const artistProfile = await getArtistByEmail(data.email);
             if (!artistProfile) {
                 toast({ title: 'Access Denied', description: 'This account is not registered as an artist.', variant: 'destructive' });
                 return;
            }
            
            await signInWithEmailAndPassword(auth, data.email, data.password);
            
        } catch (error: any) {
            let description = 'An error occurred during login. Please try again.';
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                description = 'Invalid credentials. Please check your email and password.';
            }
            toast({ title: 'Authentication Failed', description, variant: 'destructive' });
        }
    };
    
    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!forgotPasswordEmail) return;
        try {
            await sendPasswordResetEmail(auth, forgotPasswordEmail);
            toast({
                title: 'Password Reset Email Sent',
                description: `If an artist account for ${forgotPasswordEmail} exists, a password reset link has been sent. Please check your inbox and spam folder.`,
                duration: 9000,
            });
            setIsForgotPasswordOpen(false);
        } catch (error: any) {
            console.error("Password Reset Error:", error);
            toast({
                title: 'Error',
                description: `Could not send password reset email. Please ensure the email address is correct and try again.`,
                variant: 'destructive',
            });
        }
    };
    
    if (isArtistLoading || artist) {
        return (
             <div className="w-full flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 via-secondary/20 to-accent/10">
                <p>Loading...</p>
             </div>
        )
    }

    return (
        <>
            <div className="w-full flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 via-secondary/20 to-accent/10">
                 <div className="mx-auto grid w-[400px] gap-6 bg-background p-8 rounded-lg shadow-2xl">
                    <div className="grid gap-2 text-center">
                        <h1 className="text-3xl font-bold text-primary font-headline">Artist Portal Login</h1>
                        <p className="text-balance text-muted-foreground">Enter your credentials to access your artist dashboard.</p>
                    </div>
                    <Form {...loginForm}>
                        <form onSubmit={loginForm.handleSubmit(handleLogin)} className="grid gap-4">
                            <FormField control={loginForm.control} name="email" render={({ field }) => (
                                <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="your.artist.email@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={loginForm.control} name="password" render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center">
                                        <FormLabel>Password</FormLabel>
                                        <Button variant="link" type="button" className="ml-auto inline-block text-sm underline" onClick={() => setIsForgotPasswordOpen(true)}>
                                            Forgot Password?
                                        </Button>
                                    </div>
                                    <FormControl><Input type="password" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <Button type="submit" className="w-full" disabled={loginForm.formState.isSubmitting}>
                                {loginForm.formState.isSubmitting ? 'Logging in...' : 'Login'}
                            </Button>
                        </form>
                    </Form>
                    <div className="mt-4 text-center text-sm">
                        <p>Not an artist yet? <Link href="/artist/register" className="underline">Register here</Link></p>
                         <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors mt-4">
                            <Home className="mr-1 h-4 w-4" /> Back to Home
                        </Link>
                    </div>
                </div>
            </div>
           
            <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
                 <DialogContent className="sm:max-w-md">
                    <form onSubmit={handlePasswordReset}>
                        <DialogHeader>
                            <DialogTitle>Forgot Your Password?</DialogTitle>
                            <DialogDescription>Enter your registered artist email to receive a password reset link.</DialogDescription>
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
