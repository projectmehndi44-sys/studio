

'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Bell, Send, Upload, Image as ImageIcon, Users, User } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminAuth } from '@/hooks/use-admin-auth';
import type { Artist, Customer } from '@/lib/types';
import { listenToCollection } from '@/lib/services';

export default function NotificationPage() {
    const { toast } = useToast();
    const { hasPermission } = useAdminAuth();
    const [isLoading, setIsLoading] = React.useState(false);
    const [imagePreview, setImagePreview] = React.useState<string | null>(null);
    const [selectedUsers, setSelectedUsers] = React.useState<string[]>([]);
    
    const [artists, setArtists] = React.useState<Artist[]>([]);
    const [customers, setCustomers] = React.useState<Customer[]>([]);

    React.useEffect(() => {
        const unsubscribeArtists = listenToCollection<Artist>('artists', setArtists);
        const unsubscribeCustomers = listenToCollection<Customer>('customers', setCustomers);

        return () => {
            unsubscribeArtists();
            unsubscribeCustomers();
        }
    }, []);
    
    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSendNotification = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // This is a mock sending function.
        // In a real app, you would integrate with a notification service (e.g., Firebase Cloud Messaging, OneSignal)
        // and a WhatsApp API provider (e.g., Twilio).
        setTimeout(() => {
            toast({
                title: 'Notification Sent!',
                description: 'Your notification has been queued for delivery.',
            });
            setIsLoading(false);
        }, 1500);
    };

    const handleUserSelection = (id: string) => {
        setSelectedUsers(prev => 
            prev.includes(id) ? prev.filter(userId => userId !== id) : [...prev, id]
        );
    }

    return (
        <>
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Send Notifications</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="w-6 h-6 text-primary"/> Notification Composer
                    </CardTitle>
                    <CardDescription>
                        Communicate with your artists and customers. Select an audience and compose your message.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSendNotification}>
                        <Tabs defaultValue="bulk">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="bulk">
                                    <Users className="mr-2 h-4 w-4"/>Bulk Notification
                                </TabsTrigger>
                                <TabsTrigger value="individual">
                                    <User className="mr-2 h-4 w-4"/>Individual Notification
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="bulk" className="mt-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Bulk Messaging</CardTitle>
                                        <CardDescription>Send a notification to all users or a specific group.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                         <div className="space-y-2">
                                            <Label>Audience</Label>
                                            <div className="flex items-center space-x-4">
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox id="bulk-artists" defaultChecked/>
                                                    <Label htmlFor="bulk-artists">All Artists</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox id="bulk-customers" defaultChecked/>
                                                    <Label htmlFor="bulk-customers">All Customers</Label>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            <TabsContent value="individual" className="mt-4">
                               <Card>
                                    <CardHeader>
                                        <CardTitle>Individual Messaging</CardTitle>
                                        <CardDescription>Select specific artists or customers to notify.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="max-h-64 overflow-y-auto border rounded-md p-2">
                                            <h3 className="font-semibold mb-2">Artists ({artists.length})</h3>
                                            <div className="space-y-2">
                                                {artists.map(artist => (
                                                    <div key={`artist-${artist.id}`} className="flex items-center space-x-2">
                                                        <Checkbox id={`artist-check-${artist.id}`} onCheckedChange={() => handleUserSelection(artist.id)} checked={selectedUsers.includes(artist.id)}/>
                                                        <Label htmlFor={`artist-check-${artist.id}`}>{artist.name}</Label>
                                                    </div>
                                                ))}
                                            </div>
                                            <h3 className="font-semibold my-2">Customers ({customers.length})</h3>
                                            <div className="space-y-2">
                                                {customers.map(customer => (
                                                    <div key={`customer-${customer.id}`} className="flex items-center space-x-2">
                                                        <Checkbox id={`customer-check-${customer.id}`} onCheckedChange={() => handleUserSelection(customer.id)} checked={selectedUsers.includes(customer.id)}/>
                                                        <Label htmlFor={`customer-check-${customer.id}`}>{customer.name}</Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{selectedUsers.length} user(s) selected.</p>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>

                        <Card className="mt-6">
                            <CardHeader>
                                <CardTitle>Message Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Notification Title</Label>
                                    <Input id="title" placeholder="e.g., New Feature Announcement!" required/>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="message">Message Body</Label>
                                    <Textarea id="message" placeholder="Craft your message here..." className="min-h-32" required/>
                                </div>
                                 <div className="space-y-2">
                                    <Label>Optional Image</Label>
                                    <div className="flex items-center gap-4">
                                        <div className="relative flex-1 border-2 border-dashed border-muted-foreground/50 rounded-lg p-4 text-center hover:border-accent">
                                            <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground" />
                                            <p className="mt-2 text-xs text-muted-foreground">Click to upload</p>
                                            <Input id="image-upload" type="file" className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" onChange={handleImageUpload} />
                                        </div>
                                        {imagePreview && (
                                            <div className="w-24 h-24 rounded-md overflow-hidden border">
                                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 pt-4">
                                    <Switch id="whatsapp-toggle" />
                                    <Label htmlFor="whatsapp-toggle">Also send directly to WhatsApp (where available)</Label>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Note: WhatsApp integration requires a separate setup with a service like Twilio. This is a simulation.
                                </p>
                            </CardContent>
                        </Card>
                        
                        <div className="mt-6">
                            <Button type="submit" className="w-full" disabled={isLoading || !hasPermission('notifications', 'edit')}>
                                {isLoading ? 'Sending...' : <><Send className="mr-2 h-4 w-4"/>Send Notification</>}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </>
    );
}
