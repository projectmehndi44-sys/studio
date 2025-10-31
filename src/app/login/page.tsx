'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Home } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { signInWithPopup, GoogleAuthProvider, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { useAuth, useUser } from '@/firebase';
import { createCustomer } from '@/lib/services';
import { GoogleIcon } from '@/components/icons';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const phoneSchema = z.object({
  phone: z.string().regex(/^\d{10}$/, 'Please enter a valid 10-digit phone number.'),
});

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits.'),
});

export default function CustomerLoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    const auth = useAuth();
    const { user, isUserLoading } = useUser();
    
    const [step, setStep] = React.useState<'phone' | 'otp'>('phone');
    const [confirmationResult, setConfirmationResult] = React.useState<any>(null);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [phoneNumber, setPhoneNumber] = React.useState('');

    const phoneForm = useForm<z.infer<typeof phoneSchema>>({ resolver: zodResolver(phoneSchema) });
    const otpForm = useForm<z.infer<typeof otpSchema>>({ resolver: zodResolver(otpSchema) });
    
    React.useEffect(() => {
        if (!isUserLoading && user) {
            const tempCartItem = localStorage.getItem('tempCartItem');
            if (tempCartItem) {
                const cart = JSON.parse(localStorage.getItem(`cart_${user.uid}`) || '[]');
                cart.push(JSON.parse(tempCartItem));
                localStorage.setItem(`cart_${user.uid}`, JSON.stringify(cart));
                localStorage.removeItem('tempCartItem');
                router.push('/cart');
            } else {
                router.push('/account');
            }
        }
    }, [isUserLoading, user, router]);

    const setupRecaptcha = () => {
      if (!(window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'invisible',
          'callback': () => {},
        });
      }
    }

    const handlePhoneSubmit: SubmitHandler<z.infer<typeof phoneSchema>> = async (data) => {
        setIsSubmitting(true);
        setupRecaptcha();
        const appVerifier = (window as any).recaptchaVerifier;
        const fullPhoneNumber = `+91${data.phone}`;
        
        try {
            const result = await signInWithPhoneNumber(auth, fullPhoneNumber, appVerifier);
            setConfirmationResult(result);
            setPhoneNumber(fullPhoneNumber);
            setStep('otp');
            toast({ title: 'OTP Sent!', description: `An OTP has been sent to ${fullPhoneNumber}.` });
        } catch (error: any) {
            console.error(error);
            toast({ title: "Failed to send OTP", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleOtpSubmit: SubmitHandler<z.infer<typeof otpSchema>> = async (data) => {
        setIsSubmitting(true);
        try {
            const result = await confirmationResult.confirm(data.otp);
            const user = result.user;
            if (user) {
              await createCustomer({ id: user.uid, name: 'New User', phone: user.phoneNumber || '' });
            }
        } catch (error: any) {
            toast({ title: 'OTP Verification Failed', description: 'The OTP you entered is incorrect. Please try again.', variant: 'destructive'});
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoogleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            await createCustomer({ id: user.uid, name: user.displayName || 'New User', phone: user.phoneNumber || '', email: user.email || '' });
        } catch (error: any) {
            console.error(error);
            toast({ title: "Google Sign-In Failed", description: error.message, variant: "destructive" });
        }
    };
    
    if (isUserLoading || user) {
        return <div className="w-full flex items-center justify-center min-h-screen bg-muted/30"><p>Loading...</p></div>
    }

    return (
        <div className="w-full flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 via-secondary/20 to-accent/10">
             <div className="mx-auto grid w-[400px] gap-6 bg-background p-8 rounded-lg shadow-2xl">
                <div className="grid gap-2 text-center">
                    <h1 className="text-3xl font-bold text-primary font-headline">Welcome to UtsavLook</h1>
                    <p className="text-balance text-muted-foreground">Sign in or create an account to continue</p>
                </div>
                
                {step === 'phone' && (
                  <Form {...phoneForm}>
                    <form onSubmit={phoneForm.handleSubmit(handlePhoneSubmit)} className="grid gap-4">
                        <FormField control={phoneForm.control} name="phone" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <div className="flex items-center">
                                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm h-10">+91</span>
                                    <FormControl><Input type="tel" placeholder="9876543210" {...field} className="rounded-l-none" /></FormControl>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? 'Sending OTP...' : 'Send OTP'}
                        </Button>
                    </form>
                  </Form>
                )}

                {step === 'otp' && (
                     <Form {...otpForm}>
                        <form onSubmit={otpForm.handleSubmit(handleOtpSubmit)} className="grid gap-4">
                            <FormField control={otpForm.control} name="otp" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Enter OTP</FormLabel>
                                    <FormControl>
                                      <InputOTP maxLength={6} {...field}>
                                        <InputOTPGroup>
                                          <InputOTPSlot index={0} />
                                          <InputOTPSlot index={1} />
                                          <InputOTPSlot index={2} />
                                          <InputOTPSlot index={3} />
                                          <InputOTPSlot index={4} />
                                          <InputOTPSlot index={5} />
                                        </InputOTPGroup>
                                      </InputOTP>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                             <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? 'Verifying...' : 'Verify & Login'}
                            </Button>
                        </form>
                     </Form>
                )}

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                    </div>
                </div>

                <Button variant="outline" onClick={handleGoogleLogin}>
                    <GoogleIcon className="mr-2 h-5 w-5"/> Continue with Google
                </Button>

                <div className="mt-4 text-center text-sm">
                    <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors">
                        <Home className="mr-1 h-4 w-4" /> Back to Home
                    </Link>
                </div>
            </div>
            <div id="recaptcha-container" style={{ position: 'absolute', zIndex: -1, opacity: 0, bottom: 0, right: 0 }}></div>
        </div>
    );
}
