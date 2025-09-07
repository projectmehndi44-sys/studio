
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { LayoutDashboard, Briefcase, Bell, User, LogOut, Palette } from 'lucide-react';
import type { Artist } from '@/types';
import { artists as initialArtists } from '@/lib/data';

export default function ArtistDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
    const router = useRouter();
    const [artist, setArtist] = React.useState<Artist | null>(null);
    const [activeTab, setActiveTab] = React.useState('dashboard');

    React.useEffect(() => {
        const isArtistAuthenticated = localStorage.getItem('isArtistAuthenticated');
        const artistId = localStorage.getItem('artistId');

        if (isArtistAuthenticated !== 'true' || !artistId) {
            router.push('/artist/login');
            return;
        }

        const allArtists = JSON.parse(localStorage.getItem('artists') || '[]');
        const currentArtist = allArtists.find((a: Artist) => a.id === artistId);
        
        if (currentArtist) {
            setArtist(currentArtist);
        } else {
            // This case might happen if the artist was deleted but the session remains
            localStorage.removeItem('isArtistAuthenticated');
            localStorage.removeItem('artistId');
            router.push('/artist/login');
        }

        const currentPath = window.location.pathname;
        const tab = currentPath.split('/').pop();
        setActiveTab(tab || 'dashboard');

    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('isArtistAuthenticated');
        localStorage.removeItem('artistId');
        router.push('/');
    };

    if (!artist) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <DashboardContent artist={artist} />;
            case 'bookings':
                return <BookingsContent artist={artist} />;
            case 'notifications':
                 return <NotificationsContent artist={artist} />;
            case 'profile':
                return <ProfileContent artist={artist} />;
            default:
                return <DashboardContent artist={artist} />;
        }
    };

    return (
        <div className="flex min-h-screen w-full">
            <aside className="hidden w-64 flex-col border-r bg-muted/40 p-4 sm:flex">
                <div className="flex items-center gap-2 text-2xl font-bold text-primary mb-8">
                    <Palette className="w-8 h-8" />
                    <span>Artist Portal</span>
                </div>
                 <nav className="flex flex-col gap-2 text-lg font-medium">
                    <Link href="/artist/dashboard" onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${activeTab === 'dashboard' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-primary'}`}>
                        <LayoutDashboard className="h-5 w-5" />
                        Dashboard
                    </Link>
                     <Link href="/artist/dashboard/bookings" onClick={() => setActiveTab('bookings')} className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${activeTab === 'bookings' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-primary'}`}>
                        <Briefcase className="h-5 w-5" />
                        Bookings
                    </Link>
                    <Link href="/artist/dashboard/notifications" onClick={() => setActiveTab('notifications')} className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${activeTab === 'notifications' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-primary'}`}>
                        <Bell className="h-5 w-5" />
                        Notifications
                    </Link>
                    <Link href="/artist/dashboard/profile" onClick={() => setActiveTab('profile')} className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${activeTab === 'profile' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-primary'}`}>
                        <User className="h-5 w-5" />
                        Profile
                    </Link>
                </nav>
                 <div className="mt-auto">
                    <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" /> Logout
                    </Button>
                </div>
            </aside>
            <main className="flex-1 p-6">
                {renderContent()}
            </main>
        </div>
    );
}


function DashboardContent({ artist }: { artist: Artist }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Welcome, {artist.name}!</CardTitle>
                <CardDescription>This is your dashboard. Here's a summary of your activity.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>More dashboard content to be added here.</p>
            </CardContent>
        </Card>
    )
}

function BookingsContent({ artist }: { artist: Artist }) {
     return (
        <Card>
            <CardHeader>
                <CardTitle>Your Bookings</CardTitle>
                <CardDescription>Manage your upcoming and past bookings.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Booking details will be listed here.</p>
            </CardContent>
        </Card>
    )
}

function NotificationsContent({ artist }: { artist: Artist }) {
    const [notifications, setNotifications] = React.useState<any[]>([]);

    React.useEffect(() => {
        const allNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
        const artistNotifications = allNotifications.filter((n: any) => n.artistId === artist.id);
        setNotifications(artistNotifications);
    }, [artist.id]);

    const markAllAsRead = () => {
        const allNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
        const updatedNotifications = allNotifications.map((n: any) => 
            n.artistId === artist.id ? { ...n, isRead: true } : n
        );
        localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
        setNotifications(updatedNotifications.filter((n: any) => n.artistId === artist.id));
    };
    
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Notifications</CardTitle>
                    <CardDescription>Updates about your bookings and account.</CardDescription>
                </div>
                <Button onClick={markAllAsRead} variant="outline" size="sm">Mark all as read</Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {notifications.length > 0 ? (
                    notifications.map(notif => (
                        <NotificationCard key={notif.id} notification={notif} />
                    ))
                ) : (
                    <p className="text-muted-foreground text-center py-8">You have no new notifications.</p>
                )}
            </CardContent>
        </Card>
    );
}

function NotificationCard({ notification }: { notification: any }) {
    const booking = allBookings.find(b => b.id === notification.bookingId);
    return (
        <div className={`p-4 rounded-lg border-l-4 ${notification.isRead ? 'bg-muted/50 border-transparent' : 'bg-primary/10 border-primary'}`}>
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

// Added this mock data here for the notification card to work. In a real app this would be fetched.
const allBookings: Booking[] = [
    { id: 'book_01', artistId: '1', customerName: 'Priya Patel', customerContact: '9876543210', serviceAddress: '123, Rose Villa, Bandra West, Mumbai', date: new Date('2024-07-20'), service: 'Bridal Mehndi', amount: 5000, status: 'Completed' },
    { id: 'book_02', artistId: '2', customerName: 'Anjali Sharma', customerContact: '9876543211', serviceAddress: '456, Sunshine Apts, Saket, New Delhi', date: new Date('2024-07-25'), service: 'Party Makeup', amount: 3000, status: 'Completed' },
    { id: 'book_03', artistId: '3', customerName: 'Sneha Reddy', customerContact: '9876543212', serviceAddress: '789, Tech Park, Koramangala, Bangalore', date: new Date('2024-08-05'), service: 'Mehndi & Makeup', amount: 8000, status: 'Pending Approval' },
    { id: 'book_04', artistId: '1', customerName: 'Meera Iyer', customerContact: '9876543213', serviceAddress: '321, Lakeview, Powai, Mumbai', date: new Date('2024-08-10'), service: 'Engagement Makeup', amount: 4500, status: 'Confirmed' },
    { id: 'book_05', artistId: null, customerName: 'Rohan Gupta', customerContact: '9876543214', serviceAddress: '654, MG Road, Pune', date: new Date('2024-08-12'), service: 'Mehndi Package', amount: 1800, status: 'Needs Assignment' },
    { id: 'book_06', artistId: '4', customerName: 'Kavita Singh', customerContact: '9876543215', serviceAddress: '987, Cyber City, Gurgaon', date: new Date('2024-08-15'), service: 'Minimalist Mehndi', amount: 2200, status: 'Pending Approval' },
];


function ProfileContent({ artist }: { artist: Artist }) {
     return (
        <Card>
            <CardHeader>
                <CardTitle>Your Profile</CardTitle>
                <CardDescription>Manage your public profile information.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Profile editing form will be here.</p>
            </CardContent>
        </Card>
    )
}
