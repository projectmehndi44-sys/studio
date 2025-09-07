
'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Briefcase, Bell, User, LogOut, Palette } from 'lucide-react';
import type { Artist, Booking, Notification } from '@/types';
import { artists as initialArtists } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

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
            router.push('/artist/login');
            return;
        }
        setArtistId(currentArtistId);
        
        // Fetch Artist Profile
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

        // Fetch Bookings
        const storedBookings: Booking[] = JSON.parse(localStorage.getItem('bookings') || '[]').map((b: any) => ({...b, date: new Date(b.date)}));
        const artistBookings = storedBookings.filter(b => b.artistIds.includes(currentArtistId));
        setBookings(artistBookings);
        
        // Fetch Notifications
        const allNotifications: Notification[] = JSON.parse(localStorage.getItem('notifications') || '[]');
        const artistNotifications = allNotifications.filter((n: Notification) => n.artistId === currentArtistId);
        setNotifications(artistNotifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        setUnreadCount(artistNotifications.filter((n: Notification) => !n.isRead).length);

    }, [router, toast]);

    React.useEffect(() => {
        const isArtistAuthenticated = localStorage.getItem('isArtistAuthenticated');
        if (isArtistAuthenticated !== 'true') {
            router.push('/artist/login');
            return;
        }
        
        fetchArtistData();
        window.addEventListener('storage', fetchArtistData);
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
