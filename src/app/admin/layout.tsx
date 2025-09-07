
'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Shield,
    Home,
    Briefcase,
    IndianRupee,
    ListTree,
    Settings,
    LogOut,
    PanelLeft,
    Package,
    Users,
    Palette,
    Tag,
    Image as ImageIcon,
    MapPin,
    AreaChart,
    User as UserIcon,
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


const NavLink = ({ href, pathname, icon: Icon, label }: { href: string; pathname: string; icon: React.ElementType, label: string }) => (
    <Link
        href={href}
        className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
            pathname.startsWith(href) && href !== '/admin' && 'bg-muted text-primary',
            pathname === href && href === '/admin' && 'bg-muted text-primary'
        )}
    >
        <Icon className="h-4 w-4" />
        {label}
    </Link>
);


export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [adminName, setAdminName] = React.useState('Admin');

    React.useEffect(() => {
        const isAdminAuthenticated = localStorage.getItem('isAdminAuthenticated');
        if (isAdminAuthenticated !== 'true') {
            router.push('/admin/login');
        } else {
            const username = localStorage.getItem('adminUsername');
            const teamMembers = JSON.parse(localStorage.getItem('teamMembers') || '[]');
            const currentUser = teamMembers.find((m: any) => m.username === username);
            if (currentUser) {
                setAdminName(currentUser.name);
            }
        }
    }, [router]);
    
    const handleLogout = () => {
        localStorage.removeItem('isAdminAuthenticated');
        localStorage.removeItem('adminRole');
        localStorage.removeItem('adminUsername');
        router.push('/admin/login');
    };

    const navLinks = [
        { href: '/admin', label: 'Dashboard', icon: Home },
        { href: '/admin/bookings', label: 'Bookings', icon: Briefcase },
        { href: '/admin/artists', label: 'Artists', icon: Palette },
        { href: '/admin/customers', label: 'Customers', icon: Users },
        { href: '/admin/payouts', label: 'Payouts', icon: IndianRupee },
        { href: '/admin/transactions', label: 'Transactions', icon: ListTree },
        { href: '/admin/packages', label: 'Packages', icon: Package },
        { href: '/admin/settings', label: 'Settings', icon: Settings },
    ];

    const SidebarNav = () => (
         <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {navLinks.map(link => (
                <NavLink key={link.href} {...link} pathname={pathname} />
            ))}
        </nav>
    );

    return (
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
            <aside className="hidden border-r bg-muted/40 md:block">
                <div className="flex h-full max-h-screen flex-col gap-2">
                    <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                        <Link href="/admin" className="flex items-center gap-2 font-semibold text-primary">
                            <Shield className="h-6 w-6" />
                            <span>Admin Portal</span>
                        </Link>
                    </div>
                    <div className="flex-1 overflow-auto py-2">
                       <SidebarNav />
                    </div>
                </div>
            </aside>
            <div className="flex flex-col">
                <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
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
                             <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                                <Link href="/admin" className="flex items-center gap-2 font-semibold text-primary">
                                    <Shield className="h-6 w-6" />
                                    <span>Admin Portal</span>
                                </Link>
                            </div>
                            <SidebarNav />
                        </SheetContent>
                    </Sheet>
                    <div className="w-full flex-1">
                        {/* Can add a search bar here in the future */}
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="icon" className="rounded-full">
                                <Avatar className='h-8 w-8'>
                                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${adminName}`} alt={adminName} />
                                    <AvatarFallback>{adminName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="sr-only">Toggle user menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{adminName}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => router.push('/admin/settings')}>Settings</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => router.push('/admin/profile')}>My Profile</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={handleLogout}>Logout</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </header>
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
                    {children}
                </main>
            </div>
        </div>
    );
}

