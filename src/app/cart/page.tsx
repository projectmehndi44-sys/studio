'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { BookingForm, bookingFormSchema, BookingFormValues } from "@/components/cart/booking-form";
import { CartItemsList } from "@/components/cart/cart-items-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { CartItem, Customer, Artist, Promotion, TeamMember, Booking } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getCustomer, getAvailableLocations, listenToCollection, getPromotions, getTeamMembers, updateCustomer } from '@/lib/services';
import { Timestamp, RecaptchaVerifier, signInWithPhoneNumber, PhoneAuthProvider } from 'firebase/firestore';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { IndianRupee, ShieldCheck, Info, AlertCircle, CheckCircle, X, Tag, Home, Loader2, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useAuth, useUser } from '@/firebase';
import { callFirebaseFunction } from '@/lib/firebase';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
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


const OrderSummary = ({
  items,
  form,
  onConfirm,
  artists,
  isProcessing,
}: {
  items: CartItem[],
  form: any,
  onConfirm: (paymentMethod: 'online' | 'offline', finalAmount: number, appliedCode?: string) => void,
  artists: Artist[],
  isProcessing: boolean,
}) => {
    const [promoCode, setPromoCode] = React.useState('');
    const [appliedDiscount, setAppliedDiscount] = React.useState<{ type: 'artist' | 'admin', discount: number, code: string, artist?: Artist } | null>(null);
    const [promoError, setPromoError] = React.useState('');
    const [adminPromos, setAdminPromos] = React.useState<Promotion[]>([]);

    React.useEffect(() => {
        getPromotions().then(setAdminPromos);
    }, []);

    const baseTotalAmount = items.reduce((sum, item) => sum + item.price, 0);

    const handleApplyCode = () => {
        setPromoError('');
        if (!promoCode) return;

        const code = promoCode.toUpperCase();
        
        const matchedArtist = artists.find(a => a.referralCode?.toUpperCase() === code);
        if (matchedArtist) {
            setAppliedDiscount({
                type: 'artist',
                discount: matchedArtist.referralDiscount || 10,
                code: matchedArtist.referralCode!,
                artist: matchedArtist,
            });
            if(items[0] && items[0].artist?.id !== matchedArtist.id) {
                items[0].artist = matchedArtist;
            }
            return;
        }

        const matchedAdminPromo = adminPromos.find(p => p.code.toUpperCase() === code);
        if (matchedAdminPromo && matchedAdminPromo.isActive) {
             if (matchedAdminPromo.expiryDate && new Date(matchedAdminPromo.expiryDate) < new Date()) {
                setPromoError("This promotion has expired.");
                return;
            }
            setAppliedDiscount({
                type: 'admin',
                discount: matchedAdminPromo.discount,
                code: matchedAdminPromo.code
            });
            return;
        }

        setPromoError("Invalid or expired code.");
    };
    
    const handleRemoveCode = () => {
        setAppliedDiscount(null);
        setPromoCode('');
        setPromoError('');
    }

    const discountedTotal = appliedDiscount 
        ? baseTotalAmount * (1 - (appliedDiscount.discount / 100))
        : baseTotalAmount;
        
    const taxableAmount = discountedTotal / 1.18;
    const gstAmount = discountedTotal - taxableAmount;
    const advanceAmount = discountedTotal * 0.6;


    return (
        <Card className="shadow-lg rounded-lg sticky top-24">
            <CardHeader>
                <CardTitle className="text-2xl">Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="promo-code">Referral / Discount Code</Label>
                    <div className="flex gap-2">
                        <Input
                            id="promo-code"
                            placeholder="Enter Code"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value)}
                            disabled={!!appliedDiscount || isProcessing}
                        />
                         {appliedDiscount ? (
                            <Button variant="ghost" size="icon" onClick={handleRemoveCode} disabled={isProcessing}>
                                <X className="h-4 w-4 text-red-500" />
                            </Button>
                        ) : (
                            <Button onClick={handleApplyCode} variant="secondary" disabled={isProcessing}>Apply</Button>
                        )}
                    </div>
                     {promoError && <p className="text-sm text-destructive">{promoError}</p>}
                     {appliedDiscount && (
                        <Alert variant="default" className="bg-green-100 border-green-300 text-green-800 [&>svg]:text-green-800">
                             <Tag className="h-4 w-4" />
                            <AlertTitle className="font-semibold">Code Applied!</AlertTitle>
                            <AlertDescription>
                                You've saved {appliedDiscount.discount}% with code {appliedDiscount.code}.
                                {appliedDiscount.type === 'artist' && ` You'll be booked with ${appliedDiscount.artist?.name}.`}
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
                 <Separator />
                <div className="flex justify-between text-muted-foreground">
                    <span>Base Total</span>
                    <span>₹{baseTotalAmount.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                </div>
                 {appliedDiscount && (
                    <div className="flex justify-between text-green-600 font-medium">
                        <span>Discount ({appliedDiscount.discount}%)</span>
                        <span>- ₹{(baseTotalAmount - discountedTotal).toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                    </div>
                 )}
                 <Separator />
                <div className="flex justify-between font-bold text-xl text-primary">
                    <span>Final Amount</span>
                    <span>₹{discountedTotal.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                </div>
                <div className="text-xs space-y-1 text-muted-foreground">
                    <div className="flex justify-between">
                        <span>Taxable Amount (pre-GST)</span>
                        <span>₹{taxableAmount.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                    </div>
                     <div className="flex justify-between">
                        <span>GST (18% included)</span>
                        <span>₹{gstAmount.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                    </div>
                </div>
                 <Alert className="bg-blue-100 border-blue-300 text-blue-800 [&>svg]:text-blue-800">
                    <Info className="h-4 w-4" />
                    <AlertTitle className="font-semibold">Travel Charges</AlertTitle>
                    <AlertDescription>
                        A travel charge may be applicable and is payable directly to the artist at the venue. This will be communicated by the artist after booking.
                    </AlertDescription>
                </Alert>
                <Separator/>
                <div className="space-y-4">
                     <Alert className="bg-green-100 border-green-300 text-green-800 [&>svg]:text-green-800">
                        <CheckCircle className="h-4 w-4" />
                        <AlertTitle className="font-semibold">Confirmation Policy</AlertTitle>
                        <AlertDescription>
                           Bookings are accepted on a first-come, first-served basis. Pay an advance to confirm your slot instantly. Unpaid bookings will be confirmed only after a phone consultation.
                        </AlertDescription>
                    </Alert>
                     <Alert variant="destructive" className="bg-red-100 border-red-300 text-red-800 [&>svg]:text-red-800">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle className="font-semibold">Refund Policy</AlertTitle>
                        <AlertDescription>
                           Advance payment is only refunded if cancelled 72 hours before the event (cancellation charges apply). This is because dates will be exclusively reserved for you.
                        </AlertDescription>
                    </Alert>

                    <Button size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => onConfirm('online', discountedTotal, appliedDiscount?.code)} disabled={isProcessing}>
                       {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                       Pay 60% Advance & Confirm (₹{advanceAmount.toLocaleString(undefined, {maximumFractionDigits: 0})})
                    </Button>
                    <Button size="lg" variant="outline" className="w-full" onClick={() => onConfirm('offline', discountedTotal, appliedDiscount?.code)} disabled={isProcessing}>
                       {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                       Pay at Venue (Requires Phone Confirmation)
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

const PhoneVerification = ({ onVerified }: { onVerified: (phone: string) => void }) => {
    const { user } = useUser();
    const auth = useAuth();
    const { toast } = useToast();
    const [step, setStep] = React.useState<'phone' | 'otp'>('phone');
    const [confirmationResult, setConfirmationResult] = React.useState<any>(null);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const phoneForm = useForm<z.infer<typeof phoneSchema>>({ resolver: zodResolver(phoneSchema) });
    const otpForm = useForm<z.infer<typeof otpSchema>>({ resolver: zodResolver(otpSchema) });

    const setupRecaptcha = () => {
        if (!(window as any).recaptchaVerifier) {
            (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
        }
    };

    const onPhoneSubmit: SubmitHandler<z.infer<typeof phoneSchema>> = async (data) => {
        setIsSubmitting(true);
        setupRecaptcha();
        const appVerifier = (window as any).recaptchaVerifier;
        const fullPhoneNumber = `+91${data.phone}`;
        try {
            const provider = new PhoneAuthProvider(auth);
            const verificationId = await provider.verifyPhoneNumber(fullPhoneNumber, appVerifier);
            setConfirmationResult({ verificationId, phoneNumber: data.phone });
            setStep('otp');
            toast({ title: 'OTP Sent!', description: `An OTP has been sent to ${fullPhoneNumber}.` });
        } catch (error: any) {
            toast({ title: "Failed to send OTP", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const onOtpSubmit: SubmitHandler<z.infer<typeof otpSchema>> = async (data) => {
        setIsSubmitting(true);
        try {
             // This flow is for linking, not signing in. We just need to verify the number.
             // As we are already logged in, we update the customer profile directly
             // This is a simplified approach. A real app might use a Cloud Function to securely link credentials.
            if (user) {
                await updateCustomer(user.uid, { phone: confirmationResult.phoneNumber });
                onVerified(confirmationResult.phoneNumber);
            }
        } catch (error: any) {
            toast({ title: 'OTP Verification Failed', description: 'The OTP you entered is incorrect.', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="shadow-lg rounded-lg">
            <CardHeader>
                <CardTitle>Verify Your Phone Number</CardTitle>
                <CardDescription>To complete your booking, please verify your phone number.</CardDescription>
            </CardHeader>
            <CardContent>
                {step === 'phone' ? (
                    <Form {...phoneForm}>
                        <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4">
                            <FormField control={phoneForm.control} name="phone" render={({ field }) => (
                                <FormItem><div className="flex items-center"><span className="p-2 border rounded-l-md bg-muted">+91</span><FormControl><Input type="tel" placeholder="10-digit number" {...field} className="rounded-l-none" /></FormControl></div><FormMessage /></FormItem>
                            )} />
                            <Button type="submit" disabled={isSubmitting} className="w-full">
                                {isSubmitting ? 'Sending...' : 'Send OTP'}
                            </Button>
                        </form>
                    </Form>
                ) : (
                    <Form {...otpForm}>
                        <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-4">
                             <FormField control={otpForm.control} name="otp" render={({ field }) => (
                                <FormItem>
                                    <div className="flex justify-center">
                                      <InputOTP maxLength={6} {...field}><InputOTPGroup><InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} /><InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} /></InputOTPGroup></InputOTP>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <Button type="submit" disabled={isSubmitting} className="w-full">
                                {isSubmitting ? 'Verifying...' : 'Verify Number'}
                            </Button>
                        </form>
                    </Form>
                )}
            </CardContent>
        </Card>
    );
};


export default function CartPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useUser();
    const [cartItems, setCartItems] = React.useState<CartItem[]>([]);
    const [customer, setCustomer] = React.useState<Customer | null>(null);
    const [availableLocations, setAvailableLocations] = React.useState<Record<string, string[]>>({});
    const [artists, setArtists] = React.useState<Artist[]>([]);
    const [teamMembers, setTeamMembers] = React.useState<TeamMember[]>([]);
    const [isProcessing, setIsProcessing] = React.useState(false);
    const [needsPhoneVerification, setNeedsPhoneVerification] = React.useState(false);


    const form = useForm<BookingFormValues>({
        resolver: zodResolver(bookingFormSchema),
        defaultValues: {
            name: '',
            contact: '',
            eventType: '',
            eventDate: new Date(),
            serviceDates: [],
            state: '',
            district: '',
            locality: '',
            address: '',
            mapLink: '',
            alternateContact: '',
            notes: '',
            guestMehndi: { included: false, expectedCount: 0},
            guestMakeup: { included: false, expectedCount: 0},
        }
    });

    React.useEffect(() => {
        if (user) {
            getCustomer(user.uid).then(customerData => {
                if (customerData) {
                    setCustomer(customerData);
                    const storedCart = localStorage.getItem(`cart_${user.uid}`);
                    setCartItems(storedCart ? JSON.parse(storedCart) : []);

                    if (!customerData.phone) {
                        setNeedsPhoneVerification(true);
                    }
                    
                    form.reset({
                        ...form.getValues(),
                        name: customerData.name || '',
                        contact: customerData.phone || '',
                    });
                }
            });
        } else {
            const tempCartItem = localStorage.getItem('tempCartItem');
            if (tempCartItem) {
                router.push('/login');
            }
        }
        
        getAvailableLocations().then(setAvailableLocations);
        getTeamMembers().then(setTeamMembers);

        const unsubscribeArtists = listenToCollection<Artist>('artists', setArtists);
        return () => unsubscribeArtists();

    }, [router, form, user]);

    const handlePhoneVerified = (phone: string) => {
        setNeedsPhoneVerification(false);
        form.setValue('contact', phone);
        if (customer) {
            setCustomer({ ...customer, phone });
        }
        toast({ title: "Phone Verified!", description: "You can now proceed with your booking." });
    };

    const handleRemoveItem = (itemId: string) => {
        const newCart = cartItems.filter(item => item.id !== itemId);
        setCartItems(newCart);
        if (customer) {
            localStorage.setItem(`cart_${customer.id}`, JSON.stringify(newCart));
        }
        toast({
            title: "Item removed",
            description: "The service has been removed from your cart.",
            variant: "destructive"
        });
    };

    const handleConfirmAndBook = async (paymentMethod: 'online' | 'offline', finalAmount: number, appliedCode?: string) => {
        setIsProcessing(true);
        const bookingDetails = form.getValues();
        const isValid = await form.trigger();

        if (needsPhoneVerification) {
            toast({
                title: "Phone Verification Required",
                description: "Please verify your phone number to continue.",
                variant: "destructive"
            });
            setIsProcessing(false);
            return;
        }

        if (!isValid) {
            toast({
                title: "Incomplete Details",
                description: "Please fill out all the required booking details before proceeding.",
                variant: "destructive"
            });
            setIsProcessing(false);
            return;
        }

        if (cartItems.length === 0 || !customer) {
            toast({
                title: "Your cart is empty!",
                description: "Please add services to your cart before booking.",
                variant: "destructive"
            });
             setIsProcessing(false);
            return;
        }

        const bookingData = {
            customerId: customer.id,
            customerName: bookingDetails.name,
            customerContact: bookingDetails.contact,
            alternateContact: bookingDetails.alternateContact,
            items: cartItems,
            amount: finalAmount,
            eventType: bookingDetails.eventType,
            eventDate: Timestamp.fromDate(bookingDetails.eventDate),
            serviceDates: bookingDetails.serviceDates.map(d => Timestamp.fromDate(d)),
            serviceAddress: bookingDetails.address,
            state: bookingDetails.state,
            district: bookingDetails.district,
            locality: bookingDetails.locality,
            mapLink: bookingDetails.mapLink,
            note: bookingDetails.notes,
            paymentMethod: paymentMethod,
            appliedReferralCode: appliedCode,
            guestMehndi: bookingDetails.guestMehndi,
            guestMakeup: bookingDetails.guestMakeup,
        };

        const result: any = await callFirebaseFunction('createBooking', { bookingData });

        if (result.data.success) {
            const successMessage = paymentMethod === 'online'
                ? "Your booking request has been sent for approval."
                : "Your booking request has been sent. Our team will call you shortly to confirm.";
            toast({
                title: "Booking Request Sent!",
                description: successMessage,
            });
            localStorage.removeItem(`cart_${customer.id}`);
            router.push('/account/bookings');
        } else {
             toast({
                title: "Booking Failed",
                description: result.data.message || "There was an error placing your booking. Please try again.",
                variant: "destructive"
            });
        }
        
        setIsProcessing(false);
    };
    
    const showGuestFields = {
        mehndi: cartItems.some(item => item.servicePackage.service === 'mehndi'),
        makeup: cartItems.some(item => item.servicePackage.service === 'makeup'),
    }

    return (
        <div className="bg-background">
             <div id="recaptcha-container" style={{ position: 'fixed', bottom: 0, right: 0, zIndex: -1, opacity: 0 }}></div>
            <div className="container mx-auto px-4 py-12">
                 <div className="flex justify-between items-center mb-4">
                    <Button onClick={() => router.back()} variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4"/> Back
                    </Button>
                    <h1 className="font-headline text-5xl md:text-7xl text-primary text-center">
                        My Cart
                    </h1>
                     <Button asChild variant="outline">
                        <Link href="/"><Home className="mr-2 h-4 w-4"/> Back to Home</Link>
                    </Button>
                </div>
                <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
                    Finalize your service selections and provide booking details to confirm your appointments.
                </p>

                {cartItems.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        <div className="lg:col-span-2 space-y-8">
                            <CartItemsList items={cartItems} onRemoveItem={handleRemoveItem} />
                            {needsPhoneVerification ? (
                                <PhoneVerification onVerified={handlePhoneVerified} />
                            ) : (
                                <BookingForm form={form} availableLocations={availableLocations} showGuestFields={showGuestFields} artists={artists} />
                            )}
                        </div>
                        <div className="lg:col-span-1">
                           <OrderSummary items={cartItems} form={form} onConfirm={handleConfirmAndBook} artists={artists} isProcessing={isProcessing}/>
                        </div>
                    </div>
                ) : (
                    <Card className="text-center py-20">
                        <CardContent>
                            <h2 className="text-2xl font-semibold mb-2">Your Cart is Empty</h2>
                            <p className="text-muted-foreground mb-6">Looks like you haven't added any services yet.</p>
                            <Button asChild>
                                <a href="/#services">Browse Services</a>
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
