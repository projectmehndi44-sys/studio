

'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import type { Artist, Booking, Customer } from '@/lib/types';
import { getCustomer, getArtists, getBookings, listenToCollection } from '@/lib/services';
import { useToast } from '@/hooks/use-toast';
import { useInactivityTimeout } from '@/hooks/use-inactivity-timeout';
import { signOutUser, getFirebaseApp } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LayoutGrid, Briefcase, User, LogOut, Home } from 'lucide-react';
import { getSafeDate } from '@/lib/utils';
import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

// 1. Create a context
interface AccountContextType {
    customer: Customer | null;
    bookings: Booking[];
    artists: Artist[];
    upcomingBookings: Booking[];
    pastBookings: Booking[];
    fetchData: () => Promise<void>;
}

const AccountContext = React.createContext<AccountContextType | null>(null);

// 2. Create a custom hook to use the context
export const useAccount = () => {
    const context = React.useContext(AccountContext);
    if (!context) {
        throw new Error('useAccount must be used within an AccountLayout');
    }
    return context;
};

const navLinks = [
    { href: '/account', label: 'Dashboard', icon: LayoutGrid },
    { href: '/account/bookings', label: 'My Bookings', icon: Briefcase },
    { href: '/account/profile', label: 'My Profile', icon: User },
];

function AccountLayoutContent({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { toast } = useToast();
    const [customer, setCustomer] = React.useState<Customer | null>(null);
    const [bookings, setBookings] = React.useState<Booking[]>([]);
    const [artists, setArtists] = React.useState<Artist[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const auth = getAuth(getFirebaseApp());

    const handleLogout = React.useCallback(async () => {
        await signOutUser();
        localStorage.removeItem('currentCustomerId');
        toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
        router.push('/');
    }, [router, toast]);

    useInactivityTimeout(handleLogout, 600000); // 10 minutes

    const fetchData = React.useCallback(async (uid: string) => {
        try {
            const [fetchedCustomer, fetchedArtists] = await Promise.all([
                getCustomer(uid),
                getArtists(),
            ]);

            if (!fetchedCustomer) {
                await handleLogout();
                return;
            }
            
            setCustomer(fetchedCustomer);
            localStorage.setItem('currentCustomerId', fetchedCustomer.id);
            setArtists(fetchedArtists);

        } catch (error) {
            console.error("Failed to fetch initial account data:", error);
            toast({ title: "Error", description: "Failed to load account data.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast, handleLogout]);

    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                await fetchData(user.uid);
            } else {
                // If there's no authenticated user in Firebase, ensure logout state is clean.
                localStorage.removeItem('currentCustomerId');
                setCustomer(null);
                setIsLoading(false);
                router.push('/login');
            }
        });
        return () => unsubscribe();
    }, [auth, fetchData, router]);


     React.useEffect(() => {
        if (!customer?.id) return;
        const unsubscribe = listenToCollection<Booking>('bookings', (allBookings) => {
            const customerBookings = allBookings.filter(b => b.customerId === customer.id);
            setBookings(customerBookings.sort((a,b) => getSafeDate(b.eventDate).getTime() - getSafeDate(a.eventDate).getTime()));
        });

        return () => unsubscribe();
    }, [customer?.id]);
    
    const contextValue: AccountContextType = {
        customer,
        bookings,
        artists,
        upcomingBookings: bookings.filter(b => b.status !== 'Completed' && b.status !== 'Cancelled' && b.status !== 'Disputed'),
        pastBookings: bookings.filter(b => b.status === 'Completed' || b.status === 'Cancelled' || b.status === 'Disputed'),
        fetchData: () => fetchData(auth.currentUser?.uid || ''),
    };

    if (isLoading || !customer) {
        return <div className="flex items-center justify-center min-h-screen">Loading your account...</div>;
    }

    return (
        <AccountContext.Provider value={contextValue}>
            <div className="min-h-screen bg-muted/40">
                <header className="bg-background border-b sticky top-0 z-50">
                    <div className="w-full px-4 md:px-8 flex justify-between items-center py-3">
                         <div className="flex items-center gap-2 md:gap-4">
                            <Avatar>
                                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${customer.name}`} />
                                <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="hidden md:block">
                                <p className="font-bold">{customer.name}</p>
                                <p className="text-xs text-muted-foreground">{customer.email || customer.phone}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                             <Button variant="outline" asChild>
                                <Link href="/"><Home className="mr-2 h-4 w-4"/>Back to Home</Link>
                            </Button>
                            <Button variant="ghost" onClick={handleLogout}><LogOut className="mr-2 h-4 w-4"/> Logout</Button>
                        </div>
                    </div>
                </header>
                 <div className="w-full px-4 md:px-8 py-8">
                    <div className="grid md:grid-cols-[200px_1fr] gap-8">
                        <aside className="hidden md:flex flex-col gap-2">
                            <nav className="flex flex-col gap-1">
                                {navLinks.map(link => (
                                    <Link key={link.href} href={link.href} className={cn(
                                        "flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary",
                                        pathname === link.href && "bg-primary/10 text-primary font-semibold"
                                    )}>
                                        <link.icon className="h-5 w-5" />
                                        <span>{link.label}</span>
                                    </Link>
                                ))}
                            </nav>
                        </aside>
                        <main>
                            {children}
                        </main>
                    </div>
                </div>
            </div>
        </AccountContext.Provider>
    );
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
    return <AccountLayoutContent>{children}</AccountLayoutContent>;
}
