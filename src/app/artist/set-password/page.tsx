
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
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { KeyRound, LogIn } from 'lucide-react';
import Link from 'next/link';

const setPasswordSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
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
    },
  });

  const onSubmit = async (data: SetPasswordFormValues) => {
    try {
      await sendPasswordResetEmail(auth, data.email);

      toast({
        title: 'Password Reset Email Sent!',
        description: `An email has been sent to ${data.email} with instructions to create your password. Please check your inbox and spam folder.`,
        duration: 9000,
      });

      router.push('/artist/login');

    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      let description = 'An unexpected error occurred. Please check the email address and try again.';
      if (error.code === 'auth/user-not-found') {
        description = 'This email is not registered as an artist. Please contact admin if you believe this is an error.';
      }
      toast({
        title: 'Failed to Send Email',
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
            Enter the email you were registered with. We will send you a secure link to create your password for the first time.
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
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Sending...' : 'Send Password Creation Link'}
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
