

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { User, Save } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { TeamMember } from '@/lib/team-data';
import { getTeamMembers, saveTeamMembers } from '@/lib/services';


const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  username: z.string().min(4, 'Username must be at least 4 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  confirmPassword: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});


type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileManagementPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [userRole, setUserRole] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: '',
            username: '',
            password: '',
            confirmPassword: ''
        },
    });

    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            const isAdminAuthenticated = localStorage.getItem('isAdminAuthenticated');
            const role = localStorage.getItem('adminRole');
            const currentUsername = localStorage.getItem('adminUsername');
            
            setUserRole(role);
            if (isAdminAuthenticated !== 'true' || !role) {
                toast({
                    title: "Access Denied",
                    description: "You are not logged in.",
                    variant: "destructive"
                });
                router.push('/admin/login');
                return;
            }

            getTeamMembers().then(teamMembers => {
                const currentUser = teamMembers.find(member => member.username === currentUsername && member.role === role);
                if (currentUser) {
                    form.reset({
                        name: currentUser.name,
                        username: currentUser.username,
                    });
                }
            });
        }
    }, [router, toast, form]);


    const onSubmit: SubmitHandler<ProfileFormValues> = async (data) => {
        setIsLoading(true);
        const currentUsername = localStorage.getItem('adminUsername');
        const teamMembers = await getTeamMembers();
        const userIndex = teamMembers.findIndex(member => member.username === currentUsername);

        if (userIndex === -1) {
            toast({ title: 'Error', description: 'Could not find user to update.', variant: 'destructive' });
            setIsLoading(false);
            return;
        }

        const updatedUser = { ...teamMembers[userIndex] };
        updatedUser.name = data.name;
        updatedUser.username = data.username;
        if (data.password) {
            updatedUser.password = data.password;
        }
        
        teamMembers[userIndex] = updatedUser;
        await saveTeamMembers(teamMembers);
        
        // Update the username in localStorage for the current session
        localStorage.setItem('adminUsername', updatedUser.username);

        setTimeout(() => {
            toast({
                title: 'Profile Updated',
                description: `Your profile details have been successfully updated.`,
            });
             if (data.password) {
                 toast({
                    title: 'Password Changed',
                    description: 'Your password has been updated. Please use it for your next login.',
                });
             }
            form.setValue('password', '');
            form.setValue('confirmPassword', '');
            setIsLoading(false);
        }, 1500)
    };
    
    // Simplified access control for demonstration
    if (!userRole) {
         return (
             <div className="flex min-h-screen w-full flex-col bg-background items-center justify-center">
                <Card className="p-8 text-center">
                    <CardTitle>Loading...</CardTitle>
                </Card>
            </div>
        );
    }

    return (
        <>
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">My Profile</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="w-6 h-6 text-primary"/> Profile Management
                    </CardTitle>
                    <CardDescription>
                        Update your account details. Leave password fields blank to keep your current password.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                        <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="e.g., Jane Doe" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="username" render={({ field }) => (
                                <FormItem><FormLabel>Username</FormLabel><FormControl><Input placeholder="e.g., jane_d" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Change Password</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField control={form.control} name="password" render={({ field }) => (
                                        <FormItem><FormLabel>New Password</FormLabel><FormControl><Input type="password" placeholder="Enter new password" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                        <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                                        <FormItem><FormLabel>Confirm New Password</FormLabel><FormControl><Input type="password" placeholder="Confirm new password" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </CardContent>
                            </Card>
                            
                            <Button type="submit" disabled={isLoading} className="w-full">
                                    {isLoading ? 'Saving...' : <><Save className="mr-2 h-4 w-4"/> Save Changes</>}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </>
    );
}
