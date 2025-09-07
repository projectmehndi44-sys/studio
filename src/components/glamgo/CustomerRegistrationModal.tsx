
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
import { signInWithGoogle } from '@/lib/firebase';
import type { Customer } from '@/types';


const registrationSchema = z.object({
  fullName: z.string().min(1, { message: 'Full name is required.' }),
  phone: z.string().regex(/^\d{10}$/, { message: 'Please enter a valid 10-digit phone number.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
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
  const [isVerifyingOtp, setIsVerifyingOtp] = React.useState(false);
  const [isOtpSent, setIsOtpSent] = React.useState(false);


  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      email: '',
    },
  });

  const getCustomers = (): Customer[] => {
    return JSON.parse(localStorage.getItem('customers') || '[]');
  }
  
  const saveCustomers = (customers: Customer[]) => {
      localStorage.setItem('customers', JSON.stringify(customers));
      window.dispatchEvent(new Event('storage'));
  }


  const handlePhoneVerify = () => {
    const phone = form.getValues('phone');
    if (!/^\d{10}$/.test(phone)) {
        form.setError('phone', { type: 'manual', message: 'Please enter a valid 10-digit phone number to verify.' });
        return;
    }
    const customers = getCustomers();
    if (customers.some(c => c.phone === phone)) {
        form.setError('phone', { type: 'manual', message: 'This phone number is already registered.' });
        return;
    }

    setIsVerifyingOtp(true);
    setTimeout(() => {
        setIsOtpSent(true);
        setIsVerifyingOtp(false);
        toast({
            title: 'OTP Sent',
            description: `An OTP has been sent to ${phone} via SMS and WhatsApp.`,
        });
    }, 1000);
  }

  const onSubmit = (data: RegistrationFormValues) => {
    setIsSubmitting(true);
    // In a real app, this would trigger a server action to create a user and verify OTP
    console.log(data);
    setTimeout(() => {
        const customers = getCustomers();
        const newCustomer: Customer = {
            id: data.phone, // Use phone as unique ID for this example
            ...data
        };
        saveCustomers([...customers, newCustomer]);

        toast({
          title: "Registration Successful!",
          description: `Welcome to MehendiFy, ${data.fullName}!`,
        });
        localStorage.setItem('currentCustomerId', newCustomer.id);
        onSuccessfulRegister(newCustomer);
        handleClose();
    }, 1000);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      form.reset();
      setIsSubmitting(false);
      setIsOtpSent(false);
      setIsVerifyingOtp(false);
    }, 300);
  }

  const handleGoogleSignUp = async () => {
    try {
      const user = await signInWithGoogle();
      if (user && user.email) {
          const customers = getCustomers();
          let customer = customers.find(c => c.email === user.email);

          if (customer) { // If user exists, log them in
             toast({
                title: 'Welcome Back!',
                description: `You are now logged in as ${customer.name}.`,
             });
          } else { // If user doesn't exist, create a new account
             customer = {
                id: user.uid,
                name: user.displayName || 'Google User',
                phone: user.phoneNumber || '', // May be null
                email: user.email,
            };
            saveCustomers([...customers, customer]);
            toast({
                title: "Registration Successful!",
                description: `Welcome to MehendiFy, ${customer.name}!`,
            });
          }
          localStorage.setItem('currentCustomerId', customer.id);
          onSuccessfulRegister(customer);
          handleClose();
      }
    } catch (error) {
      console.error("Google Sign-Up Error:", error);
      toast({
        title: 'Google Sign-Up Failed',
        description: 'Could not sign up with Google. Please try again.',
        variant: 'destructive',
      });
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
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="fullName" render={({ field }) => (
                    <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Your full name" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input placeholder="your.email@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <div className="flex gap-2">
                        <FormControl>
                            <Input type="tel" placeholder="9876543210" {...field} disabled={isOtpSent} />
                        </FormControl>
                        <Button type="button" onClick={handlePhoneVerify} disabled={isVerifyingOtp || isOtpSent}>
                            {isVerifyingOtp ? 'Sending...' : (isOtpSent ? 'Sent' : 'Verify')}
                        </Button>
                        </div>
                        <FormMessage />
                    </FormItem>
                )} />

                {isOtpSent && (
                    <div className="space-y-2">
                        <Input id="otp" placeholder="Enter 6-digit OTP (any value)" />
                        <p className="text-xs text-muted-foreground">For this demo, any OTP will work.</p>
                    </div>
                )}

                <DialogFooter>
                    <Button type="submit" className="w-full" disabled={!isOtpSent || isSubmitting}>
                        {isSubmitting ? 'Registering...' : <><UserPlus className="mr-2 h-4 w-4" /> Register with OTP</>}
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
