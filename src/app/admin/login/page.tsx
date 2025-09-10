
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
            const allMembers = await getTeamMembers();
            
            // This is the corrected logic
            const expectedRole = userType === 'admin' ? 'Super Admin' : 'team-member';
            const memberByUsername = allMembers.find(m => m.username === username);

            if (memberByUsername && memberByUsername.role === expectedRole) {
                if (memberByUsername.password === password) {
                    toast({
                        title: 'Login Successful',
                        description: `Welcome, ${memberByUsername.name}! Redirecting...`,
                    });
                    localStorage.setItem('isAdminAuthenticated', 'true');
                    localStorage.setItem('adminRole', memberByUsername.role); // Store the actual role
                    localStorage.setItem('adminUsername', memberByUsername.username);
                    window.location.href = '/admin'; // Use window.location.href for a full refresh
                } else {
                     toast({
                        title: 'Login Failed',
                        description: 'Invalid password. Please try again.',
                        variant: 'destructive',
                    });
                }
            } else {
                 toast({
                    title: 'Login Failed',
                    description: `No ${userType === 'admin' ? 'admin' : 'team member'} account found with that username.`,
                    variant: 'destructive',
                });
            }
        } catch(error) {
            console.error("Failed to fetch team members:", error);
            toast({
                title: 'Login Error',
                description: 'Could not verify credentials. Please try again later.',
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
