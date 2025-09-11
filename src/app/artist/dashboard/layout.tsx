
'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LayoutDashboard, Briefcase, Bell, User, LogOut, Palette, CalendarOff, IndianRupee, Package, Star, PanelLeft } from 'lucide-react';
import type { Artist, Booking, Notification } from '@/types';
import { getArtist, listenToCollection } from '@/lib/services';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useInactivityTimeout } from '@/hooks/use-inactivity-timeout';
import { signOutUser } from '@/lib/firebase';
import { onAuthStateChanged, getAuth, User as FirebaseUser } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { collection, query, where, getFirestore } from 'firebase/firestore';


// 1. Create a context for the artist portal
interface ArtistPortalContextType {
    artist: Artist | null;
    artistBookings: Booking[];
    notifications: Notification[];
    unreadCount: number;
    setArtist: React.Dispatch<React.SetStateAction<Artist | null>>;
    setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
    fetchData: () => void;
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


const NavLink = ({ href, pathname, icon: Icon, label, onClick, children }: { href: string; pathname: string; icon: React.ElementType, label: string, onClick?: () => void, children?: React.ReactNode }) => (
    <Link 
        href={href} 
        onClick={onClick}
        className={cn('flex items-center gap-3 rounded-lg px-3 py-2 transition-all', 
          pathname.startsWith(href) ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-primary'
        )}
    >
        <Icon className="h-5 w-5" />
        {label}
        {children}
    </Link>
);

const BottomNavLink = ({ href, pathname, icon: Icon, label, children }: { href: string; pathname: string; icon: React.ElementType, label: string, children?: React.ReactNode }) => (
    <Link href={href} className={cn("relative flex flex-col items-center justify-center gap-1 p-2 rounded-md h-full w-full", pathname.startsWith(href) ? 'text-primary bg-primary/10' : 'text-muted-foreground')}>
        <Icon className="h-6 w-6" />
        <span className="text-xs font-medium">{label}</span>
        {children}
    </Link>
)

const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();
    const { toast } = useToast();
    const auth = getAuth(app);
    const { setArtist, fetchData } = useArtistPortal();
    const [isLoading, setIsLoading] = React.useState(true);
    const [artistId, setArtistId] = React.useState<string | null>(null);

    const handleLogout = React.useCallback(async () => {
        await signOutUser();
        toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
        router.push('/');
    }, [router, toast]);

    useInactivityTimeout(handleLogout);

    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setArtistId(user.uid);
            } else {
                router.push('/artist/login');
            }
        });
        return () => unsubscribe();
    }, [auth, router]);

    React.useEffect(() => {
        if (!artistId) return;

        const fetchArtistData = async () => {
            setIsLoading(true);
            const currentArtist = await getArtist(artistId);
            if (currentArtist) {
                setArtist(currentArtist);
            } else {
                toast({
                    title: "Access Denied",
                    description: "This account is not registered as an artist.",
                    variant: "destructive"
                });
                handleLogout();
            }
            setIsLoading(false);
        };

        fetchArtistData();
    }, [artistId, setArtist, handleLogout, toast]);


    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading Artist Portal...</div>;
    }

    return <>{children}</>;
};


export default function ArtistDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
    const router = useRouter();
    const pathname = usePathname();
    const isMobile = useIsMobile();
    
    // Centralized state for the portal
    const [artist, setArtist] = React.useState<Artist | null>(null);
    const [artistBookings, setArtistBookings] = React.useState<Booking[]>([]);
    const [notifications, setNotifications] = React.useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = React.useState(0);
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    const handleLogout = React.useCallback(async () => {
        await signOutUser();
        router.push('/');
    }, [router]);
    
    const fetchData = React.useCallback(async () => {
        if (!artist?.id) return;
        const currentArtist = await getArtist(artist.id);
        if (currentArtist) {
            setArtist(currentArtist);
        }
    }, [artist?.id]);


    React.useEffect(() => {
        if (!artist?.id) return;
        
        const db = getFirestore(app);

        // Fetch only bookings relevant to this artist
        const bookingsQuery = query(collection(db, 'bookings'), where('artistIds', 'array-contains', artist.id));
        const unsubscribeBookings = listenToCollection<Booking>('bookings', (artistSpecificBookings) => {
            const sortedBookings = artistSpecificBookings.sort((a,b) => b.date.toMillis() - a.date.toMillis());
            setArtistBookings(sortedBookings);
        }, bookingsQuery);


        // Fetch only notifications relevant to this artist
        const notificationsQuery = query(collection(db, 'notifications'), where('artistId', '==', artist.id));
        const unsubscribeNotifications = listenToCollection<Notification>('notifications', (artistNotifications) => {
            const sortedNotifications = artistNotifications.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setNotifications(sortedNotifications);
            setUnreadCount(sortedNotifications.filter(n => !n.isRead).length);
        }, notificationsQuery);
        
        return () => {
            unsubscribeBookings();
            unsubscribeNotifications();
        };

    }, [artist?.id]);


    const mainNavLinks = [
        { href: '/artist/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/artist/dashboard/bookings', label: 'Bookings', icon: Briefcase },
        { href: '/artist/dashboard/availability', label: 'Availability', icon: CalendarOff },
        { href: '/artist/dashboard/services', label: 'My Services', icon: Package },
        { href: '/artist/dashboard/profile', label: 'Profile', icon: User },
    ];

    const sidebarNavLinks = [
        { href: '/artist/dashboard/payouts', label: 'Payouts', icon: IndianRupee },
        { href: '/artist/dashboard/reviews', label: 'Reviews', icon: Star },
        { href: '/artist/dashboard/notifications', label: 'Notifications', icon: Bell },
    ];
    
    const bottomNavLinks = mainNavLinks;

    const getPageTitle = () => {
        const allLinks = [...mainNavLinks, ...sidebarNavLinks];
        const sortedLinks = allLinks.sort((a, b) => b.href.length - a.href.length);
        const currentLink = sortedLinks.find(l => pathname.startsWith(l.href));
        if (currentLink) return currentLink.label;
        if (pathname.startsWith('/artist/dashboard')) return 'Dashboard';
        return 'Dashboard';
    }

    const NavContent = () => (
        <>
            <div className="flex items-center gap-2 text-2xl font-bold text-primary mb-8 px-4 pt-4">
                <Palette className="w-8 h-8" />
                <span>Artist Portal</span>
            </div>
             <nav className="flex flex-col gap-2 text-lg font-medium px-4">
                {mainNavLinks.map(link => (
                    <NavLink key={link.href} {...link} pathname={pathname} onClick={() => setIsSidebarOpen(false)} />
                ))}
            </nav>
            <div className="mt-4 pt-4 border-t mx-4">
                <nav className="flex flex-col gap-2 text-lg font-medium">
                    {sidebarNavLinks.map(link => (
                         <NavLink key={link.href} {...link} pathname={pathname} onClick={() => setIsSidebarOpen(false)}>
                            {link.label === 'Notifications' && unreadCount > 0 && (
                                <span className="ml-auto h-5 w-5 rounded-full bg-red-500 text-xs flex items-center justify-center text-white">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </NavLink>
                    ))}
                </nav>
            </div>
             <div className={cn("mt-auto p-4 border-t border-border")}>
                <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                </Button>
            </div>
        </>
    );

    
    const BottomNav = () => (
         <div className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t shadow-lg md:hidden z-50">
            <nav className="grid h-full grid-cols-5">
                {bottomNavLinks.map(link => (
                    <BottomNavLink key={link.href} {...link} pathname={pathname} >
                        {link.label === 'Notifications' && unreadCount > 0 && (
                                <span className="absolute top-1 right-1/4 h-4 w-4 rounded-full bg-red-500 text-xs flex items-center justify-center text-white border-2 border-background">
                                </span>
                         )}
                    </BottomNavLink>
                ))}
            </nav>
        </div>
    );
    
    const contextValue = {
        artist,
        artistBookings,
        notifications,
        unreadCount,
        setArtist,
        setNotifications,
        fetchData,
    };

    return (
        <ArtistPortalContext.Provider value={contextValue}>
            <AuthWrapper>
                <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
                    <aside className="hidden border-r bg-background md:flex flex-col">
                       <NavContent />
                    </aside>
                     <div className="flex flex-col">
                         <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
                             <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                                <SheetTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="shrink-0 md:hidden"
                                    >
                                        <PanelLeft className="h-5 w-5" />
                                        <span className="sr-only">Toggle navigation menu</span>
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="flex flex-col p-0">
                                    <NavContent />
                                </SheetContent>
                            </Sheet>

                            <div className='flex-1'>
                                <h1 className='font-semibold text-lg'>{getPageTitle()}</h1>
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
                        <main className="flex-1 p-4 lg:p-6 bg-muted/20 pb-20 md:pb-6">
                            {children}
                        </main>
                    </div>
                    {isMobile && <BottomNav />}
                </div>
            </AuthWrapper>
        </ArtistPortalContext.Provider>
    );
}
