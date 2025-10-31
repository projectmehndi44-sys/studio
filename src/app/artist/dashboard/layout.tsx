'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    LayoutDashboard,
    Briefcase,
    IndianRupee,
    User,
    LogOut,
    PanelLeft,
    Sparkles,
    Image as ImageIcon,
    CalendarCheck,
    Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useArtistAuth } from '@/hooks/use-artist-auth';
import type { Artist, FinancialSettings } from '@/lib/types';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase';
import { getFinancialSettings } from '@/lib/services';
import { PwaInstallBanner } from '@/components/utsavlook/PwaInstallBanner';

interface ArtistPortalContextType {
    artist: Artist | null;
    financialSettings: FinancialSettings | null;
}

const ArtistPortalContext = React.createContext<ArtistPortalContextType | undefined>(undefined);

export const useArtistPortal = () => {
    const context = React.useContext(ArtistPortalContext);
    if (!context) throw new Error("useArtistPortal must be used within ArtistDashboardLayout");
    return context;
};

const NavLink = ({ href, pathname, icon: Icon, label }: { href: string; pathname: string; icon: React.ElementType, label: string }) => (
    <Link
        href={href}
        className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
            pathname === href ? 'bg-muted text-primary' : ''
        )}
    >
        <Icon className="h-4 w-4" />
        {label}
    </Link>
);

function ArtistDashboardLayoutContent({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { toast } = useToast();
    const auth = useAuth();
    const { artist, isArtistLoading } = useArtistAuth();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            toast({
                title: 'Logged Out...',
                description: 'You have been logged out successfully.',
            });
            router.push('/artist/login');
        } catch (error) {
            toast({
                title: "Logout Failed",
                description: "Could not log you out. Please try again.",
                variant: "destructive"
            });
        }
    };
    
    if (isArtistLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <p>Loading artist portal...</p>
            </div>
        );
    }
    
    if (!artist) {
        router.push('/artist/login');
        return (
             <div className="flex items-center justify-center min-h-screen bg-background">
                <p>Redirecting to login...</p>
            </div>
        );
    }

    const navLinks = [
        { href: '/artist/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/artist/dashboard/bookings', label: 'Bookings', icon: Briefcase },
        { href: '/artist/dashboard/availability', label: 'Availability', icon: CalendarCheck },
        { href: '/artist/dashboard/services', label: 'Services & Pricing', icon: Settings },
        { href: '/artist/dashboard/payouts', label: 'Payouts', icon: IndianRupee },
        { href: '/artist/dashboard/profile', label: 'My Profile', icon: User },
        { href: '/artist/dashboard/gallery', label: 'Work Gallery', icon: ImageIcon },
        { href: '/artist/dashboard/promote', label: 'Promote', icon: Sparkles },
    ];

    const SidebarNav = () => (
         <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {navLinks.map(link => (
                <NavLink key={link.href} {...link} pathname={pathname} />
            ))}
        </nav>
    );

    return (
        <div className="grid min-h-screen w-full md:grid-cols-[180px_1fr] lg:grid-cols-[240px_1fr]">
            <aside className="hidden border-r bg-background md:block">
                <div className="flex h-full max-h-screen flex-col gap-2">
                    <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                         <Link href="/" className="flex items-center gap-2 font-semibold text-primary">
                            <h1 className="font-headline text-xl md:text-3xl font-bold text-accent">
                                Utsav<span className="text-primary">Look</span>
                            </h1>
                        </Link>
                    </div>
                    <div className="flex-1 overflow-auto py-2">
                       <SidebarNav />
                    </div>
                </div>
            </aside>
            <div className="flex flex-col">
                <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
                    <Sheet>
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
                            <div className="flex h-14 items-center border-b px-4">
                                <Link href="/" className="flex items-center gap-2 font-semibold text-primary">
                                    <h1 className="font-headline text-2xl font-bold text-accent">Utsav<span className="text-primary">Look</span></h1>
                                </Link>
                            </div>
                            <div className="flex-1 overflow-y-auto py-2">
                                <SidebarNav />
                            </div>
                        </SheetContent>
                    </Sheet>
                    <div className="w-full flex-1">
                        <h2 className="font-semibold text-lg text-primary">Artist Portal</h2>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="icon" className="rounded-full">
                                <Avatar className='h-8 w-8'>
                                    <AvatarImage src={artist.profilePicture} alt={artist.name} />
                                    <AvatarFallback>{artist.name ? artist.name.charAt(0) : 'A'}</AvatarFallback>
                                </Avatar>
                                <span className="sr-only">Toggle user menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{artist.name}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => router.push('/artist/dashboard/profile')}>My Profile</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout} className="text-destructive">Logout</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </header>
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/20 overflow-auto">
                    <PwaInstallBanner />
                    {children}
                </main>
            </div>
        </div>
    );
}

export default function ArtistDashboardLayout({ children }: { children: React.ReactNode }) {
    const { artist } = useArtistAuth();
    const [financialSettings, setFinancialSettings] = React.useState<FinancialSettings | null>(null);

    React.useEffect(() => {
        getFinancialSettings().then(setFinancialSettings);
    }, []);

    return (
        <ArtistPortalContext.Provider value={{ artist, financialSettings }}>
            <ArtistDashboardLayoutContent>{children}</ArtistDashboardLayoutContent>
        </ArtistPortalContext.Provider>
    );
}
