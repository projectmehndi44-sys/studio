
'use client';

import * as React from 'react';
import type { Booking, Notification } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useArtistPortal } from '../layout';
import { useRouter } from 'next/navigation';

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

export default function ArtistNotificationsPage() {
    const { artist, allBookings, notifications, setNotifications } = useArtistPortal();
    
    if (!artist) return null;

    const updateNotificationsInStorage = (updated: Notification[]) => {
        const allNotifications: Notification[] = JSON.parse(localStorage.getItem('notifications') || '[]');
        const otherArtistsNotifications = allNotifications.filter(n => n.artistId !== artist.id);
        localStorage.setItem('notifications', JSON.stringify([...updated, ...otherArtistsNotifications]));
        window.dispatchEvent(new Event('storage'));
    }
    
    const markOneAsRead = (id: string) => {
        const updated = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
        setNotifications(updated); // Update local state immediately
        updateNotificationsInStorage(updated);
    }

    const markAllAsRead = () => {
        const updated = notifications.map(n => ({...n, isRead: true}));
        setNotifications(updated); // Update local state immediately
        updateNotificationsInStorage(updated);
    };

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
