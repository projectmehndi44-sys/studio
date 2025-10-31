'use client'

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Booking } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Calendar, MapPin, Package, Receipt } from "lucide-react";
import { format } from "date-fns";

interface BookingHistoryProps {
    bookings: Booking[];
}

const BookingCard = ({ booking }: { booking: Booking }) => (
    <Card className="mb-4 shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg">
        <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="text-lg text-primary">{booking.eventType}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-accent" />
                        {format(booking.eventDate, 'PPP')}
                    </CardDescription>
                </div>
                <Badge 
                    className={cn(
                        booking.status === 'Completed' && 'bg-green-100 text-green-800 border-green-300',
                        booking.status === 'Confirmed' && 'bg-blue-100 text-blue-800 border-blue-300',
                        booking.status === 'Cancelled' && 'bg-red-100 text-red-800 border-red-300',
                        'dark:text-foreground'
                    )}
                    variant="outline"
                >
                    {booking.status}
                </Badge>
            </div>
        </CardHeader>
        <CardContent>
            <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5 text-accent flex-shrink-0" />
                    <span>{booking.serviceAddress}</span>
                </div>
                 <div className="flex items-start gap-2 text-muted-foreground">
                    <Package className="h-4 w-4 mt-0.5 text-accent flex-shrink-0" />
                    <span>{booking.items.map(i => i.servicePackage.name).join(', ')}</span>
                </div>
            </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
            <span className="text-lg font-bold text-primary">₹{booking.amount.toLocaleString()}</span>
            <Button variant="outline">
                <Receipt className="h-4 w-4 mr-2" />
                View Invoice
            </Button>
        </CardFooter>
    </Card>
);

export const BookingHistory = ({ bookings }: BookingHistoryProps) => {
    const upcomingBookings = bookings.filter(b => b.status === 'Confirmed' || b.status === 'Pending');
    const pastBookings = bookings.filter(b => b.status === 'Completed' || b.status === 'Cancelled');

    return (
        <Card className="shadow-lg rounded-lg h-full">
            <CardHeader>
                <CardTitle>Booking History</CardTitle>
                <CardDescription>Review your upcoming and past appointments.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="upcoming" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-primary/5">
                        <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                        <TabsTrigger value="past">Past</TabsTrigger>
                    </TabsList>
                    <TabsContent value="upcoming" className="mt-4">
                        {upcomingBookings.length > 0 ? (
                            upcomingBookings.map(booking => <BookingCard key={booking.id} booking={booking} />)
                        ) : (
                            <p className="text-muted-foreground text-center py-8">No upcoming bookings.</p>
                        )}
                    </TabsContent>
                    <TabsContent value="past" className="mt-4">
                        {pastBookings.length > 0 ? (
                           pastBookings.map(booking => <BookingCard key={booking.id} booking={booking} />)
                        ) : (
                            <p className="text-muted-foreground text-center py-8">No past bookings.</p>
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
