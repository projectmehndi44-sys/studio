
'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Briefcase, Bell, User, LogOut, Palette, CalendarOff } from 'lucide-react';
import type { Artist, Booking, Notification } from '@/types';
import { artists as initialArtists } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const NavLink = ({ href, pathname, icon: Icon, label }: { href: string; pathname: string; icon: React.ElementType, label: string}) => (
    <Link 
        href={href} 
        className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${pathname === href ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-primary'}`}
    >
        <Icon className="h-5 w-5" />
        {label}
    </Link>
);

const BottomNavLink = ({ href, pathname, icon: Icon, label }: { href: string; pathname: string; icon: React.ElementType, label: string }) => (
    <Link href={href} className={cn("flex flex-col items-center gap-1 p-2 rounded-md", pathname === href ? 'text-primary' : 'text-muted-foreground')}>
        <Icon className="h-6 w-6" />
        <span className="text-xs">{label}</span>
    </Link>
)


export default function ArtistDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
    const router = useRouter();
    const { toast } = useToast();
    const pathname = usePathname();
    const isMobile = useIsMobile();
    const [artist, setArtist] = React.useState<Artist | null>(null);
    const [bookings, setBookings] = React.useState<Booking[]>([]);
    const [notifications, setNotifications] = React.useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = React.useState(0);
    const [artistId, setArtistId] = React.useState<string | null>(null);

    const getArtists = (): Artist[] => {
         const storedArtists = localStorage.getItem('artists');
         const localArtists: Artist[] = storedArtists ? JSON.parse(storedArtists) : [];
         const allArtistsMap = new Map<string, Artist>();
         initialArtists.forEach(a => allArtistsMap.set(a.id, a));
         localArtists.forEach(a => allArtistsMap.set(a.id, a));
         return Array.from(allArtistsMap.values());
    }

    const fetchArtistData = React.useCallback(() => {
        const currentArtistId = localStorage.getItem('artistId');
        if (!currentArtistId) {
            router.push('/artist/login');
            return;
        }
        setArtistId(currentArtistId);
        
        const allArtists = getArtists();
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

        const storedBookings: Booking[] = JSON.parse(localStorage.getItem('bookings') || '[]').map((b: any) => ({...b, date: new Date(b.date)}));
        const artistBookings = storedBookings.filter(b => b.artistIds.includes(currentArtistId));
        setBookings(artistBookings);
        
        const allNotifications: Notification[] = JSON.parse(localStorage.getItem('notifications') || '[]');
        const artistNotifications = allNotifications.filter((n: Notification) => n.artistId === currentArtistId);
        setNotifications(artistNotifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        setUnreadCount(artistNotifications.filter((n: Notification) => !n.isRead).length);

    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    
    const childrenWithProps = React.Children.map(children, child => {
        if (React.isValidElement(child)) {
            const props: any = { artist }; 
            if (pathname === '/artist/dashboard') {
                props.bookings = bookings;
            }
            if (pathname === '/artist/dashboard/bookings') {
                props.bookings = bookings;
                props.setBookings = setBookings;
            }
             if (pathname === '/artist/dashboard/availability') {
                props.artist = artist;
                props.setArtist = setArtist;
            }
            if (pathname === '/artist/dashboard/notifications') {
                 props.notifications = notifications;
                 props.setNotifications = setNotifications;
                 props.artistId = artistId;
                 props.setUnreadCount = setUnreadCount;
            }
            if (pathname === '/artist/dashboard/profile') {
                props.setArtist = setArtist;
            }
            return React.cloneElement(child, props);
        }
        return child;
    });

    const navLinks = [
        { href: '/artist/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/artist/dashboard/bookings', label: 'Bookings', icon: Briefcase },
        { href: '/artist/dashboard/availability', label: 'Availability', icon: CalendarOff },
        { href: '/artist/dashboard/profile', label: 'Profile', icon: User },
    ];
    
    const SidebarNav = () => (
        <div className='flex flex-col h-full'>
             <div className="flex items-center gap-2 text-2xl font-bold text-primary mb-8 px-4 pt-4">
                <Palette className="w-8 h-8" />
                <span>Artist Portal</span>
            </div>
             <nav className="flex flex-col gap-2 text-lg font-medium px-4">
                {navLinks.map(link => (
                    <NavLink key={link.href} {...link} pathname={pathname}/>
                ))}
                 <Link href='/artist/dashboard/notifications' className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${pathname === '/artist/dashboard/notifications' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-primary'}`}>
                    <Bell className="h-5 w-5" />
                    Notifications
                    {unreadCount > 0 && (
                        <span className="ml-auto h-5 w-5 rounded-full bg-red-500 text-xs flex items-center justify-center text-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Link>
            </nav>
             <div className={cn("mt-auto p-4 border-t border-border")}>
                <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                </Button>
            </div>
        </div>
    );
    
    const BottomNav = () => (
         <div className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t shadow-lg md:hidden z-50">
            <nav className="grid h-full grid-cols-4">
                {navLinks.map(link => (
                    <BottomNavLink key={link.href} {...link} pathname={pathname} />
                ))}
            </nav>
        </div>
    );

    return (
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
            <aside className="hidden border-r bg-muted/40 md:block">
               <SidebarNav />
            </aside>
             <div className="flex flex-col">
                 <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
                    <div className='flex-1'>
                        <h1 className='font-semibold text-lg'>{navLinks.find(l => l.href.startsWith(pathname))?.label || 'Notifications'}</h1>
                    </div>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative">
                                <Bell className="h-5 w-5"/>
                                 {unreadCount > 0 && (
                                    <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 text-xs flex items-center justify-center text-white border-2 border-background">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => router.push('/artist/dashboard/notifications')}>
                                You have {unreadCount} unread notifications.
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </header>
                <main className="flex-1 p-4 lg:p-6 bg-background pb-20 md:pb-6">
                    {childrenWithProps}
                </main>
            </div>
            {isMobile && <BottomNav />}
        </div>
    );
}
