
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Shield, Home } from 'lucide-react';
import { teamMembers as initialTeamMembers, TeamMember } from '@/lib/team-data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


export default function AdminLoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [userType, setUserType] = React.useState<'admin' | 'team-member' | ''>('');
    const [isLoading, setIsLoading] = React.useState(false);

    const getTeamMembers = (): TeamMember[] => {
        if (typeof window !== 'undefined') {
            const storedMembers = localStorage.getItem('teamMembers');
            if (storedMembers) {
                return JSON.parse(storedMembers);
            }
            // If nothing in local storage, initialize with default admin
            localStorage.setItem('teamMembers', JSON.stringify(initialTeamMembers));
            return initialTeamMembers;
        }
        return initialTeamMembers;
    };
    
    const handleLogin = (e: React.FormEvent) => {
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
        
        // This is a basic, client-side-only authentication for prototyping using localStorage as a mock DB.
        // In a real application, this should be a server action that validates credentials against a secure backend.
        setTimeout(() => {
            const teamMembers = getTeamMembers();
            const member = teamMembers.find(m => m.username === username && m.password === password && m.role === userType);

            if (member) {
                toast({
                    title: 'Login Successful',
                    description: `Welcome, ${member.name}! Redirecting...`,
                });
                // In a real app, you would use a proper session/token management system.
                // For this prototype, we'll use localStorage.
                localStorage.setItem('isAdminAuthenticated', 'true');
                localStorage.setItem('adminRole', member.role);
                localStorage.setItem('adminUsername', member.username);
                router.push('/admin');
            } else {
                 toast({
                    title: 'Login Failed',
                    description: 'Invalid credentials for the selected user type.',
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
                    <Shield className="mx-auto w-12 h-12 text-primary" />
                    <CardTitle className="text-2xl font-bold mt-2">Admin Portal</CardTitle>
                    <CardDescription>Enter your credentials to access the dashboard</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
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
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                placeholder="Enter your username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>                            <Input
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
                </CardContent>
            </Card>
        </div>
    );
}
