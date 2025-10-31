
'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, LogIn } from 'lucide-react';
import { getAuth, confirmPasswordReset } from 'firebase/auth';
import { getFirebaseApp } from '@/lib/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';

function SetPasswordComponent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [password, setPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [isSuccess, setIsSuccess] = React.useState(false);
    const auth = getAuth(getFirebaseApp());
    const oobCode = searchParams.get('oobCode');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }
        if (!oobCode) {
            setError("Invalid or missing password reset code.");
            return;
        }

        setIsLoading(true);
        try {
            await confirmPasswordReset(auth, oobCode, password);
            setIsSuccess(true);
            toast({
                title: "Password Set Successfully!",
                description: "Your new password has been set. You can now log in.",
            });
            setTimeout(() => router.push('/artist/login'), 3000);

        } catch (err: any) {
            console.error("Set password error:", err);
            let errorMessage = "An unknown error occurred. Please try again.";
            if (err.code === 'auth/expired-action-code') {
                errorMessage = "This link has expired. Please request a new password reset link from the login page.";
            } else if (err.code === 'auth/invalid-action-code') {
                errorMessage = "This link is invalid or has already been used. Please request a new one from the login page.";
            }
             setError(errorMessage);
             toast({
                title: "Error Setting Password",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!oobCode) {
        return (
            <div className="w-full flex items-center justify-center min-h-screen bg-muted/30">
                <Alert variant="destructive" className="max-w-md">
                    <AlertTitle>Invalid Link</AlertTitle>
                    <AlertDescription>
                        The password reset link is missing or invalid. Please return to the login page and request a new one.
                        <Button asChild variant="link" className="mt-2">
                            <Link href="/artist/login">Go to Artist Login</Link>
                        </Button>
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    if (isSuccess) {
        return (
             <div className="w-full flex items-center justify-center min-h-screen bg-muted/30">
                 <Card className="mx-auto grid w-[380px] gap-6 text-center p-8">
                     <KeyRound className="w-12 h-12 mx-auto text-green-500" />
                     <CardTitle>Password Successfully Set!</CardTitle>
                     <CardDescription>You will be redirected to the login page shortly.</CardDescription>
                     <Button onClick={() => router.push('/artist/login')}>
                         <LogIn className="mr-2"/> Login Now
                     </Button>
                </Card>
            </div>
        )
    }

    return (
        <div className="w-full flex items-center justify-center min-h-screen bg-muted/30">
            <div className="mx-auto grid w-[380px] gap-6">
                <div className="grid gap-2 text-center">
                    <h1 className="text-3xl font-bold text-primary">Create Your Password</h1>
                    <p className="text-balance text-muted-foreground">
                        Set a secure password for your UtsavLook Artist account.
                    </p>
                </div>
                 <form onSubmit={handleSubmit} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="password">New Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    {error && <p className="text-sm font-medium text-destructive">{error}</p>}
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Saving...' : 'Set Password & Continue'}
                    </Button>
                </form>
            </div>
        </div>
    );
}

export default function SetPasswordPage() {
    return (
        <React.Suspense fallback={<div>Loading...</div>}>
            <SetPasswordComponent />
        </React.Suspense>
    )
}
