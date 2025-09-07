
'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Briefcase, Bell, User, LogOut, Palette } from 'lucide-react';
import type { Artist, Booking, Notification } from '@/types';
import { artists as initialArtists } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

// Mock data that would be fetched for the logged-in artist
const allBookings: Booking[] = [
    { id: 'book_01', artistIds: ['1'], customerName: 'Priya Patel', customerContact: '9876543210', serviceAddress: '123, Rose Villa, Bandra West, Mumbai', date: new Date('2024-07-20'), service: 'Bridal Mehndi', amount: 5000, status: 'Completed' },
    { id: 'book_04', artistIds: ['1'], customerName: 'Meera Iyer', customerContact: '9876543213', serviceAddress: '321, Lakeview, Powai, Mumbai', date: new Date('2024-08-10'), service: 'Engagement Makeup', amount: 4500, status: 'Confirmed' },
    { id: 'book_07', artistIds: ['1'], customerName: 'Neha Desai', customerContact: '9876543216', serviceAddress: '555, Juhu Beach, Mumbai', date: new Date('2024-08-20'), service: 'Bridal Package', amount: 9500, status: 'Confirmed' },
    { id: 'book_08', artistIds: ['2'], customerName: 'Anika Verma', customerContact: '9876543217', serviceAddress: '777, CP, New Delhi', date: new Date('2024-08-22'), service: 'Reception Makeup', amount: 6000, status: 'Confirmed' },
];

export default function ArtistDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
    const router = useRouter();
    const { toast } = useToast();
    const pathname = usePathname();
    const [artist, setArtist] = React.useState<Artist | null>(null);
    const [bookings, setBookings] = React.useState<Booking[]>([]);
    const [notifications, setNotifications] = React.useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = React.useState(0);
    const [artistId, setArtistId] = React.useState<string | null>(null);

    const fetchArtistData = React.useCallback(() => {
        const currentArtistId = localStorage.getItem('artistId');
        if (!currentArtistId) {
            // No need to toast here, just redirect.
            router.push('/artist/login');
            return;
        }
        setArtistId(currentArtistId);
        
        // Fetch Artist Profile from both initial data and localStorage
        const storedArtists: Artist[] = JSON.parse(localStorage.getItem('artists') || '[]');
        const allArtists: Artist[] = [...initialArtists.filter(ia => !storedArtists.some(sa => sa.id === ia.id)), ...storedArtists];
        const currentArtist = allArtists.find((a: Artist) => a.id === currentArtistId);
        
        if (currentArtist) {
            setArtist(currentArtist);
        } else {
            toast({
                title: "Login Error",
                description: "Could not find your artist profile. Please log in again.",
                variant: "destructive"
            });
            handleLogout();
            return;
        }

        // Fetch Bookings from localStorage primarily, fallback to initial data
        const storedBookings: Booking[] = JSON.parse(localStorage.getItem('bookings') || 'null') || allBookings;
        const artistBookings = storedBookings.filter(b => b.artistIds.includes(currentArtistId));
        setBookings(artistBookings);
        
        // Fetch Notifications from localStorage
        const allNotifications: Notification[] = JSON.parse(localStorage.getItem('notifications') || '[]');
        const artistNotifications = allNotifications.filter((n: Notification) => n.artistId === currentArtistId);
        setNotifications(artistNotifications);
        setUnreadCount(artistNotifications.filter((n: Notification) => !n.isRead).length);

    }, [router, toast]);

    React.useEffect(() => {
        const isArtistAuthenticated = localStorage.getItem('isArtistAuthenticated');
        if (isArtistAuthenticated !== 'true') {
            router.push('/artist/login');
            return;
        }
        
        fetchArtistData();
        // Set up the listener for storage events to keep data in sync
        window.addEventListener('storage', fetchArtistData);
        // Clean up the listener when the component unmounts
        return () => {
            window.removeEventListener('storage', fetchArtistData);
        };
    }, [fetchArtistData, router]);

    const handleLogout = () => {
        localStorage.removeItem('isArtistAuthenticated');
        localStorage.removeItem('artistId');
        router.push('/');
    };

    if (!artist) {
        return <div className="flex items-center justify-center min-h-screen">Loading Artist Portal...</div>;
    }
    
    // Clone children and pass down the fetched data as props
    const childrenWithProps = React.Children.map(children, child => {
        if (React.isValidElement(child)) {
            const props: any = { artist, bookings, notifications, setNotifications, setUnreadCount, artistId };
             // Special case for bookings page to allow mutation
            if (pathname === '/artist/dashboard/bookings') {
                props.setBookings = setBookings;
            }
            return React.cloneElement(child, props);
        }
        return child;
    });

    const navLinks = [
        { href: '/artist/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/artist/dashboard/bookings', label: 'Bookings', icon: Briefcase },
        { href: '/artist/dashboard/notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
        { href: '/artist/dashboard/profile', label: 'Profile', icon: User },
    ]

    return (
        <div className="flex min-h-screen w-full">
            <aside className="hidden w-64 flex-col border-r bg-muted/40 p-4 sm:flex">
                <div className="flex items-center gap-2 text-2xl font-bold text-primary mb-8">
                    <Palette className="w-8 h-8" />
                    <span>Artist Portal</span>
                </div>
                 <nav className="flex flex-col gap-2 text-lg font-medium">
                    {navLinks.map(link => (
                        <Link key={link.href} href={link.href} className={`relative flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${pathname === link.href ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-primary'}`}>
                            <link.icon className="h-5 w-5" />
                            {link.label}
                             {link.badge && link.badge > 0 && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-red-500 text-xs flex items-center justify-center text-white">
                                    {link.badge}
                                </span>
                            )}
                        </Link>
                    ))}
                </nav>
                 <div className="mt-auto">
                    <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" /> Logout
                    </Button>
                </div>
            </aside>
            <main className="flex-1 p-6 bg-background">
                {childrenWithProps}
            </main>
        </div>
    );
}

    