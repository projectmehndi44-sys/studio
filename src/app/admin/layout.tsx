
'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Shield,
    Home,
    Briefcase,
    IndianRupee,
    LogOut,
    PanelLeft,
    Package,
    Users,
    Palette,
    Image as ImageIcon,
    MapPin,
    BarChart2,
    Bell,
    Building,
    Tag,
    ListTree,
    EyeOff
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
import { AdminAuthProvider, useAdminAuth } from '@/firebase/auth/use-admin-auth';
import type { Permissions } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase';

const NavLink = ({ href, pathname, icon: Icon, label }: { href: string; pathname: string; icon: React.ElementType, label: string }) => (
    <Link
        href={href}
        className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
            pathname.startsWith(href) && (href !== '/admin' || pathname === '/admin') ? 'bg-muted text-primary' : ''
        )}
    >
        <Icon className="h-4 w-4" />
        {label}
    </Link>
);

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { toast } = useToast();
    const auth = useAuth();
    const { adminUser, isAuthLoading, hasPermission } = useAdminAuth();
    const [adminName, setAdminName] = React.useState('Admin');

    React.useEffect(() => {
        if (!isAuthLoading && !adminUser && pathname !== '/admin/login') {
            router.push('/admin/login');
        }
        if (adminUser) {
            setAdminName(adminUser.name);
        }
    }, [isAuthLoading, adminUser, router, pathname]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            toast({
                title: 'Logging Out...',
                description: 'You have been logged out successfully.',
            });
            router.push('/admin/login');
        } catch (error) {
            console.error("Logout failed", error);
            toast({
                title: "Logout Failed",
                description: "Could not log you out. Please try again.",
                variant: "destructive"
            });
        }
    };

    if (pathname === '/admin/login') {
        return <>{children}</>;
    }

    if (isAuthLoading || !adminUser) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <p>Loading admin portal...</p>
            </div>
        );
    }
    
    type NavLinkItem = {
        href: string;
        label: string;
        icon: React.ElementType;
        permissionKey: keyof Permissions;
    };
    
    type NavGroup = {
        title: string;
        links: NavLinkItem[];
    }

    const navLinks: NavLinkItem[] = [
        { href: '/admin', label: 'Dashboard', icon: Home, permissionKey: 'dashboard' },
        { href: '/admin/bookings', label: 'Bookings', icon: Briefcase, permissionKey: 'bookings' },
    ];
    
    const managementGroup: NavGroup = {
        title: 'Management',
        links: [
            { href: '/admin/artists', label: 'Artists', icon: Palette, permissionKey: 'artists' },
            { href: '/admin/customers', label: 'Customers', icon: Users, permissionKey: 'customers' },
            { href: '/admin/artist-directory', label: 'Artist Directory', icon: MapPin, permissionKey: 'artistDirectory' },
            { href: '/admin/packages', label: 'Packages', icon: Package, permissionKey: 'packages' },
        ]
    };
    
    const financialGroup: NavGroup = {
        title: 'Financials',
        links: [
            { href: '/admin/payouts', label: 'Payouts', icon: IndianRupee, permissionKey: 'payouts' },
            { href: '/admin/transactions', label: 'Transactions', icon: ListTree, permissionKey: 'transactions' },
            { href: '/admin/promotions', label: 'Promotions', icon: Tag, permissionKey: 'settings' },
        ]
    };

    const settingsGroup: NavGroup = {
        title: 'Platform',
        links: [
            { href: '/admin/analytics', label: 'Analytics', icon: BarChart2, permissionKey: 'dashboard' },
            { href: '/admin/team', label: 'Team', icon: Users, permissionKey: 'settings' },
            { href: '/admin/notifications', label: 'Notifications', icon: Bell, permissionKey: 'settings' },
            { href: '/admin/company-profile', label: 'Company Profile', icon: Building, permissionKey: 'settings' },
            { href: '/admin/images', label: 'Site Images', icon: ImageIcon, permissionKey: 'settings' },
            { href: '/admin/locations', label: 'Locations', icon: MapPin, permissionKey: 'settings' },
            { href: '/admin/financial-settings', label: 'Financials', icon: IndianRupee, permissionKey: 'settings' },
        ]
    };

    const navGroups: NavGroup[] = [managementGroup, financialGroup, settingsGroup];

    const getAccessibleLinks = (group: NavGroup) => group.links.filter(link => hasPermission(link.permissionKey, 'view'));

    const SidebarNav = () => (
         <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {navLinks.filter(l => hasPermission(l.permissionKey, 'view')).map(link => (
                <NavLink key={link.href} {...link} pathname={pathname} />
            ))}
             <Accordion type="multiple" defaultValue={['Management', 'Financials', 'Platform']} className="w-full">
                {navGroups.map(group => {
                    const accessibleLinks = getAccessibleLinks(group);
                    if(accessibleLinks.length === 0) return null;
                    return (
                         <AccordionItem value={group.title} key={group.title} className="border-b-0">
                            <AccordionTrigger className="py-2 text-muted-foreground hover:text-primary hover:no-underline text-base font-normal [&[data-state=open]>svg]:rotate-180">
                                {group.title}
                            </AccordionTrigger>
                            <AccordionContent className="pl-4">
                                <div className="flex flex-col gap-1">
                                {accessibleLinks.map(link => (
                                    <NavLink key={link.href} {...link} pathname={pathname} />
                                ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    )
                })}
            </Accordion>
        </nav>
    );
    
    const currentLink = [...navLinks, ...managementGroup.links, ...financialGroup.links, ...settingsGroup.links].find(link => pathname.startsWith(link.href) && (link.href !== '/admin' || pathname === '/admin'));

    if (currentLink && !hasPermission(currentLink.permissionKey, 'view')) {
         return (
            <div className="flex flex-col items-center justify-center min-h-screen text-center">
                <EyeOff className="w-16 h-16 text-destructive mb-4" />
                <h1 className="text-2xl font-bold">Access Denied</h1>
                <p className="text-muted-foreground">You do not have permission to view this page.</p>
                <Button onClick={() => router.push('/admin')} className="mt-4">Back to Dashboard</Button>
            </div>
        );
    }

    return (
        <div className="grid min-h-screen w-full md:grid-cols-[180px_1fr] lg:grid-cols-[240px_1fr]">
            <aside className="hidden border-r bg-background md:block">
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
                             <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                                <Link href="/admin" className="flex items-center gap-2 font-semibold text-primary">
                                    <Shield className="h-6 w-6" />
                                    <span>Admin Portal</span>
                                </Link>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                <SidebarNav />
                            </div>
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
                                    <AvatarFallback>{adminName ? adminName.charAt(0) : 'A'}</AvatarFallback>
                                </Avatar>
                                <span className="sr-only">Toggle user menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{adminName}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => router.push('/admin/profile')}>My Profile</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </header>
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/20 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}


export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <AdminAuthProvider>
            <AdminLayoutContent>{children}</AdminLayoutContent>
        </AdminAuthProvider>
    )
}
