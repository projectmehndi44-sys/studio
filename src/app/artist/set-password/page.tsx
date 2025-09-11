

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
import { getAuth, createUserWithEmailAndPassword, updatePassword } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { KeyRound, LogIn } from 'lucide-react';
import Link from 'next/link';
import { getArtistByEmail, updateArtist, getArtist } from '@/lib/services';
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
      // 1. Verify artist details and one-time code from Firestore
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

      // 2. Create or Update Firebase Auth user
      let authUser: User;
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        authUser = userCredential.user;
        
        // Sync the new Auth UID with the Firestore document ID
        // This is a critical step for consistency.
        if (artist.id !== authUser.uid) {
            // In a production app, you might migrate the document to a new ID,
            // but for simplicity here we update the artist doc with the new ID.
            // This assumes the admin-created ID was temporary.
            await updateArtist(artist.id, { id: authUser.uid }); 
            // In a real app, you would need to handle this more robustly, possibly by deleting the old doc and creating a new one with the correct ID.
        }

      } catch (authError: any) {
        if (authError.code === 'auth/email-already-in-use') {
          // If the user already exists in Auth, it means they are resetting their password.
          // This part of the logic is complex without server-side actions or sending real emails.
          // The current flow creates the user on first password set.
          // For a reset, the admin generates a new code, but we can't 'update' a password without being logged in.
          // The most secure flow for a reset would involve a Cloud Function.
          // For now, we'll tell them to contact admin for deletion/re-creation if stuck.
          throw new Error("A login account for this email already exists. If you forgot your password, please contact admin to generate a new reset code.");
        }
        throw authError; // Re-throw other auth errors
      }

      // 3. Update artist document in Firestore to invalidate the code
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

    