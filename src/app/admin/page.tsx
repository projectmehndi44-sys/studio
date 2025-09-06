'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

export default function AdminPage() {
    // In a real application, you would protect this route and fetch real data.
    const pendingArtists = [
        { id: 1, name: 'Creative Hands by S', email: 's@example.com', date: '2023-10-27' },
        { id: 2, name: 'Makeup by Riya', email: 'riya@example.com', date: '2023-10-26' },
    ];

    const registeredCustomers = [
        { id: 1, name: 'Alice', email: 'alice@example.com', bookings: 2 },
        { id: 2, name: 'Bob', email: 'bob@example.com', bookings: 5 },
    ];
    
    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <div className="flex flex-col sm:gap-4 sm:py-4">
                <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                    <h1 className="flex items-center gap-2 text-2xl font-bold text-primary">
                        <Shield className="w-8 h-8" />
                        Admin Portal
                    </h1>
                </header>
                <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                    <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Pending Artist Approvals</CardTitle>
                                <CardDescription>
                                    Review and approve new artist registrations.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {/* Placeholder for artist approvals list */}
                                <p>List of pending artists will be displayed here.</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Customer Management</CardTitle>
                                <CardDescription>
                                    View and manage registered customers.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {/* Placeholder for customer list */}
                                <p>Customer data and controls will be available here.</p>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle>All Data Control</CardTitle>
                                <CardDescription>
                                    Manage all application data from this central hub.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                               <p>Advanced data management features will be added here.</p>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    );
}
