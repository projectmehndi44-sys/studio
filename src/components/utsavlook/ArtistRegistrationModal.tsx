

'use client';

import * as React from 'react';
import { useForm, useFieldArray, UseFormReturn } from 'react-hook-form';
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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Terminal, ArrowLeft, PlusCircle, Trash2, Phone, Mail } from 'lucide-react';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAvailableLocations, createPendingArtist, getCompanyProfile } from '@/lib/services';
import { Progress } from '../ui/progress';
import { v4 as uuidv4 } from 'uuid';
import { Card, CardContent } from '@/components/ui/card';

const serviceItems = [
    { id: 'mehndi', label: 'Mehndi' },
    { id: 'makeup', label: 'Makeup' },
    { id: 'photography', label: 'Photography' },
] as const;

const serviceAreaSchema = z.object({
  id: z.string(),
  state: z.string().min(1, "State is required."),
  district: z.string().min(1, "District is required."),
  localities: z.string().min(1, "At least one locality is required."),
});

const registrationSchema = z.object({
  fullName: z.string().min(1, { message: 'Full name is required.' }),
  phone: z.string().regex(/^\d{10}$/, { message: 'Please enter a valid 10-digit phone number.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  services: z.array(z.string()).refine(value => value.some(item => item), {
    message: "You have to select at least one service.",
  }),
  serviceAreas: z.array(serviceAreaSchema).min(1, "You must add at least one service area."),
  agreed: z.boolean().refine((val) => val === true, { message: 'You must agree to the terms and conditions.' }),
});


type RegistrationFormValues = z.infer<typeof registrationSchema>;

const ServiceAreaFields = ({ form, availableLocations }: { form: UseFormReturn<RegistrationFormValues>, availableLocations: Record<string, string[]> }) => {
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "serviceAreas"
    });

    const availableStates = Object.keys(availableLocations);

    return (
        <div className="p-4 border rounded-lg space-y-4">
            <h4 className="font-semibold">Service Areas</h4>
            <FormDescription>Add all the areas where you are willing to provide services. You must add at least one.</FormDescription>
            {fields.map((field, index) => {
                const watchedState = form.watch(`serviceAreas.${index}.state`);
                const districtsForSelectedState = watchedState ? (availableLocations[watchedState] || []) : [];
                
                return (
                    <Card key={field.id} className="p-4 bg-muted/50 relative">
                         {fields.length > 1 && <Button type="button" size="icon" variant="ghost" className="absolute top-2 right-2" onClick={() => remove(index)}><Trash2 className="w-4 h-4 text-destructive"/></Button>}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name={`serviceAreas.${index}.state`} render={({ field }) => (
                                <FormItem>
                                    <FormLabel>State</FormLabel>
                                    <Select onValueChange={(value) => { field.onChange(value); form.setValue(`serviceAreas.${index}.district`, ''); }} value={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select state"/></SelectTrigger></FormControl>
                                        <SelectContent>{availableStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name={`serviceAreas.${index}.district`} render={({ field }) => (
                                <FormItem>
                                    <FormLabel>District</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value} disabled={!watchedState || districtsForSelectedState.length === 0}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select a district" /></SelectTrigger></FormControl>
                                        <SelectContent>{districtsForSelectedState.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                         <FormField control={form.control} name={`serviceAreas.${index}.localities`} render={({ field }) => (
                            <FormItem className="mt-4">
                                <FormLabel>Localities Served</FormLabel>
                                <FormControl><Input placeholder="e.g., Koregaon Park, Viman Nagar" {...field}/></FormControl>
                                <FormDescription>Enter a comma-separated list.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </Card>
                );
            })}
            <Button type="button" variant="outline" onClick={() => append({ id: uuidv4(), state: '', district: '', localities: '' })}>
                <PlusCircle className="mr-2 h-4 w-4"/> Add Another Service Area
            </Button>
            <FormMessage>{form.formState.errors.serviceAreas?.message || form.formState.errors.serviceAreas?.root?.message}</FormMessage>
        </div>
    );
};


interface ArtistRegistrationModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function ArtistRegistrationModal({ isOpen, onOpenChange }: ArtistRegistrationModalProps) {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [availableLocations, setAvailableLocations] = React.useState<Record<string, string[]>>({});
  const [isLoadingLocations, setIsLoadingLocations] = React.useState(true);
  const [step, setStep] = React.useState(1);
  const totalSteps = 3;
  const [companyProfile, setCompanyProfile] = React.useState({ phone: '', email: '' });

  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      email: '',
      services: ['mehndi'],
      serviceAreas: [],
      agreed: false,
    },
  });
  
  React.useEffect(() => {
    if (isOpen) {
        setIsLoadingLocations(true);
        Promise.all([
            getAvailableLocations(),
            getCompanyProfile()
        ]).then(([locations, profile]) => {
            setAvailableLocations(locations);
            setCompanyProfile(profile);
            setIsLoadingLocations(false);
        }).catch(() => setIsLoadingLocations(false));
    }
  }, [isOpen]);
  
  React.useEffect(() => {
    if (isOpen && !isLoadingLocations && Object.keys(availableLocations).length > 0) {
        if (form.getValues('serviceAreas').length === 0) {
            form.reset({
                ...form.getValues(),
                serviceAreas: [{ id: uuidv4(), state: '', district: '', localities: '' }],
            });
        }
    }
  }, [isOpen, isLoadingLocations, availableLocations, form]);

  const handleNextStep = async () => {
    let fieldsToValidate: (keyof RegistrationFormValues)[] = [];
    if(step === 1) fieldsToValidate = ['fullName', 'email', 'phone'];
    if(step === 2) fieldsToValidate = ['serviceAreas', 'services'];

    const isValid = await form.trigger(fieldsToValidate);
    if(isValid) setStep(prev => prev + 1);
  }

  const onSubmit = async (data: RegistrationFormValues) => {
    const { agreed, ...dataToStore } = data;

    const firstServiceArea = dataToStore.serviceAreas[0];
    const locationString = `${firstServiceArea.localities.split(',')[0].trim()}, ${firstServiceArea.district}`;
    
    const newPendingArtist = {
        ...dataToStore,
        location: locationString,
        status: 'Pending',
        submissionDate: new Date().toISOString(),
    };

    try {
        await createPendingArtist(newPendingArtist);
        setIsSubmitted(true);
    } catch (error) {
        toast({ title: "Submission Failed", description: "Could not submit your registration. Please try again later.", variant: "destructive" });
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
        setIsSubmitted(false);
        setStep(1);
        form.reset();
    }, 300);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-primary font-bold text-2xl">Register as an Artist</DialogTitle>
          <DialogDescription>
            Join our community of talented artists. Your account will be created upon admin approval.
          </DialogDescription>
        </DialogHeader>
        {isSubmitted ? (
            <div className="space-y-4 py-4">
                 <Alert>
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Registration Submitted!</AlertTitle>
                    <AlertDescription className="space-y-4">
                      <p>Thank you for registering! Your profile is now under review by our admin team and should be approved within 24 hours.</p>
                      <p className="font-semibold">Once approved, you will receive an email to create your password and log in. Please be sure to check your main inbox and your spam/junk folder.</p>
                       <div className="border-t pt-4 mt-4">
                            <h4 className="font-semibold">Questions? Contact Admin</h4>
                            <p className="flex items-center gap-2 mt-1"><Phone className="h-4 w-4"/> {companyProfile.phone} (WhatsApp available)</p>
                            <p className="flex items-center gap-2 mt-1"><Mail className="h-4 w-4"/> {companyProfile.email}</p>
                       </div>
                    </AlertDescription>
                </Alert>
                 <Button onClick={handleClose} className="w-full">Close</Button>
            </div>
        ) : (
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <Progress value={(step / totalSteps) * 100} className="w-full mb-4" />
                <div className="max-h-[60vh] overflow-y-auto pr-4 -mr-4 space-y-6">
                   {isLoadingLocations ? (
                       <Card><CardContent className="p-4">Loading available locations...</CardContent></Card>
                   ) : Object.keys(availableLocations).length === 0 ? (
                        <Alert variant="destructive">
                            <Terminal className="h-4 w-4" />
                            <AlertTitle>Registration Currently Unavailable</AlertTitle>
                            <AlertDescription>We are not currently accepting new artist registrations as no service locations have been configured.</AlertDescription>
                        </Alert>
                   ) : (
                    <>
                      {step === 1 && (
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
                                    <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input type="tel" placeholder="9876543210" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                        </div>
                      )}

                      {step === 2 && (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg text-primary">Step 2: Service Areas & Offerings</h3>
                             <ServiceAreaFields form={form} availableLocations={availableLocations} />
                            <FormField control={form.control} name="services" render={() => (
                                <FormItem><FormLabel>Which services do you offer?</FormLabel><div className="flex items-center gap-4">{serviceItems.map((item) => (<FormField key={item.id} control={form.control} name="services" render={({ field }) => (<FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value?.includes(item.id)} onCheckedChange={(checked) => { return checked ? field.onChange([...(field.value || []), item.id]) : field.onChange((field.value || []).filter((value) => value !== item.id)) }} /></FormControl><FormLabel className="font-normal">{item.label}</FormLabel></FormItem>)} />))}</div><FormMessage /></FormItem>
                            )} />
                        </div>
                      )}

                      {step === 3 && (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg text-primary">Step 3: Verification & Agreement</h3>
                            <Alert>
                                <Terminal className="h-4 w-4" />
                                <AlertTitle>Portfolio Upload</AlertTitle>
                                <AlertDescription>
                                You can upload your portfolio images from your dashboard after your profile is approved.
                                </AlertDescription>
                            </Alert>
                            <FormField control={form.control} name="agreed" render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>I agree to the <a href="/terms" target="_blank" className="underline">Terms & Conditions</a> of UtsavLook.</FormLabel><FormMessage /></div></FormItem>
                            )} />
                        </div>
                      )}
                    </>
                   )}
                </div>
                <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between w-full pt-4">
                  <div>
                    {step > 1 && <Button type="button" variant="outline" onClick={() => setStep(prev => prev - 1)}><ArrowLeft className="mr-2"/> Back</Button>}
                  </div>
                  <div>
                    {step < totalSteps && <Button type="button" onClick={handleNextStep}>Next</Button>}
                    {step === totalSteps && (
                        <Button type="submit" className="bg-accent hover:bg-accent/90" disabled={isLoadingLocations || Object.keys(availableLocations).length === 0 || form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? 'Submitting...' : 'Submit for Review'}
                        </Button>
                    )}
                  </div>
                </DialogFooter>
            </form>
            </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
