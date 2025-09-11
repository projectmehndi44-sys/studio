
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
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
import type { TeamMember, Permissions } from '@/types';
import { PERMISSION_MODULES } from '@/lib/team-data';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { getTeamMembers, saveTeamMembers } from '@/lib/services';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { getAuth } from 'firebase/auth';
import { app } from '@/lib/firebase';


const memberSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  username: z.string().email('Username must be a valid email address'),
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
    notifications: z.enum(['edit', 'view', 'hidden']),
  }),
});

type MemberFormValues = z.infer<typeof memberSchema>;

export default function TeamManagementPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useAdminAuth();
    const [teamMembers, setTeamMembers] = React.useState<TeamMember[]>([]);
    const [editingMember, setEditingMember] = React.useState<TeamMember | null>(null);
    const auth = getAuth(app);

    const form = useForm<MemberFormValues>({
        resolver: zodResolver(memberSchema),
        defaultValues: { 
            name: '', 
            username: '', 
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
                notifications: 'hidden',
            }
        },
    });

    React.useEffect(() => {
       getTeamMembers().then(setTeamMembers);
    }, []);

    const onSubmit: SubmitHandler<MemberFormValues> = async (data) => {
        const currentMembers = await getTeamMembers();
        
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
            try {
                // Create a user with a temporary password, they will reset it via email link.
                const userCredential = await createUserWithEmailAndPassword(auth, data.username, `temp_password_${Date.now()}`);
                const authUser = userCredential.user;
                
                const newMember: TeamMember = {
                    id: authUser.uid,
                    name: data.name,
                    username: data.username,
                    role: data.role,
                    permissions: data.permissions
                };
                updatedMembers = [...currentMembers, newMember];
                
                // Send password creation email
                await sendPasswordResetEmail(auth, data.username);
                
                toast({ title: 'Team Member Added', description: `${data.name} has been sent an email to create their password.` });
            } catch (error: any) {
                 toast({ title: 'Creation Failed', description: error.message, variant: 'destructive'});
                 return;
            }
        }
        
        await saveTeamMembers(updatedMembers);
        setTeamMembers(updatedMembers);
        form.reset({ name: '', username: '', role: 'team-member', permissions: form.getValues('permissions')});
        setEditingMember(null);
    };

    const handleDelete = async (memberId: string) => {
        const memberToDelete = teamMembers.find(m => m.id === memberId);
        if (memberToDelete?.role === 'Super Admin') {
            toast({
                title: 'Cannot Delete Super Admin',
                description: 'The Super Admin account cannot be deleted.',
                variant: 'destructive',
            });
            return;
        }
        // NOTE: This does not delete the user from Firebase Auth, which should be done via a server-side function in a real app
        // for security reasons. We will just remove them from the list here.
        const currentMembers = await getTeamMembers();
        const updatedMembers = currentMembers.filter(member => member.id !== memberId);
        await saveTeamMembers(updatedMembers);
        setTeamMembers(updatedMembers);
        
        toast({
            title: 'Member Removed',
            description: 'The team member has been removed from the list. Their auth account still exists.',
            variant: 'destructive',
        });
    };
    
    const handleEdit = (member: TeamMember) => {
        setEditingMember(member);
        form.reset({
            id: member.id,
            name: member.name,
            username: member.username,
            role: 'team-member',
            permissions: member.permissions
        });
    }

    if (user && user.role !== 'Super Admin') {
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
                                            <FormItem><FormLabel>Login Email</FormLabel><FormControl><Input type="email" placeholder="e.g., jane@example.com" {...field} disabled={!!editingMember} /></FormControl><FormMessage /></FormItem>
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
                                                    <Badge variant={member.role === 'Super Admin' ? 'default' : 'secondary'} className="capitalize">
                                                        {member.role}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                        <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button aria-haspopup="true" size="icon" variant="ghost" disabled={member.role === 'Super Admin'}>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                                <span className="sr-only">Toggle menu</span>
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                             <DropdownMenuItem onSelect={() => handleEdit(member)} disabled={member.role === 'Super Admin'}>
                                                                <UserCog className="mr-2 h-4 w-4" />
                                                                Edit Permissions
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onSelect={() => handleDelete(member.id)} disabled={member.role === 'Super Admin'}>
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
