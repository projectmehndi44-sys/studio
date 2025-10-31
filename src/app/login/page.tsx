
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { getAuth, RecaptchaVerifier, type ConfirmationResult } from 'firebase/auth';
import { getFirebaseApp, sendOtp } from '@/lib/firebase';
import { Alert } from '@/components/ui/alert';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Loader2, KeyRound, Home } from 'lucide-react';
import { getCustomer, createCustomer, updateCustomer } from '@/lib/services';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import Link from 'next/link';
import type { CartItem } from '@/lib/types';

const OTPSchema = z.object({
  phone: z.string().regex(/^\d{10}$/, { message: "Please enter a valid 10-digit phone number." }),
});
type OTPFormValues = z.infer<typeof OTPSchema>;

const NameSchema = z.object({
    name: z.string().min(2, { message: "Please enter a valid name." }),
});
type NameFormValues = z.infer<typeof NameSchema>;

export default function LoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(false);
    const [isOtpSent, setIsOtpSent] = React.useState(false);
    const [otp, setOtp] = React.useState('');
    const [error, setError] = React.useState('');
    const [isNamePromptOpen, setIsNamePromptOpen] = React.useState(false);
    const [newUserId, setNewUserId] = React.useState<string | null>(null);
    
    const [timer, setTimer] = React.useState(60);
    const [isResendDisabled, setIsResendDisabled] = React.useState(true);

    const recaptchaVerifierRef = React.useRef<RecaptchaVerifier | null>(null);
    const auth = getAuth(getFirebaseApp());

    const phoneForm = useForm<OTPFormValues>({
        resolver: zodResolver(OTPSchema),
        defaultValues: { phone: '' },
    });
    
    const nameForm = useForm<NameFormValues>({
        resolver: zodResolver(NameSchema),
        defaultValues: { name: '' },
    });
    
    // Initialize RecaptchaVerifier only once.
    React.useEffect(() => {
        if (!recaptchaVerifierRef.current) {
            recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible'
            });
        }
    }, [auth]);

    const handleSendOtp: SubmitHandler<OTPFormValues> = async (data) => {
        setError('');
        setIsLoading(true);
        setTimer(60);
        setIsResendDisabled(true);

        try {
            const verifier = recaptchaVerifierRef.current;
            if (!verifier) {
                throw new Error("RecaptchaVerifier not initialized.");
            }

            const confirmationResult = await sendOtp(data.phone, verifier);

            window.confirmationResult = confirmationResult;
            setIsOtpSent(true);
            toast({
                title: 'OTP Sent',
                description: `An OTP has been sent to +91 ${data.phone}.`,
            });
        } catch (err: any) {
            console.error("OTP send error:", err);
            let errorMessage = "Failed to send OTP. Please try again.";
            if (err.code === 'auth/too-many-requests') {
                errorMessage = "You have requested an OTP too many times. Please try again later.";
            }
            setError(errorMessage);
            // Reset verifier on error
            if (window.grecaptcha && recaptchaVerifierRef.current) {
                 window.grecaptcha.reset(recaptchaVerifierRef.current.widgetId);
            }
        } finally {
            setIsLoading(false);
        }
    };
    
     React.useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isOtpSent && timer > 0) {
            interval = setInterval(() => {
                setTimer((prevTimer) => prevTimer - 1);
            }, 1000);
        } else if (timer === 0) {
            setIsResendDisabled(false);
        }
        return () => clearInterval(interval);
    }, [isOtpSent, timer]);


    const processPostLoginActions = (customerId: string) => {
        const tempCartItemRaw = localStorage.getItem('tempCartItem');
        if (tempCartItemRaw) {
            const item: Omit<CartItem, 'id'> = JSON.parse(tempCartItemRaw);
            const userCartRaw = localStorage.getItem(`cart_${customerId}`) || '[]';
            const userCart: CartItem[] = JSON.parse(userCartRaw);

            // Add the new item with a unique ID
            const newCartItem: CartItem = { ...item, id: `${item.servicePackage.id}-${Date.now()}` };
            const newCart = [...userCart, newCartItem];

            localStorage.setItem(`cart_${customerId}`, JSON.stringify(newCart));
            localStorage.removeItem('tempCartItem');
            toast({
                title: "Item Restored!",
                description: `${item.servicePackage.name} has been added to your cart.`,
            });
            router.push('/cart'); // Redirect to cart to show the restored item
        } else {
            router.push('/'); // Default redirect
        }
    };

    const handleVerifyOtp = async () => {
        setError('');
        if (otp.length !== 6) {
            setError("Please enter a valid 6-digit OTP.");
            return;
        }
        setIsLoading(true);
        try {
            if (window.confirmationResult) {
                const result = await window.confirmationResult.confirm(otp);
                const user = result.user;
                
                let customer = await getCustomer(user.uid);
                
                if (!customer) {
                    // New user, create a temporary profile
                    const newCustomerData = {
                        id: user.uid,
                        name: `User ${user.uid.substring(0, 5)}`,
                        phone: user.phoneNumber || phoneForm.getValues('phone'),
                        email: user.email || ''
                    };
                    await createCustomer(newCustomerData);
                    setNewUserId(user.uid);
                    setIsNamePromptOpen(true);
                } else {
                    // Existing user
                    localStorage.setItem('currentCustomerId', customer.id);
                    toast({
                        title: 'Login Successful!',
                        description: `Welcome back, ${customer.name}!`,
                    });
                    processPostLoginActions(customer.id);
                }

            } else {
                 setError("Your session has expired. Please resend the OTP.");
                 return;
            }

        } catch (err: any) {
            console.error("OTP verification error:", err);
            let errorMessage = "Failed to verify OTP. Please check the code and try again.";
            if (err.code === 'auth/invalid-verification-code') {
                errorMessage = "Invalid OTP. Please try again.";
            } else if (err.code === 'auth/too-many-requests') {
                errorMessage = "Too many failed attempts. Please request a new OTP.";
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNameSubmit: SubmitHandler<NameFormValues> = async (data) => {
        if (!newUserId) return;
        setIsLoading(true);
        try {
            await updateCustomer(newUserId, { name: data.name });
            localStorage.setItem('currentCustomerId', newUserId);
            toast({
                title: 'Registration Successful!',
                description: `Welcome, ${data.name}!`,
            });
            processPostLoginActions(newUserId);
        } catch (error) {
            toast({
                title: 'Registration Failed',
                description: 'Could not save your name. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
            setIsNamePromptOpen(false);
        }
    };


    const renderPhoneForm = () => (
         <Form {...phoneForm}>
            <form onSubmit={phoneForm.handleSubmit(handleSendOtp)} className="space-y-4">
                <FormField
                    control={phoneForm.control}
                    name="phone"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                                <Input type="tel" placeholder="Enter your 10-digit number" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {error && <Alert variant="destructive"><p>{error}</p></Alert>}
                <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send OTP
                </Button>
            </form>
        </Form>
    );

    const renderOtpForm = () => (
        <div className="space-y-4 text-center">
            <p className="text-muted-foreground">Enter the 6-digit code sent to +91 {phoneForm.getValues('phone')}</p>
            <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup className="mx-auto">
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                </InputOTPGroup>
            </InputOTP>
            
            {error && <Alert variant="destructive"><p>{error}</p></Alert>}

            <Button onClick={handleVerifyOtp} disabled={isLoading || otp.length < 6} className="w-full">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify OTP
            </Button>
            <div className="flex justify-center items-center gap-2 text-sm">
                <Button 
                    variant="link" 
                    onClick={() => phoneForm.handleSubmit(handleSendOtp)()}
                    disabled={isResendDisabled || isLoading}
                >
                    Resend OTP
                </Button>
                {isResendDisabled && <span className="text-muted-foreground tabular-nums">({timer}s)</span>}
            </div>
            <Button variant="link" onClick={() => setIsOtpSent(false)} disabled={isLoading}>
                Change Number
            </Button>
        </div>
    );

  return (
    <>
    <div className="w-full min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <div className="max-w-md w-full space-y-6">
             <div className="bg-background p-8 rounded-lg shadow-lg">
                <div className="text-center mb-6">
                    <KeyRound className="mx-auto w-12 h-12 text-primary mb-2"/>
                    <h2 className="text-xl font-bold">Login with Phone</h2>
                </div>
                {isOtpSent ? renderOtpForm() : renderPhoneForm()}
            </div>
             <div className="text-center text-sm">
                <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors">
                    <Home className="mr-1 h-4 w-4" /> Back to Home
                </Link>
            </div>
        </div>
    </div>
    
    <Dialog open={isNamePromptOpen} onOpenChange={setIsNamePromptOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Welcome to UtsavLook!</DialogTitle>
                <DialogDescription>Please enter your name to complete your profile.</DialogDescription>
            </DialogHeader>
            <Form {...nameForm}>
                <form onSubmit={nameForm.handleSubmit(handleNameSubmit)} className="space-y-4">
                    <FormField
                        control={nameForm.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Your Full Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Anjali Sharma" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading} className="w-full">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Profile & Login
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>

    </>
  );
}
