
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { UserPlus } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { GoogleIcon } from '../icons';
import { signInWithGoogle, setupRecaptcha, sendOtp } from '@/lib/firebase';
import type { Customer } from '@/types';
import { getCustomerByPhone, createCustomer, getCustomerByEmail } from '@/lib/services';
import type { ConfirmationResult, RecaptchaVerifier } from 'firebase/auth';


const registrationSchema = z.object({
  fullName: z.string().min(1, { message: 'Full name is required.' }),
  phone: z.string().regex(/^\d{10}$/, { message: 'Please enter a valid 10-digit phone number.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }).optional().or(z.literal('')),
  otp: z.string().min(6, { message: 'OTP must be 6 digits.' }).max(6, { message: 'OTP must be 6 digits.' }),
});

type RegistrationFormValues = z.infer<typeof registrationSchema>;

interface CustomerRegistrationModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccessfulRegister: (customer: Customer) => void;
}

export function CustomerRegistrationModal({ isOpen, onOpenChange, onSuccessfulRegister }: CustomerRegistrationModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSendingOtp, setIsSendingOtp] = React.useState(false);
  const [isOtpSent, setIsOtpSent] = React.useState(false);
  const recaptchaVerifierRef = React.useRef<RecaptchaVerifier | null>(null);

  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      email: '',
      otp: '',
    },
  });


  const handlePhoneVerify = async () => {
    const phone = form.getValues('phone');
    if (!/^\d{10}$/.test(phone)) {
        form.setError('phone', { type: 'manual', message: 'Please enter a valid 10-digit phone number to verify.' });
        return;
    }
    const existingCustomer = await getCustomerByPhone(phone);
    if (existingCustomer) {
        form.setError('phone', { type: 'manual', message: 'This phone number is already registered. Please login.' });
        return;
    }

    setIsSendingOtp(true);
    try {
      if (!recaptchaVerifierRef.current) {
          recaptchaVerifierRef.current = setupRecaptcha('recaptcha-container-register');
      }
      const confirmationResult = await sendOtp(phone, recaptchaVerifierRef.current);
      window.confirmationResult = confirmationResult;
      setIsOtpSent(true);
      toast({
          title: 'OTP Sent',
          description: `An OTP has been sent to ${phone}.`,
      });
    } catch (error) {
       console.error("OTP Error:", error);
       toast({
           title: 'Failed to Send OTP',
           description: 'Could not send OTP. Please check your phone number or try again later.',
           variant: 'destructive',
       });
    } finally {
        setIsSendingOtp(false);
    }
  }

  const onSubmit = async (data: RegistrationFormValues) => {
    setIsSubmitting(true);
    
     if (!window.confirmationResult) {
        toast({ title: 'Verification failed. Please request a new OTP.', variant: 'destructive' });
        setIsSubmitting(false);
        return;
    }
    
    try {
      const userCredential = await window.confirmationResult.confirm(data.otp);
      
      const newCustomerData: Omit<Customer, 'id'> = {
          name: data.fullName,
          phone: data.phone,
          email: data.email,
          fcmToken: userCredential.user.uid, // Storing Firebase UID
      };
      
      const newId = await createCustomer({ ...newCustomerData, id: userCredential.user.uid });
      const newCustomer = { ...newCustomerData, id: newId };

      toast({
        title: "Registration Successful!",
        description: `Welcome to MehendiFy, ${data.fullName}!`,
      });
      localStorage.setItem('currentCustomerId', newCustomer.id);
      onSuccessfulRegister(newCustomer);
      handleClose();

    } catch (error) {
       console.error("OTP Confirmation Error:", error);
        toast({
            title: 'Registration Failed',
            description: 'The OTP is incorrect. Please try again.',
            variant: 'destructive',
        });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      form.reset();
      setIsSubmitting(false);
      setIsOtpSent(false);
      setIsSendingOtp(false);
    }, 300);
  }

  const handleGoogleSignUp = async () => {
    try {
        const user = await signInWithGoogle();
        if (user && user.email) {
            let customer = await getCustomerByEmail(user.email);

            if (customer) { // If user exists, log them in
               toast({
                  title: 'Welcome Back!',
                  description: `You are now logged in as ${customer.name}.`,
               });
            } else { // If user doesn't exist, create a new account
               const newCustomerData: Omit<Customer, 'id'> & {id: string} = {
                  id: user.uid,
                  name: user.displayName || 'Google User',
                  phone: user.phoneNumber || '', // May be null
                  email: user.email,
              };
              await createCustomer(newCustomerData);
              customer = newCustomerData;
              toast({
                  title: "Registration Successful!",
                  description: `Welcome to MehendiFy, ${customer.name}!`,
              });
            }
            localStorage.setItem('currentCustomerId', customer.id);
            onSuccessfulRegister(customer);
            handleClose();
        }
    } catch (error: any) {
        if (error.code !== 'auth/cancelled-popup-request' && error.code !== 'auth/popup-closed-by-user') {
            console.error("Google Sign-Up Error:", error);
            toast({
              title: 'Google Sign-Up Failed',
              description: 'Could not sign up with Google. Please try again.',
              variant: 'destructive',
            });
        }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-primary font-bold text-2xl">Create Customer Account</DialogTitle>
          <DialogDescription>
            Join MehendiFy to start booking amazing artists.
          </DialogDescription>
        </DialogHeader>
         <div id="recaptcha-container-register"/>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                 <FormField control={form.control} name="fullName" render={({ field }) => (
                    <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Your full name" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email Address (Optional)</FormLabel><FormControl><Input placeholder="your.email@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <div className="flex gap-2">
                        <FormControl>
                            <Input type="tel" placeholder="9876543210" {...field} disabled={isOtpSent} />
                        </FormControl>
                        <Button type="button" onClick={handlePhoneVerify} disabled={isSendingOtp || isOtpSent}>
                            {isSendingOtp ? 'Sending...' : (isOtpSent ? 'Sent' : 'Verify')}
                        </Button>
                        </div>
                        <FormMessage />
                    </FormItem>
                )} />

                {isOtpSent && (
                    <FormField control={form.control} name="otp" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Enter OTP</FormLabel>
                            <FormControl>
                               <Input placeholder="Enter 6-digit OTP" {...field} />
                            </FormControl>
                             <FormMessage />
                        </FormItem>
                    )} />
                )}

                <DialogFooter>
                    <Button type="submit" className="w-full" disabled={!isOtpSent || isSubmitting}>
                        {isSubmitting ? 'Registering...' : <><UserPlus className="mr-2 h-4 w-4" /> Register</>}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
        <div className="relative my-2">
            <Separator />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 bg-background text-sm text-muted-foreground">OR</div>
        </div>
        <Button variant="outline" className="w-full" onClick={handleGoogleSignUp}>
            <GoogleIcon className="mr-2 h-5 w-5"/>
            Continue with Google
        </Button>
      </DialogContent>
    </Dialog>
  );
}

    