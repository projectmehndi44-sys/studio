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
import { LogIn } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { GoogleIcon } from '../icons';

const loginSchema = z.object({
  phone: z.string().regex(/^\d{10}$/, { message: 'Please enter a valid 10-digit phone number.' }),
  otp: z.string().min(6, { message: 'OTP must be 6 digits.' }).max(6, { message: 'OTP must be 6 digits.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface CustomerLoginModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccessfulLogin: (name: string) => void;
}

export function CustomerLoginModal({ isOpen, onOpenChange, onSuccessfulLogin }: CustomerLoginModalProps) {
  const { toast } = useToast();
  const [isOtpSent, setIsOtpSent] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSendingOtp, setIsSendingOtp] = React.useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: '',
      otp: '',
    },
  });

  const handleSendOtp = () => {
    const phone = form.getValues('phone');
    if (!/^\d{10}$/.test(phone)) {
        form.setError('phone', { type: 'manual', message: 'Please enter a valid 10-digit phone number to send OTP.' });
        return;
    }
    setIsSendingOtp(true);
    setTimeout(() => {
        setIsOtpSent(true);
        setIsSendingOtp(false);
        toast({
            title: 'OTP Sent',
            description: `An OTP has been sent to ${phone}.`,
        });
    }, 1000);
  }

  const onSubmit = (data: LoginFormValues) => {
    setIsSubmitting(true);
    // In a real app, this would verify the OTP against a backend service
    console.log(data);
    setTimeout(() => {
        // Mock a successful login and retrieve a mock user name
        // For demonstration, we'll use a hardcoded name. 
        // In a real app, you would fetch this from your database based on the phone number.
        onSuccessfulLogin('Jane Doe');
        handleClose();
    }, 1000)
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
        form.reset();
        setIsOtpSent(false);
        setIsSubmitting(false);
    }, 300);
  }
  
  const handleGoogleSignIn = () => {
    toast({
      title: 'Coming Soon!',
      description: 'Google sign-in functionality is under development.',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-primary font-bold text-2xl">Customer Login</DialogTitle>
          <DialogDescription>
            Enter your phone number to receive a login OTP.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                         <div className="flex gap-2">
                             <FormControl>
                                <Input type="tel" placeholder="9876543210" {...field} disabled={isOtpSent} />
                            </FormControl>
                            <Button type="button" onClick={handleSendOtp} disabled={isSendingOtp || isOtpSent}>
                                {isSendingOtp ? 'Sending...' : (isOtpSent ? 'Sent' : 'Send OTP')}
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
                        {isSubmitting ? 'Logging in...' : <><LogIn className="mr-2 h-4 w-4"/> Login with OTP</>}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
        <div className="relative my-2">
            <Separator />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 bg-background text-sm text-muted-foreground">OR</div>
        </div>
        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
            <GoogleIcon className="mr-2 h-5 w-5"/>
            Continue with Google
        </Button>
      </DialogContent>
    </Dialog>
  );
}
