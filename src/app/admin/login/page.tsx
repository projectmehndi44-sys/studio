
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Home } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getTeamMembers } from '@/lib/services';
import type { TeamMember } from '@/types';
import { signInWithEmailAndPassword, getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app } from '@/lib/firebase';

export default function AdminLoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [userType, setUserType] = React.useState<'admin' | 'team-member' | ''>('');
    const [isLoading, setIsLoading] = React.useState(false);
    const auth = getAuth(app);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if (!userType) {
            toast({ title: 'Login Failed', description: 'Please select a user type.', variant: 'destructive' });
            setIsLoading(false);
            return;
        }

        let emailToLogin: string;
        if (userType === 'admin') {
            emailToLogin = 'admin@mehndify.com';
        } else {
            // Team members log in with username@mehndify.team to avoid email conflicts
            emailToLogin = `${username.trim()}@mehndify.team`;
        }

        try {
            const userCredential = await signInWithEmailAndPassword(auth, emailToLogin, password);
            const user = userCredential.user;

            if (user) {
                // Now that we are authenticated, we can fetch the user's role from Firestore
                const teamMembers = await getTeamMembers();
                const memberProfile = teamMembers.find(m => m.id === user.uid);
                
                if (!memberProfile) {
                    throw new Error("User profile not found in database.");
                }

                // Verify that the userType selected matches the role in the database
                if ((userType === 'admin' && memberProfile.role !== 'Super Admin') || (userType === 'team-member' && memberProfile.role !== 'team-member')) {
                     throw new Error("Role mismatch. Please select the correct user type.");
                }

                toast({
                    title: 'Login Successful',
                    description: `Welcome, ${memberProfile.name}! Redirecting...`,
                });

                // Store session info using the authenticated user's UID
                localStorage.setItem('adminAuthenticated', 'true');
                localStorage.setItem('adminUserId', user.uid);
                
                router.push('/admin');
            }
        } catch (error: any) {
            console.error("Admin Login Error:", error);
            let description = 'Invalid username or password. Please try again.';
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
                description = 'Invalid credentials. Please check your username and password.';
            } else if (error.message.includes('User profile not found') || error.message.includes('Role mismatch')) {
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
        <div className="w-full flex items-center justify-center min-h-screen bg-muted/30">
            <div className="mx-auto grid w-[350px] gap-6">
                <div className="grid gap-2 text-center">
                    <h1 className="text-3xl font-bold text-primary">Admin Portal Login</h1>
                    <p className="text-balance text-muted-foreground">
                        Enter your credentials to access the dashboard
                    </p>
                </div>
                 <form onSubmit={handleLogin} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="userType">User Type</Label>
                         <Select onValueChange={(value: 'admin' | 'team-member') => setUserType(value)} value={userType}>
                            <SelectTrigger id="userType">
                                <SelectValue placeholder="Select user type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="team-member">Team Member</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                            id="username"
                            placeholder="Enter your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <div className="flex items-center">
                            <Label htmlFor="password">Password</Label>
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
                    <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors">
                        <Home className="mr-1 h-4 w-4" />
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
