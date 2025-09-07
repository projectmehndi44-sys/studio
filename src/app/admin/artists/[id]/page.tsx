
'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';
import { Shield, ArrowLeft, DollarSign, BarChart, Star, Users, Briefcase, Calendar as CalendarIcon, Image as ImageIcon, Download } from 'lucide-react';
import type { Artist, Booking, Review } from '@/types';
import { artists as initialArtists } from '@/lib/data';
import NextImage from 'next/image';

// Mock data for a single artist's details - in a real app, this would be fetched
const mockBookings: Booking[] = [
    { id: 'book_01', customerName: 'Priya Patel', date: new Date('2024-07-20'), service: 'Bridal Mehndi', amount: 5000, status: 'Completed' },
    { id: 'book_02', customerName: 'Anjali Sharma', date: new Date('2024-07-25'), service: 'Party Makeup', amount: 3000, status: 'Completed' },
    { id: 'book_03', customerName: 'Sneha Reddy', date: new Date('2024-08-05'), service: 'Mehndi & Makeup', amount: 8000, status: 'Confirmed' },
    { id: 'book_04', customerName: 'Meera Iyer', date: new Date('2024-08-10'), service: 'Engagement Makeup', amount: 4500, status: 'Confirmed' },
];

const mockReviews: Review[] = [
    { id: 'rev_01', customerName: 'Priya Patel', rating: 5, comment: 'Absolutely stunning work! Made my wedding day perfect.' },
    { id: 'rev_02', customerName: 'Anjali Sharma', rating: 4, comment: 'Great makeup, but was a little late. Overall happy with the result.' },
];


export default function ArtistDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const artistId = params.id as string;

    const [artist, setArtist] = React.useState<Artist | null>(null);
    const [bookings] = React.useState<Booking[]>(mockBookings);
    const [reviews] = React.useState<Review[]>(mockReviews);

    React.useEffect(() => {
        const isAdminAuthenticated = localStorage.getItem('isAdminAuthenticated');
        if (isAdminAuthenticated !== 'true') {
            router.push('/admin/login');
        }

        // Fetch artist details from localStorage
        const storedArtists = localStorage.getItem('artists');
        const allArtists: Artist[] = storedArtists ? JSON.parse(storedArtists) : initialArtists;
        const foundArtist = allArtists.find(a => a.id === artistId);
        
        if (foundArtist) {
            setArtist(foundArtist);
        } else {
            toast({
                title: 'Artist not found',
                description: 'The requested artist could not be found.',
                variant: 'destructive',
            });
            router.push('/admin');
        }
    }, [router, artistId, toast]);

    const handleDownload = () => {
        if (!artist) return;

        const dataToDownload = {
            artist,
            bookings,
            reviews,
        };

        const dataStr = JSON.stringify(dataToDownload, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `artist-details-${artist.id}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast({
            title: "Download Started",
            description: `Details for ${artist.name} are being downloaded.`,
        });
    };

    if (!artist) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    const totalRevenue = bookings.reduce((acc, booking) => acc + booking.amount, 0);
    const platformFee = totalRevenue * 0.1; // 10% platform fee
    const netPayout = totalRevenue - platformFee;
    const bookedDates = bookings.map(b => b.date);

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6 justify-between">
                <h1 className="flex items-center gap-2 text-xl font-bold text-primary">
                    <Shield className="w-6 h-6" />
                    Artist Management
                </h1>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleDownload}><Download className="mr-2 h-4 w-4"/> Download Details</Button>
                    <Link href="/admin">
                        <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4"/> Back to Dashboard</Button>
                    </Link>
                </div>
            </header>
            <main className="flex-1 p-4 sm:px-6 sm:py-0 md:gap-8">
                 <div className="max-w-7xl mx-auto grid gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center gap-4">
                            <Avatar className="h-20 w-20 border">
                                <AvatarImage src={artist.profilePicture} alt={artist.name}/>
                                <AvatarFallback>{artist.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="grid gap-1">
                                <CardTitle className="text-3xl">{artist.name}</CardTitle>
                                <CardDescription>{artist.location}</CardDescription>
                                <div className="flex items-center gap-2">
                                     {artist.services.map((service) => (
                                        <Badge key={service} variant="secondary" className="capitalize">{service}</Badge>
                                    ))}
                                    <Badge variant="default">{artist.rating} <Star className="ml-1 h-3 w-3"/></Badge>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>

                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground">from {bookings.length} bookings</p>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Platform Fees (10%)</CardTitle>
                                <BarChart className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">₹{platformFee.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground">Total fees collected</p>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Net Payout</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">₹{netPayout.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground">Total amount paid to artist</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <Card className="lg:col-span-1">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><CalendarIcon className="w-5 h-5 text-primary"/> Availability Calendar</CardTitle>
                                <CardDescription>Green dates indicate bookings.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex justify-center">
                                <Calendar
                                    mode="multiple"
                                    selected={bookedDates}
                                    className="rounded-md border"
                                    classNames={{ day_selected: "bg-green-500 text-white hover:bg-green-600 focus:bg-green-600" }}
                                />
                            </CardContent>
                        </Card>

                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Briefcase className="w-5 h-5 text-primary"/> Recent Bookings</CardTitle>
                                <CardDescription>Most recent bookings for this artist.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Customer</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {bookings.map(booking => (
                                            <TableRow key={booking.id}>
                                                <TableCell>{booking.customerName}</TableCell>
                                                <TableCell>{booking.date.toLocaleDateString()}</TableCell>
                                                <TableCell>₹{booking.amount}</TableCell>
                                                <TableCell>
                                                    <Badge variant={booking.status === 'Completed' ? 'default' : 'secondary'}>
                                                        {booking.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-primary"/> Customer Reviews</CardTitle>
                                <CardDescription>{reviews.length} reviews received</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {reviews.map(review => (
                                    <div key={review.id} className="border-l-4 border-accent pl-4">
                                        <div className="flex items-center justify-between">
                                            <p className="font-semibold">{review.customerName}</p>
                                            <div className="flex items-center gap-1 text-amber-500">
                                                <span className="font-bold">{review.rating}</span>
                                                <Star className="w-4 h-4 fill-current"/>
                                            </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground italic">"{review.comment}"</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><ImageIcon className="w-5 h-5 text-primary"/> Work Gallery</CardTitle>
                                <CardDescription>Portfolio images uploaded by the artist.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                               {artist.workImages.map((src, index) => (
                                   <div key={index} className="relative aspect-w-1 aspect-h-1">
                                       <NextImage src={src} alt={`${artist.name}'s work ${index + 1}`} layout="fill" className="rounded-md object-cover"/>
                                   </div>
                               ))}
                            </CardContent>
                        </Card>
                    </div>
                 </div>
            </main>
        </div>
    );
}
