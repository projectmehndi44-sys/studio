
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { isSignInWithEmailLink, signInWithEmailLink, getFirebaseApp } from '@/lib/firebase';
import { createCustomer, getCustomerByEmail } from '@/lib/services';
import type { Customer } from '@/lib/types';
import { getAdditionalUserInfo, getAuth } from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function FinishLoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [message, setMessage] = React.useState('Verifying your sign-in link...');

    React.useEffect(() => {
        const processSignIn = async () => {
            const auth = getAuth(getFirebaseApp());
            if (isSignInWithEmailLink(auth, window.location.href)) {
                let email = window.localStorage.getItem('emailForSignIn');
                if (!email) {
                    // Fallback if local storage is cleared
                    email = window.prompt('Please provide your email for confirmation');
                }

                if (!email) {
                    setMessage('Could not verify. Email is required.');
                    toast({ title: 'Sign-in failed', description: 'Email address was not provided.', variant: 'destructive' });
                    router.push('/');
                    return;
                }

                try {
                    const result = await signInWithEmailLink(auth, email, window.location.href);
                    window.localStorage.removeItem('emailForSignIn');
                    
                    const additionalInfo = getAdditionalUserInfo(result);
                    let customer: Customer | null = await getCustomerByEmail(email);

                    if (additionalInfo?.isNewUser || !customer) {
                        setMessage('Welcome! Creating your account...');
                        const newCustomerData: Omit<Customer, 'id'> & { id: string } = {
                            id: result.user.uid,
                            name: result.user.displayName || email.split('@')[0],
                            phone: result.user.phoneNumber || '',
                            email: email,
                        };
                        await createCustomer(newCustomerData);
                        customer = newCustomerData;
                        toast({ title: 'Registration Successful!', description: `Welcome, ${customer.name}!` });
                    } else {
                        setMessage(`Welcome back, ${customer.name}!`);
                        toast({ title: 'Login Successful!', description: `Welcome back, ${customer.name}!` });
                    }

                    if (customer) {
                        localStorage.setItem('currentCustomerId', customer.id);
                    }
                    
                    setMessage('Success! Redirecting you now...');
                    router.push('/account');

                } catch (error) {
                    setMessage('Error during sign-in. Please try again.');
                    toast({
                        title: 'Sign-in Error',
                        description: 'The link may be expired or invalid. Please request a new one.',
                        variant: 'destructive',
                    });
                    console.error("Sign in with email link error", error);
                    router.push('/');
                }
            } else {
                 // This page is only for email link sign-in. Redirect if accessed directly.
                 setMessage('No action to perform. Redirecting...');
                 router.push('/');
            }
        };

        processSignIn();
    }, [router, toast]);


    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/30">
            <Card className="w-full max-w-sm text-center">
                <CardHeader>
                    <CardTitle>Completing Sign In</CardTitle>
                    <CardDescription>Please wait while we securely log you in...</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-muted-foreground">{message}</p>
                </CardContent>
            </Card>
        </div>
    );
}
