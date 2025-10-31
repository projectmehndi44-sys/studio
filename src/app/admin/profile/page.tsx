
'use client';

import * as React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { User, Save } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { TeamMember } from '@/lib/types';
import { getTeamMembers, saveTeamMembers } from '@/lib/services';
import { useAdminAuth } from '@/firebase/auth/use-admin-auth';


const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  username: z.string().min(4, 'Username must be at least 4 characters'),
});


type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileManagementPage() {
    const { user, isLoading: isAuthLoading } = useAdminAuth();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = React.useState(false);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: '',
            username: '',
        },
    });

    React.useEffect(() => {
        if (user) {
            form.reset({
                name: user.name,
                username: user.username,
            });
        }
    }, [user, form]);


    const onSubmit: SubmitHandler<ProfileFormValues> = async (data) => {
        if (!user) return;
        setIsSaving(true);
        
        try {
            const teamMembers = await getTeamMembers();
            const userIndex = teamMembers.findIndex(member => member.id === user.id);

            if (userIndex === -1) {
                throw new Error('Could not find your user profile in the database.');
            }

            const updatedTeamMembers = [
                ...teamMembers.slice(0, userIndex),
                { ...teamMembers[userIndex], name: data.name },
                ...teamMembers.slice(userIndex + 1),
            ];
            
            await saveTeamMembers(updatedTeamMembers);

            toast({
                title: 'Profile Updated',
                description: `Your name has been successfully updated.`,
            });
        } catch(error: any) {
             toast({ title: 'Error', description: error.message || 'Could not update your profile.', variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };
    
    if (isAuthLoading) {
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
                        Update your account details. To change your password, please log out and use the "Forgot Password" feature.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="e.g., Jane Doe" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="username" render={({ field }) => (
                                <FormItem><FormLabel>Username (Cannot be changed)</FormLabel><FormControl><Input placeholder="e.g., jane@example.com" {...field} disabled /></FormControl><FormMessage /></FormItem>
                            )} />
                            
                            <Button type="submit" disabled={isSaving} className="w-full">
                                {isSaving ? 'Saving...' : <><Save className="mr-2 h-4 w-4"/> Save Changes</>}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </>
    );
}
