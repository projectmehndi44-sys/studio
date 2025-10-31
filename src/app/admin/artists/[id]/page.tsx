'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';
import { IndianRupee, BarChart, Star, Users, Briefcase, Calendar as CalendarIcon, Image as ImageIcon, Download, ChevronDown, ArrowLeft, CheckCircle } from 'lucide-react';
import type { Artist, Booking, Review } from '@/lib/types';
import { getArtist, listenToCollection, getFinancialSettings } from '@/lib/services';
import NextImage from 'next/image';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { exportToExcel, exportToPdf } from '@/lib/export';
import { collection, query, where, getFirestore, Timestamp } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { parseISO, isValid } from 'date-fns';

const getSafeDate = (date: any): Date => {
    if (!date) return new Date();
    if (date instanceof Date && isValid(date)) return date;
    if (date instanceof Timestamp) return date.toDate();
    if (typeof date === 'string') {
        const parsed = parseISO(date);
        if (isValid(parsed)) return parsed;
    }
    // Fallback for any other case
    return new Date();
}

export default function ArtistDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const artistId = params.id as string;

    const [artist, setArtist] = React.useState<Artist | null>(null);
    const [bookings, setBookings] = React.useState<Booking[]>([]);
    const [platformFeePercentage, setPlatformFeePercentage] = React.useState(0.1); // Default value

    React.useEffect(() => {
        getFinancialSettings().then(settings => {
            setPlatformFeePercentage(settings.platformFeePercentage / 100);
        });
    }, []);
    
    React.useEffect(() => {
        if (!artistId) return;

        const fetchArtist = async () => {
            const foundArtist = await getArtist(artistId);
             if (foundArtist) {
                setArtist(foundArtist);
            } else {
                toast({
                    title: 'Artist not found',
                    description: 'The requested artist could not be found.',
                    variant: 'destructive',
                });
                router.push('/admin/artists');
            }
        };
        
        fetchArtist();
        
        const db = getFirestore(app);
        const bookingsQuery = query(collection(db, 'bookings'), where('artistIds', 'array-contains', artistId));

        const unsubscribeBookings = listenToCollection<Booking>('bookings', setBookings, bookingsQuery);

        return () => unsubscribeBookings();

    }, [router, artistId, toast]);

    const handleDownload = (format: 'pdf' | 'excel') => {
        if (!artist) return;
        
        const artistBookings = bookings.filter(b => b.status === 'Completed' || b.status === 'Confirmed');

        const dataToDownload = {
            artist,
            bookings: artistBookings,
            reviews: artist.reviews || [],
        };

        if (format === 'pdf') {
            exportToPdf(dataToDownload);
        } else if (format === 'excel') {
            exportToExcel([dataToDownload]);
        }

        toast({
            title: "Download Started",
            description: `Details for ${artist.name} are being downloaded as a ${format.toUpperCase()} file.`,
        });
    };

    if (!artist) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    const completedBookings = bookings.filter(b => b.status === 'Completed');
    const totalRevenue = completedBookings.reduce((acc, booking) => acc + booking.amount, 0);
    
    const platformFee = totalRevenue * platformFeePercentage;
    const netPayout = totalRevenue - platformFee;

    const bookedDates = bookings
        .filter(b => b.status === 'Confirmed' || b.status === 'Completed')
        .flatMap(b => b.serviceDates?.map(getSafeDate) || []);
    
    const unavailableDates = (artist.unavailableDates || []).map(getSafeDate);


    return (
        <>
            <div className="flex items-center justify-between gap-4">
                 <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-lg font-semibold md:text-2xl">Artist Details</h1>
                </div>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                            <Download className="mr-2 h-4 w-4"/>
                            <span className="hidden sm:inline">Download Report</span>
                            <ChevronDown className="ml-2 h-4 w-4"/>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => handleDownload('pdf')}>PDF</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleDownload('excel')}>Excel</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="grid gap-4 md:gap-8">
                <Card>
                    <CardHeader className="flex flex-col md:flex-row items-start md:items-center gap-4">
                        <Avatar className="h-20 w-20 border">
                            <AvatarImage src={artist.profilePicture} alt={artist.name}/>
                            <AvatarFallback>{artist.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="grid gap-1">
                            <CardTitle className="text-3xl flex items-center gap-2">
                                {artist.name}
                                {artist.verified && (
                                    <Badge className="bg-green-600 text-white pl-2 text-sm">
                                        <CheckCircle className="w-4 h-4 mr-1"/>
                                        UtsavLook Verified
                                    </Badge>
                                )}
                                 {artist.isFoundersClubMember && (
                                    <Badge className="bg-amber-500 text-white pl-2 text-sm">
                                        <Star className="w-4 h-4 mr-1 fill-current"/>
                                        Founder's Club
                                    </Badge>
                                )}
                            </CardTitle>
                            <CardDescription>{artist.location}</CardDescription>
                            <div className="flex flex-wrap items-center gap-2">
                                    {(artist.services || []).map((service) => (
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
                            <IndianRupee className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">from {completedBookings.length} completed bookings</p>
                        </CardContent>
                    </Card>
                        <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Platform Fees</CardTitle>
                            <BarChart className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₹{platformFee.toLocaleString(undefined, { maximumFractionDigits: 0}) }</div>
                            <p className="text-xs text-muted-foreground">Based on {platformFeePercentage * 100}% of revenue</p>
                        </CardContent>
                    </Card>
                        <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Net Payout</CardTitle>
                            <IndianRupee className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">₹{netPayout.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                            <p className="text-xs text-muted-foreground">Total amount due to artist</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><CalendarIcon className="w-5 h-5 text-primary"/> Availability Calendar</CardTitle>
                            <CardDescription>Orange indicates bookings. Red indicates manually set unavailable dates.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-center">
                           <Calendar
                                mode="multiple"
                                selected={[...bookedDates, ...unavailableDates]}
                                modifiers={{ booked: bookedDates, unavailable: unavailableDates }}
                                className="rounded-md border"
                                classNames={{
                                    day_modifier_booked: "bg-orange-500 text-white hover:bg-orange-600 focus:bg-orange-600",
                                    day_modifier_unavailable: "bg-red-500 text-white hover:bg-red-600 focus:bg-red-600"
                                }}
                            />
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Briefcase className="w-5 h-5 text-primary"/> Recent Bookings</CardTitle>
                            <CardDescription>Most recent bookings for this artist.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <div className="overflow-x-auto">
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
                                    {bookings.slice(0, 5).map(booking => (
                                        <TableRow key={booking.id}>
                                            <TableCell>{booking.customerName}</TableCell>
                                            <TableCell>{getSafeDate(booking.eventDate).toLocaleDateString()}</TableCell>
                                            <TableCell>₹{booking.amount}</TableCell>
                                            <TableCell>
                                                <Badge variant={booking.status === 'Completed' ? 'default' : 'secondary'}>
                                                    {booking.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                     {bookings.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center">No bookings found for this artist.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                           </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-primary"/> Customer Reviews</CardTitle>
                            <CardDescription>{(artist.reviews || []).length} reviews received</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {(artist.reviews || []).map((review, index) => (
                                <div key={index} className="border-l-4 border-accent pl-4">
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
                             {(artist.reviews || []).length === 0 && (
                                <p className="text-center text-muted-foreground">No reviews yet for this artist.</p>
                             )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><ImageIcon className="w-5 h-5 text-primary"/> Work Gallery</CardTitle>
                            <CardDescription>Portfolio images uploaded by the artist.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {(artist.workImages || []).map((src, index) => (
                                <div key={index} className="relative aspect-square">
                                    <NextImage src={src} alt={`${artist.name}'s work ${index + 1}`} fill={true} className="rounded-md object-cover"/>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
