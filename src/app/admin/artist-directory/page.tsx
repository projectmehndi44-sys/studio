
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { MapPin, Search } from 'lucide-react';
import type { Artist } from '@/lib/types';
import { listenToCollection } from '@/lib/services';

export default function ArtistDirectoryPage() {
    const [artists, setArtists] = React.useState<Artist[]>([]);
    const [searchTerm, setSearchTerm] = React.useState('');

    React.useEffect(() => {
        const unsubscribe = listenToCollection<Artist>('artists', setArtists);
        return () => unsubscribe();
    }, []);

    const filteredArtists = artists.filter(artist => {
        const search = searchTerm.toLowerCase();
        if (!search) return true;

        // Check artist name
        if (artist.name.toLowerCase().includes(search)) return true;

        // Check all service areas
        return artist.serviceAreas?.some(area => 
            area.state.toLowerCase().includes(search) ||
            area.district.toLowerCase().includes(search) ||
            area.localities.toLowerCase().includes(search)
        );
    });

    const getArtistServingAreas = (artist: Artist) => {
        if (!artist.serviceAreas || artist.serviceAreas.length === 0) {
            return 'Not specified';
        }
        return artist.serviceAreas.map(area => `${area.localities} (${area.district}, ${area.state})`).join('; ');
    }


    return (
        <>
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Artist Directory</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><MapPin className="w-6 h-6 text-primary" /> Artist Service Areas</CardTitle>
                    <CardDescription>
                        A real-time directory of all registered artists and their defined service areas.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, state, district, or locality..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Artist Name</TableHead>
                                <TableHead>Service Areas</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredArtists.length > 0 ? filteredArtists.map((artist) => (
                                <TableRow key={artist.id}>
                                    <TableCell className="font-medium">
                                        <Link href={`/admin/artists/${artist.id}`} className="hover:underline text-primary">
                                            {artist.name}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{getArtistServingAreas(artist)}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center">No artists found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    );
}
