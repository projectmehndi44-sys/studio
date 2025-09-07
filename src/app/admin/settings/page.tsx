
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Shield, Users, MapPin, Image as ImageIcon, User, ArrowLeft, AreaChart, Tag, IndianRupee } from 'lucide-react';

export default function SettingsPage() {
    const router = useRouter();

    React.useEffect(() => {
        const isAdminAuthenticated = localStorage.getItem('isAdminAuthenticated');
        if (isAdminAuthenticated !== 'true') {
            router.push('/admin/login');
        }
    }, [router]);

    const settingsLinks = [
        { href: "/admin/analytics", icon: AreaChart, title: "Analytics Dashboard", description: "View charts and reports on platform performance." },
        { href: "/admin/promotions", icon: Tag, title: "Promotions Management", description: "Create and manage discount and promotional codes." },
        { href: "/admin/team", icon: Users, title: "Team Management", description: "Add or manage team members and their roles." },
        { href: "/admin/locations", icon: MapPin, title: "Location Management", description: "Set the states and districts where you operate." },
        { href: "/admin/images", icon: ImageIcon, title: "Site Image Management", description: "Update homepage gallery and background images." },
        { href: "/admin/profile", icon: User, title: "Manage Your Profile", description: "Update your personal admin account details." },
        { href: "/admin/financial-settings", icon: IndianRupee, title: "Financial Settings", description: "Set GSTIN, platform fees, and other financial rules." },
    ];

    return (
        <>
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Settings</h1>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {settingsLinks.map((link) => (
                    <Card key={link.href}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <link.icon className="w-5 h-5 text-primary" />
                                {link.title}
                            </CardTitle>
                            <CardDescription>{link.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Link href={link.href}>
                                <Button variant="outline" className="w-full">
                                    Go to {link.title.split(' ')[0]}
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </>
    );
}

