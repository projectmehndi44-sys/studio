
'use client';

import * as React from 'react';
import type { Booking, Notification } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Mock data that would be fetched for the logged-in artist
const allBookings: Booking[] = [
    { id: 'book_01', artistIds: ['1'], customerName: 'Priya Patel', customerContact: '9876543210', serviceAddress: '123, Rose Villa, Bandra West, Mumbai', date: new Date('2024-07-20'), service: 'Bridal Mehndi', amount: 5000, status: 'Completed' },
    { id: 'book_02', artistIds: ['2'], customerName: 'Anjali Sharma', customerContact: '9876543211', serviceAddress: '456, Sunshine Apts, Saket, New Delhi', date: new Date('2024-07-25'), service: 'Party Makeup', amount: 3000, status: 'Completed' },
    { id: 'book_03', artistIds: ['3'], customerName: 'Sneha Reddy', customerContact: '9876543212', serviceAddress: '789, Tech Park, Koramangala, Bangalore', date: new Date('2024-08-05'), service: 'Mehndi & Makeup', amount: 8000, status: 'Pending Approval' },
    { id: 'book_04', artistIds: ['1'], customerName: 'Meera Iyer', customerContact: '9876543213', serviceAddress: '321, Lakeview, Powai, Mumbai', date: new Date('2024-08-10'), service: 'Engagement Makeup', amount: 4500, status: 'Confirmed' },
    { id: 'book_05', artistIds: [], customerName: 'Rohan Gupta', customerContact: '9876543214', serviceAddress: '654, MG Road, Pune', date: new Date('2024-08-12'), service: 'Mehndi Package', amount: 1800, status: 'Needs Assignment' },
    { id: 'book_06', artistIds: ['4'], customerName: 'Kavita Singh', customerContact: '9876543215', serviceAddress: '987, Cyber City, Gurgaon', date: new Date('2024-08-15'), service: 'Minimalist Mehndi', amount: 2200, status: 'Pending Approval' },
];

interface NotificationCardProps {
    notification: Notification;
    onMarkAsRead: (id: string) => void;
}

function NotificationCard({ notification, onMarkAsRead }: NotificationCardProps) {
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

    const updateNotifications = (updated: Notification[]) => {
        const allNotifications: Notification[] = JSON.parse(localStorage.getItem('notifications') || '[]');
        const otherArtistsNotifications = allNotifications.filter(n => n.artistId !== artistId);
        localStorage.setItem('notifications', JSON.stringify([...updated, ...otherArtistsNotifications]));

        setNotifications(updated);
        setUnreadCount(updated.filter(n => !n.isRead).length);
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
                    notifications.map(notif => (
                        <NotificationCard key={notif.id} notification={notif} onMarkAsRead={markOneAsRead} />
                    ))
                ) : (
                    <p className="text-muted-foreground text-center py-8">You have no new notifications.</p>
                )}
            </CardContent>
        </Card>
    );
}
