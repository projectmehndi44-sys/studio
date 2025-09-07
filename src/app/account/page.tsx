

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Booking, Customer } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Briefcase, CalendarCheck2, History } from 'lucide-react';
import { allBookings as initialBookings, initialCustomers } from '@/lib/data';
import { format } from 'date-fns';

export default function AccountPage() {
    const router = useRouter();
    const [customer, setCustomer] = React.useState<Customer | null>(null);
    const [bookings, setBookings] = React.useState<Booking[]>([]);

    const fetchCustomerData = React.useCallback(() => {
        const customerId = localStorage.getItem('currentCustomerId');
        if (!customerId) {
            router.push('/');
            return;
        }

        const allCustomersData = localStorage.getItem('customers');
        const allCustomers: Customer[] = allCustomersData ? JSON.parse(allCustomersData) : initialCustomers;
        const currentCustomer = allCustomers.find(c => c.id === customerId);
        setCustomer(currentCustomer || null);

        const allBookingsData = localStorage.getItem('bookings');
        const allBookings: Booking[] = (allBookingsData ? JSON.parse(allBookingsData) : initialBookings).map((b: any) => ({...b, date: new Date(b.date), serviceDates: b.serviceDates.map((d:string) => new Date(d)) }));
        
        const customerBookings = allBookings.filter(b => b.customerId === customerId);
        setBookings(customerBookings.sort((a,b) => b.date.getTime() - a.date.getTime()));
    }, [router]);
    
    React.useEffect(() => {
        fetchCustomerData();
        window.addEventListener('storage', fetchCustomerData);
        return () => window.removeEventListener('storage', fetchCustomerData);
    }, [fetchCustomerData]);
    
    const handleLogout = () => {
        localStorage.removeItem('currentCustomerId');
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

    if (!customer) {
        return <div className="flex items-center justify-center min-h-screen">Loading your account...</div>;
    }

    const upcomingBookings = bookings.filter(b => new Date(b.date) >= new Date() && (b.status === 'Confirmed' || b.status === 'Pending Approval' || b.status === 'Needs Assignment'));
    const pastBookings = bookings.filter(b => new Date(b.date) < new Date() || b.status === 'Completed' || b.status === 'Cancelled' || b.status === 'Disputed');

    const renderBookingTable = (bookingsToShow: Booking[]) => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Service Dates</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {bookingsToShow.length > 0 ? bookingsToShow.map(booking => (
                    <TableRow key={booking.id}>
                        <TableCell className="font-medium">{booking.service}</TableCell>
                        <TableCell>
                            <div className="flex flex-col gap-1">
                                {booking.serviceDates.map((date, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                        {format(date, "PPP")}
                                    </Badge>
                                ))}
                            </div>
                        </TableCell>
                        <TableCell>₹{booking.amount.toLocaleString(undefined, {maximumFractionDigits: 0})}</TableCell>
                        <TableCell><Badge variant={getStatusVariant(booking.status)}>{booking.status}</Badge></TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">You have no bookings in this category.</TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );

    return (
        <div className="bg-muted/40 min-h-screen">
            <header className="bg-background border-b p-4 flex justify-between items-center">
                 <h1 className="text-2xl font-bold text-primary">My Dashboard</h1>
                 <Button variant="outline" onClick={() => router.push('/')}>Back to Home</Button>
            </header>
            <main className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
                 <Card>
                    <CardHeader className="flex flex-row items-center gap-4">
                         <Avatar className="h-16 w-16">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${customer.name}`} />
                            <AvatarFallback>{customer.name ? customer.name.charAt(0).toUpperCase() : 'C'}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-2xl">{customer.name}</CardTitle>
                            <CardDescription>{customer.email || customer.phone}</CardDescription>
                        </div>
                    </CardHeader>
                    <CardFooter className="flex justify-between items-center">
                        <div className="flex gap-4">
                            <div className="flex items-center text-sm text-muted-foreground"><CalendarCheck2 className="mr-2 h-4 w-4 text-green-500" /> <span>{upcomingBookings.length} Upcoming Bookings</span></div>
                            <div className="flex items-center text-sm text-muted-foreground"><History className="mr-2 h-4 w-4 text-blue-500" /> <span>{pastBookings.length} Past Bookings</span></div>
                             <div className="flex items-center text-sm text-muted-foreground"><Briefcase className="mr-2 h-4 w-4 text-purple-500" /> <span>{bookings.length} Total Bookings</span></div>
                        </div>
                         <Button variant="ghost" onClick={handleLogout}><LogOut className="mr-2 h-4 w-4"/> Logout</Button>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Upcoming Bookings</CardTitle>
                        <CardDescription>These are your future bookings. You will be notified of any status changes.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         {renderBookingTable(upcomingBookings)}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Past Bookings</CardTitle>
                        <CardDescription>A history of all your past bookings with us.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {renderBookingTable(pastBookings)}
                    </CardContent>
                </Card>

            </main>
        </div>
    );
}
