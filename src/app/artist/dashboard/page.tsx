
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useArtistPortal } from './layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Briefcase, IndianRupee, Star } from 'lucide-react';
import { listenToCollection } from '@/lib/services';
import type { Booking, Notification } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { getSafeDate } from '@/lib/utils';
import { query, collection, where } from 'firebase/firestore';
import { getDb } from '@/firebase';


function DashboardCard({ title, value, description, icon: Icon, href, className }: { title: string, value: string | number, description: string, icon: React.ElementType, href?: string, className?: string }) {
    const content = (
        <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    );

    return href ? <Link href={href}>{content}</Link> : <>{content}</>;
}


export default function ArtistDashboardPage() {
    const { artist, financialSettings } = useArtistPortal();
    const [bookings, setBookings] = React.useState<Booking[]>([]);
    const [notifications, setNotifications] = React.useState<Notification[]>([]);
    
    React.useEffect(() => {
        if (!artist) return;
        
        const db = getDb();
        const bookingsQuery = query(collection(db, 'bookings'), where('artistIds', 'array-contains', artist.id));
        const unsubBookings = listenToCollection<Booking>('bookings', setBookings, bookingsQuery);

        const unsubNotifs = listenToCollection<Notification>('notifications', (allNotifs) => {
            setNotifications(allNotifs.filter(n => n.artistId === artist.id).sort((a,b) => getSafeDate(b.timestamp).getTime() - getSafeDate(a.timestamp).getTime()));
        });

        return () => {
            unsubBookings();
            unsubNotifs();
        };

    }, [artist]);
    
    if (!artist || !financialSettings) return <div>Loading dashboard...</div>;

    const completedBookings = bookings.filter(b => b.status === 'Completed');
    const totalRevenue = completedBookings.reduce((sum, b) => sum + b.amount / (b.artistIds.length || 1), 0);
    const netPayout = totalRevenue * (1 - (financialSettings.platformFeePercentage / 100));

    const upcomingBookings = bookings.filter(b => b.status === 'Confirmed' && getSafeDate(b.eventDate) >= new Date());
    const pendingBookings = bookings.filter(b => b.status === 'Pending Confirmation');
    

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                 <DashboardCard
                    title="Estimated Net Payout"
                    value={`₹${netPayout.toLocaleString(undefined, {maximumFractionDigits: 0})}`}
                    description="From all completed jobs"
                    icon={IndianRupee}
                    href="/artist/dashboard/payouts"
                />
                 <DashboardCard
                    title="Upcoming Jobs"
                    value={upcomingBookings.length}
                    description="Confirmed and scheduled"
                    icon={Briefcase}
                    href="/artist/dashboard/bookings?tab=upcoming"
                />
                <DashboardCard
                    title="Pending Confirmation"
                    value={pendingBookings.length}
                    description="New requests need your approval"
                    icon={Bell}
                    href="/artist/dashboard/bookings?tab=pending"
                    className={pendingBookings.length > 0 ? "text-destructive" : ""}
                />
                 <DashboardCard
                    title="Overall Rating"
                    value={artist.rating.toFixed(1)}
                    description={`${artist.reviews?.length || 0} total reviews`}
                    icon={Star}
                    href="/artist/dashboard/profile"
                />
            </div>
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle>Upcoming Bookings</CardTitle>
                        <CardDescription>Your next 5 confirmed appointments.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {upcomingBookings.length > 0 ? (
                             <ul className="space-y-3">
                                {upcomingBookings.slice(0,5).map(booking => (
                                    <li key={booking.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                                        <div>
                                            <p className="font-semibold">{booking.customerName} - {booking.eventType}</p>
                                            <p className="text-sm text-muted-foreground">{getSafeDate(booking.eventDate).toLocaleDateString()}</p>
                                        </div>
                                        <Button asChild size="sm" variant="outline"><Link href="/artist/dashboard/bookings">View</Link></Button>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-muted-foreground text-center py-4">No upcoming bookings.</p>}
                    </CardContent>
                </Card>
                 <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Notifications</CardTitle>
                        <CardDescription>Your 5 most recent updates.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {notifications.length > 0 ? (
                            <ul className="space-y-3">
                                {notifications.slice(0,5).map(notif => (
                                    <li key={notif.id} className="flex items-start gap-3 p-2 rounded-md">
                                        <div className={`mt-1 h-2.5 w-2.5 rounded-full ${notif.isRead ? 'bg-muted' : 'bg-primary'}`}/>
                                        <div>
                                            <p className="font-semibold text-sm">{notif.title}</p>
                                            <p className="text-xs text-muted-foreground">{notif.message}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ): <p className="text-muted-foreground text-center py-4">No new notifications.</p>}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
