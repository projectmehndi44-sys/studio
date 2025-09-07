
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Shield, Users, MapPin, Image as ImageIcon, User, ArrowLeft, AreaChart, Tag, IndianRupee, Package } from 'lucide-react';

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
        { href: "/admin/packages", icon: Package, title: "Package Management", description: "Create and manage service packages for customers." },
        { href: "/admin/promotions", icon: Tag, title: "Promotions Management", description: "Create and manage discount and promotional codes." },
        { href: "/admin/team", icon: Users, title: "Team Management", description: "Add or manage team members and their roles." },
        { href: "/admin/locations", icon: MapPin, title: "Location Management", description: "Set the states and districts where you operate." },
        { href: "/admin/images", icon: ImageIcon, title: "Site Image Management", description: "Update homepage gallery and background images." },
        { href: "/admin/profile", icon: User, title: "Manage Your Profile", description: "Update your personal admin account details." },
        { href: "/admin/financial-settings", icon: IndianRupee, title: "Financial Settings", description: "Set GSTIN, platform fees, and other financial rules." },
    ];

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6 justify-between">
                <h1 className="flex items-center gap-2 text-xl font-bold text-primary">
                    <Shield className="w-6 h-6" />
                    Admin Settings
                </h1>
                <Link href="/admin">
                    <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Button>
                </Link>
            </header>
            <main className="flex-1 p-4 sm:px-6 sm:py-0 md:gap-8">
                <div className="max-w-4xl mx-auto grid gap-6 py-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Platform Configuration</CardTitle>
                            <CardDescription>
                                Manage global settings, content, and users for your application.
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                </div>
            </main>
        </div>
    );
}
