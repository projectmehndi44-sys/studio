
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
import { signInAsAdmin, auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';


export default function AdminLoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [userType, setUserType] = React.useState<'admin' | 'team-member' | ''>('');
    const [isLoading, setIsLoading] = React.useState(false);
    
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if (!userType) {
            toast({
                title: 'Login Failed',
                description: 'Please select a user type.',
                variant: 'destructive',
            });
            setIsLoading(false);
            return;
        }
        
        try {
            // First, sign out any existing Firebase user to ensure a clean login.
            if (auth.currentUser) {
                await signOut(auth);
            }

            // Attempt to sign in with Firebase Auth. We use the username (as email) and password.
            // This requires the user to exist in Firebase Authentication.
            // For this project, we'll use a single hardcoded login and then check their role from Firestore.
            // The default admin email is derived from the username for Firebase Auth.
            const adminAuthEmail = 'admin@mehndify.com';
            
            // This will throw an error if Firebase Auth fails, which is caught below.
            const userCredential = await signInAsAdmin(adminAuthEmail, password);

            if (userCredential) {
                const teamMembers = await getTeamMembers();
                const expectedRole = userType === 'admin' ? 'Super Admin' : 'team-member';
                const member = teamMembers.find(m => m.username === username && m.role === expectedRole);

                if (member) {
                     toast({
                        title: 'Login Successful',
                        description: `Welcome, ${member.name}! Redirecting...`,
                    });
                    localStorage.setItem('isAdminAuthenticated', 'true');
                    localStorage.setItem('adminRole', member.role);
                    localStorage.setItem('adminUsername', member.username);
                    localStorage.setItem('adminUserId', member.id);
                    window.location.href = '/admin'; // Full refresh to re-trigger auth context
                } else {
                    await signOut(auth); // Sign out if they are not a valid team member
                    toast({
                        title: 'Authorization Failed',
                        description: `You are authenticated, but not authorized to access this role.`,
                        variant: 'destructive',
                    });
                }
            } else {
                 toast({
                    title: 'Authentication Failed',
                    description: 'Invalid credentials. Please try again.',
                    variant: 'destructive',
                });
            }

        } catch(error: any) {
            console.error("Admin Login Error:", error);
             let description = 'Could not verify credentials. Please try again.';
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                description = 'Invalid username or password. Please check and try again.';
            }
            toast({
                title: 'Login Error',
                description: description,
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

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
