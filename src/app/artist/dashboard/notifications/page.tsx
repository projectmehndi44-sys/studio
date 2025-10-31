

'use client';

import * as React from 'react';
import type { Booking, Notification } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useArtistPortal } from '../layout';
import { useRouter } from 'next/navigation';
import { Timestamp } from 'firebase/firestore';


function getSafeDate(date: any): string {
    if (!date) return 'N/A';
    if (date instanceof Timestamp) {
        return date.toDate().toLocaleDateString();
    }
    if (date instanceof Date) {
        return date.toLocaleDateString();
    }
    return 'Invalid Date';
}

interface NotificationCardProps {
    notification: Notification;
    allBookings: Booking[];
    onMarkAsRead: (id: string) => void;
}

function NotificationCard({ notification, allBookings, onMarkAsRead }: NotificationCardProps) {
    const router = useRouter();
    const booking = allBookings.find(b => b.id === notification.bookingId);
    
    const handleClick = () => {
        if (!notification.isRead) {
            onMarkAsRead(notification.id);
        }
        router.push('/artist/dashboard/bookings');
    }

    return (
        <div 
            onClick={handleClick}
            className={`p-4 rounded-lg border-l-4 transition-colors ${notification.isRead ? 'bg-muted/50 border-transparent' : 'bg-primary/10 border-primary cursor-pointer hover:bg-primary/20'}`}>
            <div className="flex justify-between items-start gap-4">
                <div>
                    <h4 className="font-bold">{notification.title}</h4>
                    <p className="text-sm">{notification.message}</p>
                     {booking && (
                        <Card className="mt-2 text-xs text-muted-foreground p-2 bg-background/50">
                            <p><strong>Customer:</strong> {booking.customerName}</p>
                            <p><strong>Service:</strong> {booking.items.map(i => i.servicePackage.name).join(', ')}</p>
                            <p><strong>Date:</strong> {getSafeDate(booking.eventDate)}</p>
                            <p><strong>Address:</strong> {booking.serviceAddress}</p>
                        </Card>
                    )}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(notification.timestamp).toLocaleString()}</span>
            </div>
        </div>
    )
}

export default function ArtistNotificationsPage() {
    const { artist, notifications, setNotifications, artistBookings } = useArtistPortal();
    
    if (!artist) return null;

    const updateNotificationsInStorage = (updated: Notification[]) => {
        // This is a mock function. In a real app, you'd update this in Firestore.
        // The actual update should happen via a service function that updates the doc.
    }
    
    const markOneAsRead = (id: string) => {
        const updated = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
        setNotifications(updated); // Update local state immediately
        // In a real app, call a service function like `updateNotification(id, { isRead: true })`
        updateNotificationsInStorage(updated);
    }

    const markAllAsRead = () => {
        const updated = notifications.map(n => ({...n, isRead: true}));
        setNotifications(updated); // Update local state immediately
        // In a real app, call a service function like `markAllNotificationsAsRead(artist.id)`
        updateNotificationsInStorage(updated);
    };

    if (!notifications) {
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
                        return <NotificationCard key={notif.id} notification={notif} allBookings={artistBookings} onMarkAsRead={markOneAsRead} />
                    })
                ) : (
                    <p className="text-muted-foreground text-center py-8">You have no new notifications.</p>
                )}
            </CardContent>
        </Card>
    );
}
