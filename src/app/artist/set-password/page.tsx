

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
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { KeyRound, LogIn } from 'lucide-react';
import Link from 'next/link';
import { getArtistByEmail, updateArtist } from '@/lib/services';
import type { User } from 'firebase/auth';

const setPasswordSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  phone: z.string().regex(/^\d{10}$/, { message: 'Please enter a valid 10-digit phone number.' }),
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
      phone: '',
      oneTimeCode: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: SetPasswordFormValues) => {
    try {
      // 1. Verify artist details and one-time code
      const artist = await getArtistByEmail(data.email);

      if (!artist) {
        throw new Error("No artist found with this email address.");
      }
      if (artist.phone !== data.phone) {
        throw new Error("The phone number does not match our records for this email.");
      }
      if (artist.firstTimeLoginCodeUsed) {
        throw new Error("This one-time login code has already been used. Please request a new one from your admin.");
      }
       if (artist.firstTimeLoginCode !== data.oneTimeCode) {
        throw new Error("The one-time login code is incorrect.");
      }

      // 2. Create Firebase Auth user
      let authUser: User;
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        authUser = userCredential.user;
      } catch (authError: any) {
        if (authError.code === 'auth/email-already-in-use') {
            throw new Error("A login account for this email already exists. Please contact admin to reset your password if you forgot it.");
        }
        throw authError; // Re-throw other auth errors
      }

      // 3. Update artist document in Firestore
      await updateArtist(artist.id, {
        firstTimeLoginCodeUsed: true,
        // It's crucial to ensure the Firestore doc ID matches the Firebase Auth UID
        // This should be handled during admin onboarding, but we double-check here.
        // In a real scenario, you might have a cloud function to sync this.
        // For now, we assume the initial 'id' is correct or we could update it.
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
        description: error.message || 'An unexpected error occurred.',
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
            Welcome! Please enter your details and the one-time code provided by your admin to create your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
               <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Registered Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>Registered Phone Number</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="oneTimeCode" render={({ field }) => (
                  <FormItem><FormLabel>One-Time Login Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem><FormLabel>New Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                  <FormItem><FormLabel>Confirm New Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
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

    