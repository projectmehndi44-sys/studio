
'use client';

import * as React from 'react';
import type { Booking, Notification } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface NotificationCardProps {
    notification: Notification;
    allBookings: Booking[];
    onMarkAsRead: (id: string) => void;
}

function NotificationCard({ notification, allBookings, onMarkAsRead }: NotificationCardProps) {
    const booking = allBookings.find(b => b.id === notification.bookingId);
    
    return (
        <div 
            onClick={() => !notification.isRead && onMarkAsRead(notification.id)}
            className={`p-4 rounded-lg border-l-4 transition-colors ${notification.isRead ? 'bg-muted/50 border-transparent' : 'bg-primary/10 border-primary cursor-pointer hover:bg-primary/20'}`}>
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-bold">{notification.title}</h4>
                    <p className="text-sm">{notification.message}</p>
                     {booking && (
                        <Card className="mt-2 text-xs text-muted-foreground p-2 bg-background/50">
                            <p><strong>Customer:</strong> {booking.customerName}</p>
                            <p><strong>Service:</strong> {booking.service}</p>
                            <p><strong>Date:</strong> {new Date(booking.date).toLocaleDateString()}</p>
                            <p><strong>Address:</strong> {booking.serviceAddress}</p>
                        </Card>
                    )}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(notification.timestamp).toLocaleString()}</span>
            </div>
        </div>
    )
}

interface ArtistNotificationsPageProps {
    notifications: Notification[];
    setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
    artistId: string;
    setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
}

export default function ArtistNotificationsPage({ notifications, setNotifications, artistId, setUnreadCount }: ArtistNotificationsPageProps) {
    
    const [allBookings, setAllBookings] = React.useState<Booking[]>([]);

    React.useEffect(() => {
        const storedBookings: Booking[] = JSON.parse(localStorage.getItem('bookings') || '[]').map((b: any) => ({...b, date: new Date(b.date)}));
        setAllBookings(storedBookings);
    }, []);

    if (!notifications || !allBookings) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Notifications</CardTitle>
                    <CardDescription>Updates about your bookings and account.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Loading notifications...</p>
                </CardContent>
            </Card>
        )
    }
    
    const updateNotifications = (updated: Notification[]) => {
        const allNotifications: Notification[] = JSON.parse(localStorage.getItem('notifications') || '[]');
        const otherArtistsNotifications = allNotifications.filter(n => n.artistId !== artistId);
        localStorage.setItem('notifications', JSON.stringify([...updated, ...otherArtistsNotifications]));

        setNotifications(updated);
        setUnreadCount(updated.filter(n => !n.isRead).length);
        window.dispatchEvent(new Event('storage'));
    }
    
    const markOneAsRead = (id: string) => {
        const updated = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
        updateNotifications(updated);
    }

    const markAllAsRead = () => {
        const updated = notifications.map(n => ({...n, isRead: true}));
        updateNotifications(updated);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Notifications</CardTitle>
                    <CardDescription>Updates about your bookings and account.</CardDescription>
                </div>
                <Button onClick={markAllAsRead} variant="outline" size="sm" disabled={notifications.every(n => n.isRead)}>Mark all as read</Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {notifications.length > 0 ? (
                    notifications.map(notif => {
                        return <NotificationCard key={notif.id} notification={notif} allBookings={allBookings} onMarkAsRead={markOneAsRead} />
                    })
                ) : (
                    <p className="text-muted-foreground text-center py-8">You have no new notifications.</p>
                )}
            </CardContent>
        </Card>
    );
}
