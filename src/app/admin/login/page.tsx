'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Shield, Home } from 'lucide-react';

export default function AdminLoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [role, setRole] = React.useState('admin');
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // This is a basic, client-side-only authentication for prototyping.
        // In a real application, this should be a server action that validates credentials against a secure backend.
        setTimeout(() => {
            if (role === 'admin' && username === 'admin' && password === 'Abhi@204567') {
                toast({
                    title: 'Login Successful',
                    description: 'Welcome, Admin!',
                });
                // In a real app, you would use a proper session/token management system.
                // For this prototype, we'll use localStorage.
                localStorage.setItem('isAdminAuthenticated', 'true');
                router.push('/admin');
            } else {
                 toast({
                    title: 'Login Failed',
                    description: 'Invalid role, username, or password.',
                    variant: 'destructive',
                });
                setIsLoading(false);
            }
        }, 1000);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40">
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <Shield className="mx-auto w-12 h-12 text-primary" />
                    <CardTitle className="text-2xl font-bold mt-2">Admin / Artist Portal</CardTitle>
                    <CardDescription>Enter your credentials to access your dashboard</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                         <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select value={role} onValueChange={setRole}>
                                <SelectTrigger id="role">
                                    <SelectValue placeholder="Select your role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="artist">Artist</SelectItem>
                                    <SelectItem value="team-member" disabled>Team Member (Coming Soon)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                placeholder="admin or artist username"
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
