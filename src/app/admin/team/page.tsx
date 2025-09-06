
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Shield, Users, PlusCircle, Trash2, MoreHorizontal } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { teamMembers as initialTeamMembers, TeamMember } from '@/lib/team-data';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';


const memberSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  username: z.string().min(4, 'Username must be at least 4 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'team-member'], { required_error: 'Role is required' }),
});

type MemberFormValues = z.infer<typeof memberSchema>;

export default function TeamManagementPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [teamMembers, setTeamMembers] = React.useState<TeamMember[]>([]);
    const [userRole, setUserRole] = React.useState<string | null>(null);

    const form = useForm<MemberFormValues>({
        resolver: zodResolver(memberSchema),
        defaultValues: { name: '', username: '', password: '', role: 'team-member' },
    });

    const getTeamMembers = React.useCallback((): TeamMember[] => {
        const storedMembers = localStorage.getItem('teamMembers');
        if (storedMembers) {
            return JSON.parse(storedMembers);
        }
        localStorage.setItem('teamMembers', JSON.stringify(initialTeamMembers));
        return initialTeamMembers;
    }, []);

    const saveTeamMembers = (members: TeamMember[]) => {
        localStorage.setItem('teamMembers', JSON.stringify(members));
        setTeamMembers(members);
    };

    React.useEffect(() => {
        const isAdminAuthenticated = localStorage.getItem('isAdminAuthenticated');
        const role = localStorage.getItem('adminRole');
        setUserRole(role);
        
        if (isAdminAuthenticated !== 'true' || role !== 'admin') {
            toast({
                title: "Access Denied",
                description: "You do not have permission to view this page.",
                variant: "destructive"
            });
            router.push('/admin');
        } else {
             setTeamMembers(getTeamMembers());
        }
    }, [router, toast, getTeamMembers]);
    
    const onSubmit: SubmitHandler<MemberFormValues> = (data) => {
        const currentMembers = getTeamMembers();
        if (currentMembers.some(member => member.username === data.username)) {
            form.setError('username', { type: 'manual', message: 'Username already exists.' });
            return;
        }

        const newMember: TeamMember = {
            id: `user_${Date.now()}`,
            ...data,
        };
        
        const updatedMembers = [...currentMembers, newMember];
        saveTeamMembers(updatedMembers);

        toast({
            title: 'Team Member Added',
            description: `${data.name} has been added to the team.`,
        });
        form.reset();
    };

    const handleDelete = (memberId: string) => {
        if (memberId === 'user_001') {
            toast({
                title: 'Cannot Delete Admin',
                description: 'The default admin account cannot be deleted.',
                variant: 'destructive',
            });
            return;
        }
        const updatedMembers = teamMembers.filter(member => member.id !== memberId);
        saveTeamMembers(updatedMembers);
        
        toast({
            title: 'Member Removed',
            description: 'The team member has been removed.',
            variant: 'destructive',
        });
    };

    if (userRole !== 'admin') {
        return (
             <div className="flex min-h-screen w-full flex-col bg-muted/40 items-center justify-center">
                <Card className="p-8 text-center">
                    <CardTitle>Access Denied</CardTitle>
                    <CardDescription>You need to be an admin to manage team members.</CardDescription>
                    <Button asChild className="mt-4">
                        <Link href="/admin">Back to Dashboard</Link>
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6 justify-between">
                <h1 className="flex items-center gap-2 text-xl font-bold text-primary">
                    <Shield className="w-6 h-6" />
                    Admin Portal
                </h1>
                <Link href="/admin">
                     <Button variant="outline">Back to Dashboard</Button>
                </Link>
            </header>
            <main className="flex-1 p-4 sm:px-6 sm:py-0 md:gap-8">
                 <div className="max-w-4xl mx-auto grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                               <Users className="w-6 h-6 text-primary"/> Team Management
                            </CardTitle>
                            <CardDescription>
                                Add new team members and assign roles. Only admins can view this page.
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Add New Team Member</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <Form {...form}>
                             <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                                <FormField control={form.control} name="name" render={({ field }) => (
                                    <FormItem className="lg:col-span-1"><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="e.g., Jane Doe" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                 <FormField control={form.control} name="username" render={({ field }) => (
                                    <FormItem className="lg:col-span-1"><FormLabel>Username</FormLabel><FormControl><Input placeholder="e.g., jane_d" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="password" render={({ field }) => (
                                    <FormItem className="lg:col-span-1"><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder="********" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="role" render={({ field }) => (
                                    <FormItem className="lg:col-span-1">
                                        <FormLabel>Role</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="admin">Admin</SelectItem>
                                                <SelectItem value="team-member">Team Member</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                 <Button type="submit" className="lg:col-span-1 w-full">
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add Member
                                 </Button>
                             </form>
                           </Form>
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle>Current Team</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Username</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead><span className="sr-only">Actions</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {teamMembers.map((member) => (
                                        <TableRow key={member.id}>
                                            <TableCell className="font-medium">{member.name}</TableCell>
                                            <TableCell>{member.username}</TableCell>
                                            <TableCell>
                                                <Badge variant={member.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                                                    {member.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                 <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button aria-haspopup="true" size="icon" variant="ghost" disabled={member.id === 'user_001'}>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                            <span className="sr-only">Toggle menu</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem onSelect={() => handleDelete(member.id)}>
                                                            <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                           </Table>
                        </CardContent>
                    </Card>
                 </div>
            </main>
        </div>
    );
}
