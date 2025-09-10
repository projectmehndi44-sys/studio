
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Home, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { getAuth, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { getTeamMembers, saveTeamMembers } from '@/lib/services';
import { teamMembers as initialTeamMembers } from '@/lib/team-data';
import { createUser } from '@/lib/firebase';
import type { TeamMember } from '@/types';
import { Alert, AlertTitle } from '@/components/ui/alert';

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(1, { message: "Password is required." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function AdminLoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    const auth = getAuth(app);
    
    const [isForgotPasswordOpen, setIsForgotPasswordOpen] = React.useState(false);
    const [forgotPasswordEmail, setForgotPasswordEmail] = React.useState('');
    const [superAdminExists, setSuperAdminExists] = React.useState(true); // Assume it exists initially

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' },
    });

    // Check if super admin exists when component mounts
    React.useEffect(() => {
        const checkAdmin = async () => {
            const members = await getTeamMembers();
            const initialAdmin = initialTeamMembers[0];
            const adminInDb = members.some(m => m.username === initialAdmin.username && m.role === 'Super Admin');
            setSuperAdminExists(adminInDb);
        };
        checkAdmin();
    }, []);

    const handleLogin = async (data: LoginFormValues) => {
        const { email, password } = data;
        
        try {
            await signInWithEmailAndPassword(auth, email, password);
            
            toast({
                title: 'Login Successful',
                description: `Welcome! Redirecting...`,
            });
            
            localStorage.setItem('adminAuthenticated', 'true');
            router.push('/admin');

        } catch (error: any) {
            console.error("Admin Login Error:", error);
            let description = 'An error occurred during login. Please try again.';
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
                description = 'Invalid credentials. Please check your username and password.';
            }
            toast({
                title: 'Authentication Failed',
                description: description,
                variant: 'destructive',
            });
        }
    };
    
    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!forgotPasswordEmail) return;

        try {
            await sendPasswordResetEmail(auth, forgotPasswordEmail);
            toast({
                title: 'Password Reset Email Sent',
                description: `If an account exists for ${forgotPasswordEmail}, a password reset link has been sent. Please check your inbox.`,
            });
            setIsForgotPasswordOpen(false);
        } catch (error: any) {
            console.error("Password Reset Error:", error);
            let description = 'An error occurred. Please try again.';
             if (error.code === 'auth/user-not-found') {
                description = 'This email address is not registered in our system.';
             }
            toast({ title: 'Error', description, variant: 'destructive' });
        }
    };

    const handleCreateSuperAdmin = async () => {
        const initialAdmin = initialTeamMembers[0];
        try {
            // 1. Create the user in Firebase Auth
            const authUser = await createUser(initialAdmin.username, 'password123');
            
            // 2. Add the user to the Firestore database
            const newAdminMember: TeamMember = {
                id: authUser.uid,
                name: initialAdmin.name,
                username: initialAdmin.username,
                role: initialAdmin.role,
                permissions: initialAdmin.permissions,
            };
            
            const currentMembers = await getTeamMembers();
            const updatedMembers = [...currentMembers, newAdminMember];
            await saveTeamMembers(updatedMembers);
            
            setSuperAdminExists(true); // Update state to hide the setup button
            
            toast({
                title: "Super Admin Created Successfully!",
                description: `User ${newAdminMember.username} created with password 'password123'. You can now log in.`,
                duration: 9000,
            });

        } catch (error: any) {
            if (error.code === 'auth/email-already-in-use') {
                 toast({
                    title: "Admin Already Exists",
                    description: "The admin account seems to exist. Try using 'Forgot Password' or logging in directly.",
                    variant: 'destructive'
                });
                setSuperAdminExists(true); // Hide the button as the user exists
            } else {
                toast({ title: 'Creation Failed', description: error.message, variant: 'destructive'});
            }
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
                <div className="mx-auto grid w-[400px] gap-6">
                    <div className="grid gap-2 text-center">
                        <h1 className="text-3xl font-bold text-primary">Admin Portal Login</h1>
                        <p className="text-balance text-muted-foreground">
                            Enter your team credentials to access your dashboard.
                        </p>
                    </div>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleLogin)} className="grid gap-4">
                             <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="email"
                                            placeholder="your.email@example.com"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center">
                                        <FormLabel>Password</FormLabel>
                                        <Button 
                                            variant="link" 
                                            type="button" 
                                            className="ml-auto inline-block text-sm underline" 
                                            onClick={() => {
                                                setForgotPasswordEmail(form.getValues('email'));
                                                setIsForgotPasswordOpen(true);
                                            }}
                                        >
                                            Forgot Password?
                                        </Button>
                                    </div>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? 'Logging in...' : 'Login'}
                            </Button>
                        </form>
                    </Form>
                     <div className="mt-4 text-center text-sm">
                        <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors">
                            <Home className="mr-1 h-4 w-4" />
                            Back to Home
                        </Link>
                    </div>

                    {!superAdminExists && (
                        <Card className="mt-6 bg-yellow-50 border-yellow-300">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="text-yellow-600"/> One-Time Super Admin Setup</CardTitle>
                                <CardDescription>The primary Super Admin account needs to be created.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Alert>
                                    <AlertTitle className="text-xs">
                                        Clicking this button will create the user <strong>{initialTeamMembers[0].username}</strong> with a temporary password of <strong>password123</strong>.
                                    </AlertTitle>
                                </Alert>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" onClick={handleCreateSuperAdmin}>Create Super Admin Account</Button>
                            </CardFooter>
                        </Card>
                    )}
                </div>
            </div>
           
            <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
                 <DialogContent className="sm:max-w-md">
                    <form onSubmit={handlePasswordReset}>
                        <DialogHeader>
                            <DialogTitle>Forgot Password</DialogTitle>
                            <DialogDescription>
                                Enter your registered login email to receive a password reset link.
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
