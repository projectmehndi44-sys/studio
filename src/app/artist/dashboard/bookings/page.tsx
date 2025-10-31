

'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Booking } from '@/lib/types';
import { useArtistPortal } from '../layout';
import { MapPin, User, Calendar, IndianRupee, FileText, Check, AlertTriangle, Clock, FilePlus2, Receipt, Trash2 } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateBooking, getFinancialSettings } from '@/lib/services';
import { Timestamp } from 'firebase/firestore';
import { BookingDetailsModal } from '@/components/utsavlook/BookingDetailsModal';
import { generateArtistInvoice } from '@/lib/export';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';


function getSafeDate(date: any): Date {
    if (!date) return new Date();
    if (date instanceof Date && isValid(date)) return date;
    if (date instanceof Timestamp) return date.toDate();
    if (typeof date === 'string') {
        const parsed = parseISO(date);
        if (isValid(parsed)) return parsed;
    }
    return new Date();
}

const finalInvoiceSchema = z.object({
  additionalCharges: z.array(z.object({
    description: z.string().min(1, "Description is required"),
    amount: z.coerce.number().min(0, "Amount must be positive"),
  })),
  completionCode: z.string().length(6, "Code must be 6 digits"),
});
type FinalInvoiceFormValues = z.infer<typeof finalInvoiceSchema>;


export default function ArtistBookingsPage() {
    const { artistBookings, fetchData } = useArtistPortal();
    const { toast } = useToast();
    
    // State for the modals
    const [isCompletionModalOpen, setIsCompletionModalOpen] = React.useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = React.useState(false);
    const [selectedBooking, setSelectedBooking] = React.useState<Booking | null>(null);
    const [platformFee, setPlatformFee] = React.useState(0.1);

    const form = useForm<FinalInvoiceFormValues>({
        resolver: zodResolver(finalInvoiceSchema),
        defaultValues: { additionalCharges: [], completionCode: '' },
    });
    const { fields, append, remove } = useFieldArray({ control: form.control, name: "additionalCharges" });

    React.useEffect(() => {
        getFinancialSettings().then(settings => {
            setPlatformFee(settings.platformFeePercentage / 100);
        });
    }, []);

    const openCompletionModal = (booking: Booking) => {
        setSelectedBooking(booking);
        form.reset({ additionalCharges: [], completionCode: '' });
        setIsCompletionModalOpen(true);
    };

    const handleStatusUpdate = async (data: FinalInvoiceFormValues) => {
        if (!selectedBooking) return;
        
        if (selectedBooking.completionCode !== data.completionCode) {
            toast({
                title: "Invalid Code",
                description: "The completion code is incorrect. Please check with the customer.",
                variant: "destructive"
            });
            return;
        }

        const additionalChargesTotal = data.additionalCharges.reduce((sum, charge) => sum + charge.amount, 0);
        const finalAmount = selectedBooking.amount + additionalChargesTotal;

        await updateBooking(selectedBooking.id, { 
            status: 'Completed',
            finalAmount: finalAmount,
            additionalCharges: data.additionalCharges,
        });

        generateArtistInvoice(selectedBooking, data.additionalCharges);

        await fetchData(); // Refetch data
        
        toast({
            title: "Booking Completed!",
            description: `Final invoice for ${selectedBooking.customerName} has been downloaded.`
        });

        setIsCompletionModalOpen(false);
        setSelectedBooking(null);
        form.reset();
    }

    const openDetailsModal = (booking: Booking) => {
        setSelectedBooking(booking);
        setIsDetailsModalOpen(true);
    }

    const getStatusInfo = (status: Booking['status']) => {
        switch (status) {
            case 'Completed': return { variant: 'default', icon: <Check className="w-4 h-4"/>, text: 'Completed' };
            case 'Confirmed': return { variant: 'secondary', icon: <Check className="w-4 h-4 text-green-600"/>, text: 'Confirmed' };
            case 'Pending Approval': return { variant: 'outline', icon: <Clock className="w-4 h-4"/>, text: 'Pending Approval' };
            case 'Cancelled': return { variant: 'destructive', icon: <AlertTriangle className="w-4 h-4"/>, text: 'Cancelled' };
            case 'Disputed': return { variant: 'destructive', icon: <AlertTriangle className="w-4 h-4"/>, text: 'Disputed' };
            default: return { variant: 'outline', icon: <Clock className="w-4 h-4"/>, text: status };
        }
    };

    if (!artistBookings) {
        return <Card><CardContent><p>Loading bookings...</p></CardContent></Card>
    }

    return (
        <>
        <Card>
            <CardHeader>
                <CardTitle>Your Bookings</CardTitle>
                <CardDescription>Manage your upcoming and past bookings. Use the customer's unique completion code to mark bookings as 'Completed' and request your payout.</CardDescription>
            </CardHeader>
            <CardContent>
                {artistBookings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {artistBookings.map(booking => {
                            const statusInfo = getStatusInfo(booking.status);
                             return (
                                <Card key={booking.id} className="flex flex-col">
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-lg">{booking.customerName}</CardTitle>
                                                <CardDescription>For: {booking.eventType}</CardDescription>
                                            </div>
                                            <Badge variant={statusInfo.variant} className="gap-1 pl-2">
                                                {statusInfo.icon}
                                                {statusInfo.text}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-grow">
                                        <div className="text-sm space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-muted-foreground"/>
                                                <span>{format(getSafeDate(booking.serviceDates[0]), "PPP")} {booking.serviceDates.length > 1 ? `(+${booking.serviceDates.length - 1} more)` : ''}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-muted-foreground"/>
                                                <span>{booking.locality}, {booking.district}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex flex-col sm:flex-row gap-2">
                                        <Button variant="outline" className="w-full" onClick={() => openDetailsModal(booking)}>
                                            <FileText className="w-4 h-4 mr-2"/>
                                            View Details
                                        </Button>
                                        {booking.status === 'Confirmed' && (
                                            <Button className="w-full" onClick={() => openCompletionModal(booking)}>
                                                <Receipt className="w-4 h-4 mr-2" />
                                                Complete & Invoice
                                            </Button>
                                        )}
                                    </CardFooter>
                                </Card>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <p className="text-lg text-muted-foreground">You have no bookings yet.</p>
                    </div>
                )}
            </CardContent>
        </Card>
        
        {/* Completion & Final Invoice Modal */}
        <AlertDialog open={isCompletionModalOpen} onOpenChange={setIsCompletionModalOpen}>
            <AlertDialogContent className="sm:max-w-md">
                <Form {...form}>
                <form onSubmit={form.handleSubmit(handleStatusUpdate)}>
                <AlertDialogHeader>
                    <AlertDialogTitle>Final Invoice & Completion</AlertDialogTitle>
                    <AlertDialogDescription>
                       Add any extra charges (e.g., travel, guest services). This will generate a final invoice for the customer. Then, enter the customer's completion code.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4 space-y-4">
                     <div>
                        <Label>Additional Charges</Label>
                        <div className="space-y-2 mt-2">
                            {fields.map((field, index) => (
                                <div key={field.id} className="flex gap-2 items-center">
                                    <FormField control={form.control} name={`additionalCharges.${index}.description`} render={({ field }) => <Input placeholder="e.g. Travel" {...field}/>} />
                                    <FormField control={form.control} name={`additionalCharges.${index}.amount`} render={({ field }) => <Input type="number" placeholder="Amount" className="w-28" {...field}/>} />
                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}> <span className="sr-only">Remove</span> <Trash2 className="w-4 h-4 text-destructive"/> </Button>
                                </div>
                            ))}
                        </div>
                        <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => append({ description: '', amount: 0 })}>
                            <FilePlus2 className="mr-2 h-4 w-4"/> Add Line Item
                        </Button>
                     </div>
                     <Separator />
                    <div>
                        <Label htmlFor="completion-code">Customer's Completion Code</Label>
                        <FormField control={form.control} name="completionCode" render={({ field }) => (
                           <Input id="completion-code" placeholder="e.g., 123456" maxLength={6} {...field} />
                        )}/>
                        <FormMessage>{form.formState.errors.completionCode?.message}</FormMessage>
                    </div>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction type="submit">Complete & Download Invoice</AlertDialogAction>
                </AlertDialogFooter>
                </form>
                </Form>
            </AlertDialogContent>
        </AlertDialog>

        {/* Details Modal */}
        <BookingDetailsModal
            booking={selectedBooking}
            isOpen={isDetailsModalOpen}
            onOpenChange={setIsDetailsModalOpen}
            platformFeePercentage={platformFee}
        />

        </>
    );
}
