

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
import { getAuth, signInWithEmailAndPassword, updatePassword } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { KeyRound, LogIn } from 'lucide-react';
import Link from 'next/link';
import { getArtistByEmail, updateArtist } from '@/lib/services';
import type { User } from 'firebase/auth';

const setPasswordSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  oneTimeCode: z.string().min(6, 'Code must be 6 digits.').max(6, 'Code must be 6 digits.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ["confirmPassword"],
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
      oneTimeCode: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: SetPasswordFormValues) => {
    try {
      // 1. Verify artist details and one-time code from Firestore
      const artist = await getArtistByEmail(data.email);

      if (!artist) {
        throw new Error("No artist found with this email address.");
      }
      if (artist.firstTimeLoginCodeUsed) {
        throw new Error("This one-time login code has already been used. Please request a new one from your admin.");
      }
      if (artist.firstTimeLoginCode !== data.oneTimeCode) {
        throw new Error("The one-time login code is incorrect.");
      }
      
      // THIS IS THE CRITICAL PART: This logic is flawed on the client-side
      // as we can't get the user object without their current password.
      // A Cloud Function is the most secure way to handle this.
      // The logic here is a *simulation* of what a secure flow would do.
      // We will assume that if the code is correct, we can proceed.
      
      // Let's call a new service function that handles this logic securely.
      // For now, we will mock this by directly updating the artist document
      // and asking the user to log in again.
      // NOTE: This does not actually update the Firebase Auth password.
      // The user will need to use the "Forgot Password" flow with the admin
      // to get a real password reset. The `handlePasswordReset` on the admin
      // page is what actually works. This flow is for the very first time setup.

      // A real implementation would involve a cloud function.
      // For this project, we'll tell the user to contact admin for the real password
      // if this "client-side update" fails.

      toast({
        title: 'Please contact admin to set your password.',
        description: 'The secure password update must be done via a reset link.',
        variant: 'destructive',
        duration: 9000,
      });

      // router.push('/artist/login');
      // The correct client-side action is to guide them to a working flow.
      // The "handlePasswordReset" in the admin artist page generates a code that can be used here.
      // Let's assume the admin has given them a code after creation.
      // The proper flow requires reauthentication. The admin creates the user with a temporary password.
      
      // The one-time code is the temporary password.
      const userCredential = await signInWithEmailAndPassword(auth, data.email, `temp-password-${data.oneTimeCode}`);
      
      const user = userCredential.user;

      if (!user) {
        throw new Error("Could not authenticate with the provided one-time code. It may be incorrect or expired.");
      }

      await updatePassword(user, data.password);
      
      await updateArtist(artist.id, {
        firstTimeLoginCodeUsed: true,
      });

      toast({
        title: 'Password Created Successfully!',
        description: 'You can now log in with your email and new password.',
        duration: 9000,
      });

      router.push('/artist/login');


    } catch (error: any) {
      console.error('Error setting password:', error);
      toast({
        title: 'Failed to Set Password',
        description: "The one-time code is invalid or has expired. Please ask your admin to generate a new one.",
        variant: 'destructive',
        duration: 9000,
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
            Welcome! Please enter your details and the one-time code provided by your admin to create your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
               <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Registered Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="oneTimeCode" render={({ field }) => (
                  <FormItem><FormLabel>One-Time Login Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem><FormLabel>New Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                  <FormItem><FormLabel>Confirm New Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormMessage>
                )} />
              
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : 'Create Password & Login'}
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

    
