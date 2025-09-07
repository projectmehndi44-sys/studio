
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Booking, Customer } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut } from 'lucide-react';

export default function AccountPage() {
    const router = useRouter();
    const [customer, setCustomer] = React.useState<Customer | null>(null);
    const [bookings, setBookings] = React.useState<Booking[]>([]);

    React.useEffect(() => {
        const customerId = localStorage.getItem('currentCustomerId');
        if (!customerId) {
            router.push('/');
            return;
        }

        const allCustomers: Customer[] = JSON.parse(localStorage.getItem('customers') || '[]');
        const currentCustomer = allCustomers.find(c => c.id === customerId);
        setCustomer(currentCustomer || null);

        const allBookings: Booking[] = JSON.parse(localStorage.getItem('bookings') || '[]').map((b: any) => ({...b, date: new Date(b.date)}));
        const customerBookings = allBookings.filter(b => b.customerId === customerId);
        setBookings(customerBookings.sort((a,b) => b.date.getTime() - a.date.getTime()));

    }, [router]);
    
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

    return (
        <div className="bg-muted/40 min-h-screen">
            <header className="bg-background border-b p-4 flex justify-between items-center">
                 <h1 className="text-2xl font-bold text-primary">My Account</h1>
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
                    <CardFooter>
                         <Button variant="ghost" onClick={handleLogout}><LogOut className="mr-2 h-4 w-4"/> Logout</Button>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Upcoming Bookings</CardTitle>
                        <CardDescription>These are your future bookings. You will be notified of any status changes.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Service</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {upcomingBookings.length > 0 ? upcomingBookings.map(booking => (
                                    <TableRow key={booking.id}>
                                        <TableCell className="font-medium">{booking.service}</TableCell>
                                        <TableCell>{booking.date.toLocaleDateString()}</TableCell>
                                        <TableCell>₹{booking.amount.toLocaleString()}</TableCell>
                                        <TableCell><Badge variant={getStatusVariant(booking.status)}>{booking.status}</Badge></TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground">You have no upcoming bookings.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Past Bookings</CardTitle>
                        <CardDescription>A history of all your past bookings with us.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Service</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pastBookings.length > 0 ? pastBookings.map(booking => (
                                    <TableRow key={booking.id}>
                                        <TableCell className="font-medium">{booking.service}</TableCell>
                                        <TableCell>{booking.date.toLocaleDateString()}</TableCell>
                                        <TableCell>₹{booking.amount.toLocaleString()}</TableCell>
                                        <TableCell><Badge variant={getStatusVariant(booking.status)}>{booking.status}</Badge></TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground">You have no past bookings.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

            </main>
        </div>
    );
}
