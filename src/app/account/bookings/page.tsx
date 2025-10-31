
'use client';

import * as React from 'react';
import { useUser } from '@/firebase';
import { listenToCollection, getCustomer } from '@/lib/services';
import type { Booking, Customer } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Loader2, Briefcase, IndianRupee, Calendar, MapPin, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/utsavlook/Header';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { getSafeDate } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from '@/components/ui/separator';
import { db } from '@/firebase';
import { query, collection, where } from 'firebase/firestore';

export default function MyBookingsPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const auth = useAuth();
    const { toast } = useToast();

    const [bookings, setBookings] = React.useState<Booking[]>([]);
    const [customer, setCustomer] = React.useState<Customer | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        if (isUserLoading) return;
        
        if (user) {
            getCustomer(user.uid).then(setCustomer);

            const bookingsQuery = query(collection(db, 'bookings'), where('customerId', '==', user.uid));
            
            const unsub = listenToCollection<Booking>('bookings', (userBookings) => {
                setBookings(userBookings.sort((a, b) => getSafeDate(b.eventDate).getTime() - getSafeDate(a.eventDate).getTime()));
                setIsLoading(false);
            }, bookingsQuery);

            return () => unsub();
        } else {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

    const handleLogout = () => {
        signOut(auth);
        toast({ title: 'Logged Out' });
        router.push('/');
    };
    
    const getStatusVariant = (status: Booking['status']) => {
        switch (status) {
            case 'Completed': return 'default';
            case 'Confirmed': return 'secondary';
            case 'Pending Approval': return 'outline';
            case 'Needs Assignment': return 'outline';
            case 'Cancelled': return 'destructive';
            case 'Disputed': return 'destructive';
            default: return 'outline';
        }
    };

    const upcomingBookings = bookings.filter(b => getSafeDate(b.eventDate) >= new Date() && b.status !== 'Cancelled' && b.status !== 'Completed');
    const pastBookings = bookings.filter(b => getSafeDate(b.eventDate) < new Date() || b.status === 'Cancelled' || b.status === 'Completed');

    const BookingCard = ({ booking }: { booking: Booking }) => (
        <Card>
            <CardHeader>
                 <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-xl">{booking.eventType}</CardTitle>
                        <CardDescription>Booking ID: #{booking.id.substring(0, 7)}</CardDescription>
                    </div>
                    <Badge variant={getStatusVariant(booking.status)}>{booking.status}</Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground"/>
                        <span>{getSafeDate(booking.eventDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground"/>
                        <span>{booking.serviceAddress}</span>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                        {booking.items.map(item => (
                            <div key={item.id} className="flex justify-between">
                                <span>{item.servicePackage.name} ({item.selectedTier.name})</span>
                                <span className="font-semibold">₹{item.price.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                        <span>Total Amount</span>
                        <span>₹{booking.amount.toLocaleString()}</span>
                    </div>
                </div>
                 <Accordion type="single" collapsible className="w-full mt-4">
                    <AccordionItem value="item-1">
                        <AccordionTrigger>View More Details</AccordionTrigger>
                        <AccordionContent className="space-y-2 text-sm text-muted-foreground">
                            <p><strong>Artist(s):</strong> {booking.artistIds?.join(', ') || 'To be assigned'}</p>
                            <p><strong>Service Dates:</strong> {booking.serviceDates.map(d => getSafeDate(d).toLocaleDateString()).join(', ')}</p>
                            {booking.note && <p><strong>Notes:</strong> {booking.note}</p>}
                             {booking.completionCode && (
                                <div className="pt-2 text-center font-mono text-primary border-t mt-2">
                                    <p className="font-semibold">Your Completion Code:</p>
                                    <p className="text-2xl font-bold tracking-widest bg-muted p-2 rounded-md">{booking.completionCode}</p>
                                    <p className="text-xs mt-1">Share this code with your artist only after the service is completed to your satisfaction.</p>
                                </div>
                            )}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </CardContent>
        </Card>
    );

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
             <Header
                isCustomerLoggedIn={!!user}
                onCustomerLogout={handleLogout}
                customer={customer}
                cartCount={0} // This can be dynamic in a real app
            />
            <main className="flex-1 py-8">
                 <div className="container mx-auto px-4 md:px-6">
                    <div className="flex items-center gap-4 mb-8">
                        <Button variant="outline" size="icon" onClick={() => router.push('/account')}><ArrowLeft className="h-4 w-4" /></Button>
                        <h1 className="text-3xl font-bold font-headline text-primary">My Bookings</h1>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center items-center py-20"><Loader2 className="w-8 h-8 animate-spin" /></div>
                    ) : bookings.length === 0 ? (
                        <Card className="text-center py-20">
                            <CardHeader>
                                <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
                                <CardTitle className="mt-4">No Bookings Yet</CardTitle>
                                <CardDescription>You haven't made any bookings. Let's find your perfect look!</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button asChild><a href="/#services">Browse Services</a></Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-2xl font-semibold mb-4">Upcoming Bookings</h2>
                                {upcomingBookings.length > 0 ? (
                                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                        {upcomingBookings.map(b => <BookingCard key={b.id} booking={b} />)}
                                    </div>
                                ) : <p className="text-muted-foreground">No upcoming bookings.</p>}
                            </div>
                            <div>
                                <h2 className="text-2xl font-semibold mb-4">Past Bookings</h2>
                                 {pastBookings.length > 0 ? (
                                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                        {pastBookings.map(b => <BookingCard key={b.id} booking={b} />)}
                                    </div>
                                ) : <p className="text-muted-foreground">No past bookings.</p>}
                            </div>
                        </div>
                    )}
                 </div>
            </main>
        </div>
    );
}
