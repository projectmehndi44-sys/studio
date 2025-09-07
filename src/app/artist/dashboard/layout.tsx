
'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Briefcase, Bell, User, LogOut, Palette, CalendarOff } from 'lucide-react';
import type { Artist, Booking, Notification } from '@/types';
import { artists as initialArtists, allBookings as initialBookings } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// 1. Create a context for the artist portal
interface ArtistPortalContextType {
    artist: Artist | null;
    artistBookings: Booking[];
    allBookings: Booking[];
    notifications: Notification[];
    unreadCount: number;
    setArtist: React.Dispatch<React.SetStateAction<Artist | null>>;
    setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
}

export const ArtistPortalContext = React.createContext<ArtistPortalContextType | null>(null);

// Custom hook to use the context
export const useArtistPortal = () => {
    const context = React.useContext(ArtistPortalContext);
    if (!context) {
        throw new Error('useArtistPortal must be used within an ArtistDashboardLayout');
    }
    return context;
};


const NavLink = ({ href, pathname, icon: Icon, label }: { href: string; pathname: string; icon: React.ElementType, label: string}) => (
    <Link 
        href={href} 
        className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${pathname === href ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-primary'}`}
    >
        <Icon className="h-5 w-5" />
        {label}
    </Link>
);

const BottomNavLink = ({ href, pathname, icon: Icon, label, unreadCount }: { href: string; pathname: string; icon: React.ElementType, label: string, unreadCount?: number }) => (
    <Link href={href} className={cn("relative flex flex-col items-center justify-center gap-1 p-2 rounded-md h-full", pathname === href ? 'text-primary bg-primary/10' : 'text-muted-foreground')}>
        <Icon className="h-6 w-6" />
        <span className="text-xs font-medium">{label}</span>
         {label === 'Notifications' && unreadCount && unreadCount > 0 && (
            <span className="absolute top-1 right-4 h-4 w-4 rounded-full bg-red-500 text-xs flex items-center justify-center text-white border-2 border-background">
                {unreadCount > 9 ? '9+' : unreadCount}
            </span>
        )}
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
    
    // Centralized state for the portal
    const [artist, setArtist] = React.useState<Artist | null>(null);
    const [allBookings, setAllBookings] = React.useState<Booking[]>([]);
    const [artistBookings, setArtistBookings] = React.useState<Booking[]>([]);
    const [notifications, setNotifications] = React.useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = React.useState(0);


    const getArtists = (): Artist[] => {
         const storedArtists = localStorage.getItem('artists');
         const localArtists: Artist[] = storedArtists ? JSON.parse(storedArtists) : [];
         const allArtistsMap = new Map<string, Artist>();
         initialArtists.forEach(a => allArtistsMap.set(a.id, a));
         localArtists.forEach(a => allArtistsMap.set(a.id, a));
         return Array.from(allArtistsMap.values());
    }

    const fetchData = React.useCallback(() => {
        const currentArtistId = localStorage.getItem('artistId');
        if (!currentArtistId) {
            router.push('/artist/login');
            return;
        }
        
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

        // Fetch and manage all data here
        const storedBookings: Booking[] = JSON.parse(localStorage.getItem('bookings') || JSON.stringify(initialBookings)).map((b: any) => ({...b, date: new Date(b.date)}));
        setAllBookings(storedBookings);

        const currentArtistBookings = storedBookings.filter(b => b.artistIds.includes(currentArtistId));
        setArtistBookings(currentArtistBookings.sort((a,b) => b.date.getTime() - a.date.getTime()));
        
        const allNotifications: Notification[] = JSON.parse(localStorage.getItem('notifications') || '[]');
        const artistNotifications = allNotifications.filter((n: Notification) => n.artistId === currentArtistId);
        setNotifications(artistNotifications.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        setUnreadCount(artistNotifications.filter((n: Notification) => !n.isRead).length);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router, toast]);

    React.useEffect(() => {
        const isArtistAuthenticated = localStorage.getItem('isArtistAuthenticated');
        if (isArtistAuthenticated !== 'true') {
            router.push('/artist/login');
            return;
        }
        
        fetchData();
        window.addEventListener('storage', fetchData);
        return () => {
            window.removeEventListener('storage', fetchData);
        };
    }, [fetchData, router]);

    const handleLogout = () => {
        localStorage.removeItem('isArtistAuthenticated');
        localStorage.removeItem('artistId');
        router.push('/');
    };

    if (!artist) {
        return <div className="flex items-center justify-center min-h-screen">Loading Artist Portal...</div>;
    }

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
            <nav className="grid h-full grid-cols-5">
                {navLinks.map(link => (
                    <BottomNavLink key={link.href} {...link} pathname={pathname} />
                ))}
                 <BottomNavLink href='/artist/dashboard/notifications' pathname={pathname} icon={Bell} label='Notifications' unreadCount={unreadCount} />
            </nav>
        </div>
    );
    
    const contextValue = {
        artist,
        artistBookings,
        allBookings,
        notifications,
        unreadCount,
        setArtist,
        setNotifications,
    };

    return (
        <ArtistPortalContext.Provider value={contextValue}>
            <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
                <aside className="hidden border-r bg-muted/40 md:block">
                   <SidebarNav />
                </aside>
                 <div className="flex flex-col">
                     <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
                        <div className='flex-1'>
                            <h1 className='font-semibold text-lg'>{navLinks.find(l => pathname.startsWith(l.href))?.label || 'Notifications'}</h1>
                        </div>
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="relative hidden md:inline-flex" onClick={() => router.push('/artist/dashboard/notifications')}>
                                    <Bell className="h-5 w-5"/>
                                     {unreadCount > 0 && (
                                        <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 text-xs flex items-center justify-center text-white border-2 border-background">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                        </DropdownMenu>
                    </header>
                    <main className="flex-1 p-4 lg:p-6 bg-background pb-20 md:pb-6">
                        {children}
                    </main>
                </div>
                {isMobile && <BottomNav />}
            </div>
        </ArtistPortalContext.Provider>
    );
}
