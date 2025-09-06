
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
import { useToast } from '@/hooks/use-toast';
import { Shield, User, Save } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { teamMembers } from '@/lib/team-data';


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
        const isAdminAuthenticated = localStorage.getItem('isAdminAuthenticated');
        const role = localStorage.getItem('adminRole');
        const username = localStorage.getItem('adminUsername');
        
        setUserRole(role);
        if (isAdminAuthenticated !== 'true' || role !== 'admin') {
            toast({
                title: "Access Denied",
                description: "You do not have permission to view this page.",
                variant: "destructive"
            });
            router.push('/admin');
            return;
        }

        // In a real app, you'd fetch this from the backend.
        // For now, we find the user in our mock data.
        const adminUser = teamMembers.find(member => member.username === username && member.role === 'admin');
        if(adminUser) {
            form.reset({
                name: adminUser.name,
                username: adminUser.username,
            });
        }
    }, [router, toast, form]);


    const onSubmit: SubmitHandler<ProfileFormValues> = (data) => {
        setIsLoading(true);
        // In a real app, you would send this to your backend to update the user.
        console.log("Updating profile:", data);
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

    if (userRole !== 'admin') {
         return (
             <div className="flex min-h-screen w-full flex-col bg-muted/40 items-center justify-center">
                <Card className="p-8 text-center">
                    <CardTitle>Access Denied</CardTitle>
                    <CardDescription>You need to be an admin to manage your profile.</CardDescription>
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
                 <div className="max-w-2xl mx-auto grid gap-6">
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
                 </div>
            </main>
        </div>
    );
}

    