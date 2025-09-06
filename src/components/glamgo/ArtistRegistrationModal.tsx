'use client';

import * as React from 'react';
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
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Terminal } from 'lucide-react';

interface ArtistRegistrationModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function ArtistRegistrationModal({ isOpen, onOpenChange }: ArtistRegistrationModalProps) {
  const { toast } = useToast();
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [agreed, setAgreed] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      toast({
        title: "Incomplete Information",
        description: "Please fill out all fields.",
        variant: "destructive",
      });
      return;
    }
     if (!agreed) {
      toast({
        title: "Terms and Conditions",
        description: "You must agree to the terms and conditions to register.",
        variant: "destructive",
      });
      return;
    }
    
    // In a real app, this would trigger a server action to create a registration request
    console.log({
      name,
      email,
    });
    
    setIsSubmitted(true);
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset form after a short delay to allow the dialog to close
    setTimeout(() => {
        setIsSubmitted(false);
        setName('');
        setEmail('');
        setAgreed(false);
    }, 300);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
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
            <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                        id="name"
                        placeholder="Your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="terms" checked={agreed} onCheckedChange={(checked) => setAgreed(!!checked)} />
                    <label
                        htmlFor="terms"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        I agree to the <a href="/terms" target="_blank" className="underline">Terms & Conditions</a>.
                    </label>
                </div>
            </div>
            <DialogFooter>
                <Button type="submit" className="bg-accent hover:bg-accent/90 w-full">Submit for Review</Button>
            </DialogFooter>
            </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
