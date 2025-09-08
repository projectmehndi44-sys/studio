

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, MoreHorizontal, UserCog } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { teamMembers as initialTeamMembers, TeamMember, Permissions, PERMISSION_MODULES, PermissionLevel } from '@/lib/team-data';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';


const memberSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  username: z.string().min(4, 'Username must be at least 4 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.literal('team-member'),
  permissions: z.object({
    dashboard: z.enum(['edit', 'view', 'hidden']),
    bookings: z.enum(['edit', 'view', 'hidden']),
    artists: z.enum(['edit', 'view', 'hidden']),
    customers: z.enum(['edit', 'view', 'hidden']),
    artistDirectory: z.enum(['edit', 'view', 'hidden']),
    payouts: z.enum(['edit', 'view', 'hidden']),
    transactions: z.enum(['edit', 'view', 'hidden']),
    packages: z.enum(['edit', 'view', 'hidden']),
    settings: z.enum(['edit', 'view', 'hidden']),
  }),
});

type MemberFormValues = z.infer<typeof memberSchema>;

export default function TeamManagementPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useAdminAuth();
    const [teamMembers, setTeamMembers] = React.useState<TeamMember[]>([]);
    const [editingMember, setEditingMember] = React.useState<TeamMember | null>(null);

    const form = useForm<MemberFormValues>({
        resolver: zodResolver(memberSchema),
        defaultValues: { 
            name: '', 
            username: '', 
            password: '', 
            role: 'team-member',
            permissions: {
                dashboard: 'view',
                bookings: 'hidden',
                artists: 'hidden',
                customers: 'hidden',
                artistDirectory: 'hidden',
                payouts: 'hidden',
                transactions: 'hidden',
                packages: 'hidden',
                settings: 'hidden',
            }
        },
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
       setTeamMembers(getTeamMembers());
    }, [getTeamMembers]);
    
    const onSubmit: SubmitHandler<MemberFormValues> = (data) => {
        const currentMembers = getTeamMembers();
        
        if (!editingMember && currentMembers.some(member => member.username === data.username)) {
            form.setError('username', { type: 'manual', message: 'Username already exists.' });
            return;
        }

        let updatedMembers;

        if (editingMember) {
             updatedMembers = currentMembers.map(member => 
                member.id === editingMember.id ? { ...member, name: data.name, permissions: data.permissions } : member
            );
            toast({ title: 'Team Member Updated', description: `${data.name}'s permissions have been updated.` });
        } else {
             const newMember: TeamMember = {
                id: `user_${Date.now()}`,
                ...data,
            };
            updatedMembers = [...currentMembers, newMember];
            toast({ title: 'Team Member Added', description: `${data.name} has been added to the team.` });
        }
        
        saveTeamMembers(updatedMembers);
        form.reset();
        setEditingMember(null);
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
    
    const handleEdit = (member: TeamMember) => {
        setEditingMember(member);
        form.reset({
            name: member.name,
            username: member.username,
            password: member.password || '********', // Don't show real password
            role: 'team-member',
            permissions: member.permissions
        });
    }

    if (user && user.role !== 'admin') {
         return (
             <div className="flex min-h-full w-full flex-col items-center justify-center">
                <Card className="p-8 text-center">
                    <CardTitle>Access Denied</CardTitle>
                    <CardDescription>You do not have permission to manage team members.</CardDescription>
                    <Button onClick={() => router.push('/admin')} className="mt-4">Back to Dashboard</Button>
                </Card>
            </div>
        );
    }

    return (
        <>
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Team Management</h1>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UserCog className="w-6 h-6 text-primary"/> 
                                {editingMember ? `Edit ${editingMember.name}` : 'Add New Team Member'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                   <div className="grid grid-cols-1 gap-4">
                                        <FormField control={form.control} name="name" render={({ field }) => (
                                            <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="e.g., Jane Doe" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="username" render={({ field }) => (
                                            <FormItem><FormLabel>Username</FormLabel><FormControl><Input placeholder="e.g., jane_d" {...field} disabled={!!editingMember} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="password" render={({ field }) => (
                                            <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" {...field} disabled={!!editingMember} /></FormControl>{editingMember && <FormDescription>Password cannot be changed.</FormDescription>}<FormMessage /></FormItem>
                                        )} />
                                    </div>
                                    
                                    <Accordion type="single" collapsible className="w-full">
                                        <AccordionItem value="permissions">
                                            <AccordionTrigger>Permissions</AccordionTrigger>
                                            <AccordionContent>
                                                <div className="space-y-4 pt-2">
                                                {PERMISSION_MODULES.map((module) => (
                                                        <FormField
                                                        key={module.key}
                                                        control={form.control}
                                                        name={`permissions.${module.key}`}
                                                        render={({ field }) => (
                                                            <FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                                                <FormLabel className="font-normal">{module.label}</FormLabel>
                                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                    <FormControl>
                                                                        <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        <SelectItem value="edit">Can Edit</SelectItem>
                                                                        <SelectItem value="view">View Only</SelectItem>
                                                                        <SelectItem value="hidden">Hidden</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </FormItem>
                                                        )}
                                                        />
                                                    ))}
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>

                                    <div className="flex gap-2">
                                        {editingMember && <Button type="button" variant="outline" onClick={() => { setEditingMember(null); form.reset(); }} className="w-full">Cancel</Button>}
                                        <Button type="submit" className="w-full">
                                            {editingMember ? 'Update Member' : <><PlusCircle className="mr-2 h-4 w-4" /> Add Member</>}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </div>

                    <div className="lg:col-span-2">
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
                                                        {member.role === 'admin' ? 'Super Admin' : 'Team Member'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                        <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button aria-haspopup="true" size="icon" variant="ghost" disabled={member.role === 'admin'}>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                                <span className="sr-only">Toggle menu</span>
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                             <DropdownMenuItem onSelect={() => handleEdit(member)} disabled={member.role === 'admin'}>
                                                                <UserCog className="mr-2 h-4 w-4" />
                                                                Edit Permissions
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onSelect={() => handleDelete(member.id)} disabled={member.role === 'admin'}>
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
            </div>
        </>
    );
}
