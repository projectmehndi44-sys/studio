
'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Briefcase, Bell, User, LogOut, Palette } from 'lucide-react';
import type { Artist } from '@/types';

export default function ArtistDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [artist, setArtist] = React.useState<Artist | null>(null);

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
    }, [router]);

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
        { href: '/artist/dashboard/notifications', label: 'Notifications', icon: Bell },
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
                        <Link key={link.href} href={link.href} className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${pathname === link.href ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-primary'}`}>
                            <link.icon className="h-5 w-5" />
                            {link.label}
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
                {children}
            </main>
        </div>
    );
}
