
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { getAuth, updatePassword } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { KeyRound, LogIn } from 'lucide-react';
import Link from 'next/link';

const setPasswordSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ['confirmPassword'],
});

type SetPasswordFormValues = z.infer<typeof setPasswordSchema>;

export default function SetPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = getAuth(app);

  const form = useForm<SetPasswordFormValues>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: SetPasswordFormValues) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        toast({
          title: 'Authentication Error',
          description: 'You must be logged in to set your password. Please log in first.',
          variant: 'destructive',
        });
        router.push('/artist/login');
        return;
      }
      
      if (user.email !== data.email) {
          form.setError('email', { message: 'The email does not match the currently logged-in user.'});
          return;
      }

      await updatePassword(user, data.password);

      toast({
        title: 'Password Set Successfully!',
        description: 'You can now log in with your new password.',
      });

      router.push('/artist/login');

    } catch (error: any) {
      console.error('Error setting password:', error);
      let description = 'An unexpected error occurred. Please try again.';
      if(error.code === 'auth/requires-recent-login') {
          description = 'This is a sensitive operation and requires a recent login. Please log in again and then set your password.';
      }
      toast({
        title: 'Failed to Set Password',
        description: description,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="w-full flex items-center justify-center min-h-screen bg-muted/30">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <KeyRound className="mx-auto h-12 w-12 text-primary" />
          <CardTitle className="text-2xl font-bold mt-4">Set Your Artist Password</CardTitle>
          <CardDescription>
            Welcome! Please create a secure password to access your artist dashboard. First, log in with the temporary credentials provided by the admin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Registered Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter your email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Create a strong password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Confirm your password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : 'Set Password and Finish'}
              </Button>
            </form>
          </Form>
           <div className="mt-4 text-center text-sm">
                Already have a password?{' '}
                <Link href="/artist/login" className="underline inline-flex items-center">
                    <LogIn className="mr-1 h-3 w-3"/>
                    Login Here
                </Link>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
