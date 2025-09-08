

'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Home } from 'lucide-react';
import { teamMembers as initialTeamMembers, TeamMember } from '@/lib/team-data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';

export default function AdminLoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [userType, setUserType] = React.useState<'admin' | 'team-member' | ''>('');
    const [isLoading, setIsLoading] = React.useState(false);
    const [teamMembers, setTeamMembers] = React.useState<TeamMember[]>([]);

    const getTeamMembers = React.useCallback((): TeamMember[] => {
        if (typeof window === 'undefined') return [];
        const storedMembers = localStorage.getItem('teamMembers');
        if (storedMembers) {
            try {
                // Safely parse the stored members
                return JSON.parse(storedMembers);
            } catch (e) {
                // If parsing fails, fall back to initial members
                console.error("Failed to parse team members from localStorage", e);
                localStorage.setItem('teamMembers', JSON.stringify(initialTeamMembers));
                return initialTeamMembers;
            }
        }
        // If nothing in local storage, initialize with default admin
        localStorage.setItem('teamMembers', JSON.stringify(initialTeamMembers));
        return initialTeamMembers;
    }, []);

    React.useEffect(() => {
        setTeamMembers(getTeamMembers());
    }, [getTeamMembers]);
    
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
        
        setTimeout(() => {
            const allMembers = getTeamMembers();
            const member = allMembers.find(m => m.username === username && m.password === password && m.role === userType);

            if (member) {
                toast({
                    title: 'Login Successful',
                    description: `Welcome, ${member.name}! Redirecting...`,
                });
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
                 setIsLoading(false);
            }
        }, 1000);
    };

    return (
        <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
            <div className="flex items-center justify-center py-12">
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
            <div className="hidden bg-muted lg:block">
                <Image
                    src="https://picsum.photos/1200/1500?random=205"
                    alt="Image"
                    width="1920"
                    height="1080"
                    className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                    data-ai-hint="mehndi design background"
                />
            </div>
        </div>
    );
}
