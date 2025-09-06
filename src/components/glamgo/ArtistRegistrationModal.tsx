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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Terminal, ShieldAlert } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';


const passwordSchema = z.string()
  .min(6, { message: 'Password must be at least 6 characters long.' })
  .max(8, { message: 'Password must be at most 8 characters long.' })
  .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter.' })
  .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter.' })
  .regex(/[^A-Za-z0-9]/, { message: 'Password must contain at least one symbol.' });

const registrationSchema = z.object({
  fullName: z.string().min(1, { message: 'Full name is required.' }),
  aadharAddress: z.string().min(1, { message: 'Aadhar address is required.' }),
  presentAddress: z.string().min(1, { message: 'Present address is required.' }),
  servingAreas: z.string().min(1, { message: 'Please list at least one serving area.' }),
  phone: z.string().regex(/^\d{10}$/, { message: 'Please enter a valid 10-digit phone number.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: passwordSchema,
  confirmPassword: passwordSchema,
  agreed: z.boolean().refine((val) => val === true, { message: 'You must agree to the terms and conditions.' }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});


type RegistrationFormValues = z.infer<typeof registrationSchema>;


interface ArtistRegistrationModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function ArtistRegistrationModal({ isOpen, onOpenChange }: ArtistRegistrationModalProps) {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = React.useState(false);
  const [isOtpSent, setIsOtpSent] = React.useState(false);


  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      fullName: '',
      aadharAddress: '',
      presentAddress: '',
      servingAreas: '',
      phone: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreed: false,
    },
  });

  const onSubmit = (data: RegistrationFormValues) => {
    // In a real app, this would trigger a server action to create a registration request
    console.log(data);
    
    setIsSubmitted(true);
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset form after a short delay to allow the dialog to close
    setTimeout(() => {
        setIsSubmitted(false);
        form.reset();
    }, 300);
  }

  const handlePhoneVerify = () => {
    const phone = form.getValues('phone');
    if (!/^\d{10}$/.test(phone)) {
        form.setError('phone', { type: 'manual', message: 'Please enter a valid 10-digit phone number to verify.' });
        return;
    }
    // Mock OTP sending
    setIsVerifyingOtp(true);
    setTimeout(() => {
        setIsOtpSent(true);
        setIsVerifyingOtp(false);
        toast({
            title: 'OTP Sent',
            description: `An OTP has been sent to ${phone}.`,
        });
    }, 1000);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-primary font-bold text-2xl">Register as an Artist</DialogTitle>
          <DialogDescription>
            Join our community of talented artists. Fill out the form below to get started.
          </DialogDescription>
        </DialogHeader>
        {isSubmitted ? (
            <div className="space-y-4 py-4">
                 <Alert>
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Registration Submitted!</AlertTitle>
                    <AlertDescription className="space-y-2">
                      <p>Thank you for registering! Your profile is now under review.</p>
                      <p className="font-semibold">Profile creation is subject to data verification and admin approval and may take up to 24 hours. Please wait.</p>
                      <p>For more details, contact our admin at <a href="mailto:admin@glamgo.com" className="underline">admin@glamgo.com</a>.</p>
                    </AlertDescription>
                </Alert>
                 <Button onClick={handleClose} className="w-full">
                    Close
                </Button>
            </div>
        ) : (
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="max-h-[60vh] overflow-y-auto pr-4">
                    <div className="grid gap-4 py-4">
                        <FormField control={form.control} name="fullName" render={({ field }) => (
                            <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Your full name" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />

                        <FormField control={form.control} name="aadharAddress" render={({ field }) => (
                             <FormItem><FormLabel>Address (As per Aadhaar)</FormLabel><FormControl><Textarea placeholder="Enter your official address" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />

                        <FormField control={form.control} name="presentAddress" render={({ field }) => (
                            <FormItem><FormLabel>Present Address</FormLabel><FormControl><Textarea placeholder="Enter your current residential address" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />

                        <FormField control={form.control} name="servingAreas" render={({ field }) => (
                             <FormItem><FormLabel>Serving Areas</FormLabel><FormControl><Input placeholder="e.g., South Mumbai, Navi Mumbai, Thane" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />

                        <FormField control={form.control} name="email" render={({ field }) => (
                            <FormItem><FormLabel>Email Address (will be your username)</FormLabel><FormControl><Input type="email" placeholder="your.email@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        
                        <FormField control={form.control} name="phone" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <div className="flex gap-2">
                                <FormControl>
                                    <Input type="tel" placeholder="9876543210" {...field} disabled={isOtpSent} />
                                </FormControl>
                                <Button type="button" onClick={handlePhoneVerify} disabled={isVerifyingOtp || isOtpSent} className="flex-shrink-0">
                                    {isVerifyingOtp ? 'Sending...' : (isOtpSent ? 'Verified' : 'Verify')}
                                </Button>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )} />

                         {isOtpSent && (
                            <div className="space-y-2">
                               <Label htmlFor="otp">Enter OTP</Label>
                               <Input id="otp" placeholder="Enter 6-digit OTP" />
                               <p className="text-xs text-muted-foreground">For this demo, any OTP will work. In a real app, this would be validated.</p>
                            </div>
                        )}

                        <FormField control={form.control} name="password" render={({ field }) => (
                             <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />

                        <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                            <FormItem><FormLabel>Confirm Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                       
                        <FormField
                            control={form.control}
                            name="agreed"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                                <FormControl>
                                    <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>
                                         I agree to the <a href="/terms" target="_blank" className="underline">Terms & Conditions</a>.
                                    </FormLabel>
                                    <FormMessage />
                                </div>
                                </FormItem>
                            )}
                        />
                    </div>
                </div>
            <DialogFooter>
                <Button type="submit" className="bg-accent hover:bg-accent/90 w-full">Submit for Review</Button>
            </DialogFooter>
            </form>
            </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
