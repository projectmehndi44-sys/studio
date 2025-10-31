

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
import { getTeamMembers } from '@/lib/services';
import { useAdminAuth } from '@/firebase/auth/use-admin-auth';
import { useAuth } from '@/firebase';

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(1, { message: "Password is required." }),
});
type LoginFormValues = z.infer<typeof loginSchema>;


export default function AdminLoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    const auth = useAuth();
    const { isAuthenticated, isLoading: isAuthLoading } = useAdminAuth();
    
    const [isForgotPasswordOpen, setIsForgotPasswordOpen] = React.useState(false);
    const [forgotPasswordEmail, setForgotPasswordEmail] = React.useState('');

    React.useEffect(() => {
        if (!isAuthLoading && isAuthenticated) {
            router.push('/admin');
        }
    }, [isAuthLoading, isAuthenticated, router]);

    const loginForm = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' },
    });
    
    const handleLogin = async (data: LoginFormValues) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
            const teamMembers = await getTeamMembers();
            
            const memberProfile = teamMembers.find(m => m.id === userCredential.user.uid);
            
            if (!memberProfile) {
                 await auth.signOut();
                 toast({ title: 'Access Denied', description: 'This user account does not have admin privileges.', variant: 'destructive' });
            }
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
                description: `If an account for ${forgotPasswordEmail} exists, a password reset link has been sent. Please check your inbox and spam folder.`,
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
    
    if (isAuthLoading || isAuthenticated) {
        return (
             <div className="w-full flex items-center justify-center min-h-screen bg-muted/30">
                <p>Loading...</p>
             </div>
        )
    }

    return (
        <>
            <div className="w-full flex items-center justify-center min-h-screen bg-muted/30">
                 <div className="mx-auto grid w-[400px] gap-6">
                    <div className="grid gap-2 text-center">
                        <h1 className="text-3xl font-bold text-primary">Admin Portal Login</h1>
                        <p className="text-balance text-muted-foreground">Enter your team credentials to access your dashboard.</p>
                    </div>
                    <Form {...loginForm}>
                        <form onSubmit={loginForm.handleSubmit(handleLogin)} className="grid gap-4">
                            <FormField control={loginForm.control} name="email" render={({ field }) => (
                                <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="your.email@example.com" {...field} /></FormControl><FormMessage /></FormItem>
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
                        <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors">
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
                            <DialogDescription>Enter your registered login email to receive a password reset link.</DialogDescription>
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
