

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
import { Terminal, Upload } from 'lucide-react';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '../ui/separator';
import { getAvailableLocations, createPendingArtist } from '@/lib/services';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const registrationSchema = z.object({
  fullName: z.string().min(1, { message: 'Full name is required.' }),
  aadharAddress: z.string().min(1, { message: 'Aadhaar address is required.' }),
  presentAddress: z.string().min(1, { message: 'Present address is required.' }),
  state: z.string().min(1, { message: 'Please select a state.' }),
  district: z.string().min(1, { message: 'Please select a district.' }),
  locality: z.string().min(1, { message: 'Please enter a locality.' }),
  servingAreas: z.string().min(1, { message: 'Please list at least one serving area.' }),
  phone: z.string().regex(/^\d{10}$/, { message: 'Please enter a valid 10-digit phone number.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  workImages: z.any()
    .refine((files) => files?.length >= 1, "At least one work image is required.")
    .refine((files) => Array.from(files).every((file: any) => file.size <= MAX_FILE_SIZE), `Max file size is 5MB per image.`)
    .refine(
      (files) => Array.from(files).every((file: any) => ACCEPTED_IMAGE_TYPES.includes(file.type)),
      ".jpg, .jpeg, .png and .webp files are accepted."
    ),
  agreed: z.boolean().refine((val) => val === true, { message: 'You must agree to the terms and conditions.' }),
});


type RegistrationFormValues = z.infer<typeof registrationSchema>;


interface ArtistRegistrationModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function ArtistRegistrationModal({ isOpen, onOpenChange }: ArtistRegistrationModalProps) {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [availableLocations, setAvailableLocations] = React.useState<Record<string, string[]>>({});
  
  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      fullName: '',
      aadharAddress: '',
      presentAddress: '',
      state: '',
      district: '',
      locality: '',
      servingAreas: '',
      phone: '',
      email: '',
      workImages: undefined,
      agreed: false,
    },
  });

  // Effect to load available locations from localStorage when the modal opens
  React.useEffect(() => {
    if (isOpen) {
        getAvailableLocations().then(locations => {
            if (Object.keys(locations).length === 0) {
               console.log("No service locations configured by admin.");
            }
            setAvailableLocations(locations);
        });
    }
  }, [isOpen]);

  const selectedState = form.watch('state');
  const availableStates = Object.keys(availableLocations);
  const districtsInSelectedState = selectedState ? (availableLocations[selectedState] || []) : [];


  const onSubmit = async (data: RegistrationFormValues) => {
    // In a real app with file uploads, you'd handle the files here, e.g., upload to Firebase Storage.
    // For this example, we'll store form data without the files.
    const { workImages, ...dataToStore } = data;

    const newPendingArtist = {
        ...dataToStore,
        status: 'Pending',
        submissionDate: new Date().toISOString(),
    };

    await createPendingArtist(newPendingArtist);
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
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
                      <p>For more details, contact our admin at <a href="mailto:admin@mehendify.com" className="underline">admin@mehendify.com</a>.</p>
                    </AlertDescription>
                </Alert>
                 <Button onClick={handleClose} className="w-full">
                    Close
                </Button>
            </div>
        ) : (
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="max-h-[60vh] overflow-y-auto pr-4 -mr-4 space-y-6">
                   {Object.keys(availableLocations).length === 0 ? (
                        <Alert variant="destructive">
                            <Terminal className="h-4 w-4" />
                            <AlertTitle>Registration Currently Unavailable</AlertTitle>
                            <AlertDescription>
                                We are not currently accepting new artist registrations. The admin has not configured any service locations yet. Please check back later or contact support for more information.
                            </AlertDescription>
                        </Alert>
                   ) : (
                    <>
                    {/* Personal Details Section */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg text-primary">Step 1: Personal & Contact Details</h3>
                         <FormField control={form.control} name="fullName" render={({ field }) => (
                            <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Your full name" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="email" render={({ field }) => (
                                <FormItem><FormLabel>Email Address (This will be your username)</FormLabel><FormControl><Input type="email" placeholder="your.email@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                           <FormField control={form.control} name="phone" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phone Number</FormLabel>
                                    <FormControl>
                                        <Input type="tel" placeholder="9876543210" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        <FormField control={form.control} name="aadharAddress" render={({ field }) => (
                             <FormItem><FormLabel>Address (As per Aadhaar)</FormLabel><FormControl><Textarea placeholder="Enter your official address" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="presentAddress" render={({ field }) => (
                            <FormItem><FormLabel>Present Address</FormLabel><FormControl><Textarea placeholder="Enter your current residential address" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>

                    <Separator/>

                    {/* Service Location Section */}
                     <div className="space-y-4">
                        <h3 className="font-semibold text-lg text-primary">Step 2: Service Location</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <FormField control={form.control} name="state" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>State</FormLabel>
                                    <Select onValueChange={(value) => { field.onChange(value); form.setValue('district', ''); }} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Select an available state" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {availableStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="district" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>District</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value} disabled={!selectedState}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Select a district" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {districtsInSelectedState.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                     { !selectedState && <FormDescription>Please select a state first.</FormDescription> }
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        <FormField control={form.control} name="locality" render={({ field }) => (
                             <FormItem>
                                <FormLabel>Primary Locality / Area</FormLabel>
                                <FormControl><Input placeholder="e.g., Koregaon Park" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="servingAreas" render={({ field }) => (
                             <FormItem><FormLabel>Other Serving Areas</FormLabel><FormControl><Input placeholder="e.g., South Mumbai, Navi Mumbai, Thane" {...field} /></FormControl><FormDescription>Comma-separated list of other areas you serve.</FormDescription><FormMessage /></FormItem>
                        )} />
                    </div>

                    <Separator/>

                    {/* Portfolio */}
                     <div className="space-y-4">
                         <h3 className="font-semibold text-lg text-primary">Step 3: Portfolio & Agreement</h3>
                         <FormField
                            control={form.control}
                            name="workImages"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Work Images</FormLabel>
                                    <FormControl>
                                        <div className="relative border-2 border-dashed border-muted-foreground/50 rounded-lg p-4 text-center hover:border-accent cursor-pointer">
                                            <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                                            <p className="mt-2 text-sm text-muted-foreground">Click to upload or drag and drop</p>
                                            <p className="text-xs text-muted-foreground">PNG, JPG, WEBP up to 5MB</p>
                                            <Input 
                                                type="file" 
                                                className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                                                accept=".jpg,.jpeg,.png,.webp"
                                                multiple
                                                onChange={(e) => field.onChange(e.target.files)}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
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
                    </>
                   )}
                </div>
            <DialogFooter>
                <Button type="submit" className="bg-accent hover:bg-accent/90 w-full" disabled={Object.keys(availableLocations).length === 0 || form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Submitting...' : 'Submit for Review'}
                </Button>
            </DialogFooter>
            </form>
            </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

    