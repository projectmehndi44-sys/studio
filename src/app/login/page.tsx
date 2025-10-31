
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
import { signInWithPopup, GoogleAuthProvider, RecaptchaVerifier, signInWithPhoneNumber, onAuthStateChanged, User } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { createCustomer, getCustomer } from '@/lib/services';
import { GoogleIcon } from '@/components/icons';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
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

const nameSchema = z.object({
  fullName: z.string().min(2, { message: 'Please enter your full name.' }),
});

type OtpLimit = {
  count: number;
  expiry: number;
};

export default function CustomerLoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    const auth = useAuth();
    
    const [isUserLoading, setIsUserLoading] = React.useState(true);
    const [step, setStep] = React.useState<'phone' | 'otp'>('phone');
    const [confirmationResult, setConfirmationResult] = React.useState<any>(null);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [phoneNumber, setPhoneNumber] = React.useState('');

    // State for OTP resend timer and limits
    const [timer, setTimer] = React.useState(0);
    const [otpLimit, setOtpLimit] = React.useState<OtpLimit | null>(null);

    // State for new user profile completion
    const [isNameModalOpen, setIsNameModalOpen] = React.useState(false);
    const [newUser, setNewUser] = React.useState<User | null>(null);

    const phoneForm = useForm<z.infer<typeof phoneSchema>>({
        resolver: zodResolver(phoneSchema),
        defaultValues: { phone: '' }
    });
    const otpForm = useForm<z.infer<typeof otpSchema>>({
        resolver: zodResolver(otpSchema),
        defaultValues: { otp: '' }
    });
    const nameForm = useForm<z.infer<typeof nameSchema>>({
        resolver: zodResolver(nameSchema),
        defaultValues: { fullName: '' },
    });

    // Timer effect
    React.useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => setTimer(t => t - 1), 1000);
            return () => clearInterval(interval);
        }
    }, [timer]);

    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const customerProfile = await getCustomer(user.uid);
                // If it's a new user without a name, open the modal
                if (customerProfile && !customerProfile.name) {
                    setNewUser(user);
                    setIsNameModalOpen(true);
                } else if (customerProfile) {
                     // Existing user, redirect them
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
            }
            setIsUserLoading(false);
        });

        return () => unsubscribe();
    }, [auth, router]);
    
    const getOtpLimit = (): OtpLimit | null => {
        const item = localStorage.getItem(`otp_limit_${phoneNumber}`);
        if (!item) return null;
        const limit: OtpLimit = JSON.parse(item);
        // Check if the limit has expired
        if (new Date().getTime() > limit.expiry) {
            localStorage.removeItem(`otp_limit_${phoneNumber}`);
            return null;
        }
        return limit;
    };

    const setOtpLimitData = (phone: string) => {
        const existingLimit = getOtpLimit();
        const newCount = (existingLimit?.count || 0) + 1;
        const newExpiry = existingLimit?.expiry || new Date().getTime() + 2 * 60 * 60 * 1000; // 2 hours from now
        
        const newLimit: OtpLimit = { count: newCount, expiry: newExpiry };
        localStorage.setItem(`otp_limit_${phone}`, JSON.stringify(newLimit));
        setOtpLimit(newLimit);
    };

    const setupRecaptcha = () => {
      if (!(window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'invisible',
          'callback': () => {},
        });
      }
    }

    const handleSendOtp = async (phone: string) => {
        setIsSubmitting(true);
        const currentLimit = getOtpLimit();

        if (currentLimit && currentLimit.count >= 5) {
            toast({
                title: "OTP Limit Exceeded",
                description: "You have tried too many times. Please try again later or use Google sign-in.",
                variant: "destructive",
            });
            setIsSubmitting(false);
            return;
        }

        setupRecaptcha();
        const appVerifier = (window as any).recaptchaVerifier;
        const fullPhoneNumber = `+91${phone}`;
        
        try {
            const result = await signInWithPhoneNumber(auth, fullPhoneNumber, appVerifier);
            setConfirmationResult(result);
            setPhoneNumber(fullPhoneNumber);
            setStep('otp');
            setTimer(120); // Start 2-minute timer
            setOtpLimitData(phone);
            toast({ title: 'OTP Sent!', description: `An OTP has been sent to ${fullPhoneNumber}.` });
        } catch (error: any) {
            console.error(error);
            toast({ title: "Failed to send OTP", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handlePhoneSubmit: SubmitHandler<z.infer<typeof phoneSchema>> = (data) => {
        setPhoneNumber(data.phone); // Set phone number for limit tracking
        handleSendOtp(data.phone);
    };

    const handleResendOtp = () => {
        if (timer > 0) return;
        handleSendOtp(phoneNumber);
    };

    const handleOtpSubmit: SubmitHandler<z.infer<typeof otpSchema>> = async (data) => {
        setIsSubmitting(true);
        try {
            const result = await confirmationResult.confirm(data.otp);
            const user = result.user;
            
            const existingCustomer = await getCustomer(user.uid);
            if (!existingCustomer) {
              await createCustomer({ id: user.uid, phone: user.phoneNumber || '' });
            }
        } catch (error: any) {
            toast({ title: 'OTP Verification Failed', description: 'The OTP you entered is incorrect. Please try again.', variant: 'destructive'});
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleNameSubmit = async (data: { fullName: string }) => {
        if (!newUser) return;
        try {
            await createCustomer({ id: newUser.uid, name: data.fullName, phone: newUser.phoneNumber || '' });
            setIsNameModalOpen(false);
            setNewUser(null);
            // After name submission, redirect to dashboard
            router.push('/account');
        } catch (error) {
            toast({ title: "Profile Update Failed", description: "Could not save your name. Please try again.", variant: "destructive" });
        }
    }

    const handleGoogleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            
            const existingCustomer = await getCustomer(user.uid);
            if (!existingCustomer) {
                await createCustomer({ id: user.uid, name: user.displayName || undefined, phone: user.phoneNumber || '', email: user.email || '' });
            }
        } catch (error: any) {
            console.error(error);
            toast({ title: "Google Sign-In Failed", description: error.message, variant: "destructive" });
        }
    };
    
    const isOtpSendDisabled = (getOtpLimit()?.count || 0) >= 5;
    
    if (isUserLoading) {
        return <div className="w-full flex items-center justify-center min-h-screen bg-muted/30"><p>Loading...</p></div>
    }

    return (
        <>
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
                                        <FormControl><Input type="tel" placeholder="9876543210" {...field} className="rounded-l-none" disabled={isOtpSendDisabled} /></FormControl>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <Button type="submit" className="w-full" disabled={isSubmitting || isOtpSendDisabled}>
                                {isSubmitting ? 'Sending OTP...' : (isOtpSendDisabled ? 'OTP Limit Reached' : 'Send OTP')}
                            </Button>
                        </form>
                      </Form>
                    )}

                    {step === 'otp' && (
                         <Form {...otpForm}>
                            <form onSubmit={otpForm.handleSubmit(handleOtpSubmit)} className="grid gap-4 text-center">
                                <FormField control={otpForm.control} name="otp" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Enter OTP sent to {phoneNumber}</FormLabel>
                                        <FormControl>
                                            <div className="flex justify-center">
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
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                 <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting ? 'Verifying...' : 'Verify & Login'}
                                </Button>
                                <div className="text-sm text-muted-foreground">
                                    Didn't receive OTP? 
                                    <Button variant="link" type="button" onClick={handleResendOtp} disabled={timer > 0}>
                                        Resend {timer > 0 ? `in ${timer}s` : ''}
                                    </Button>
                                </div>
                            </form>
                         </Form>
                    )}
                    
                     {isOtpSendDisabled && (
                        <p className="text-center text-sm text-destructive">
                            You have exceeded the maximum OTP attempts. Please try again after 2 hours or use Google sign-in.
                        </p>
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

            <Dialog open={isNameModalOpen} onOpenChange={(open) => !open && router.push('/')}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Welcome to UtsavLook!</DialogTitle>
                        <DialogDescription>Let's complete your profile. Please enter your full name.</DialogDescription>
                    </DialogHeader>
                    <Form {...nameForm}>
                        <form onSubmit={nameForm.handleSubmit(handleNameSubmit)} className="space-y-4">
                            <FormField
                                control={nameForm.control}
                                name="fullName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Full Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter your name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="submit" disabled={nameForm.formState.isSubmitting}>
                                    {nameForm.formState.isSubmitting ? "Saving..." : "Complete Profile"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </>
    );
}
