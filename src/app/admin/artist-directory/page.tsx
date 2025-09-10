

'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { MapPin, Search } from 'lucide-react';
import type { Artist } from '@/types';
import { getArtists } from '@/lib/services';

export default function ArtistDirectoryPage() {
    const [artists, setArtists] = React.useState<Artist[]>([]);
    const [searchTerm, setSearchTerm] = React.useState('');

    React.useEffect(() => {
        getArtists().then(setArtists);
    }, []);

    const filteredArtists = artists.filter(artist => {
        const search = searchTerm.toLowerCase();
        return (
            artist.name.toLowerCase().includes(search) ||
            artist.location.toLowerCase().includes(search) ||
            artist.state?.toLowerCase().includes(search) ||
            artist.district?.toLowerCase().includes(search) ||
            artist.locality?.toLowerCase().includes(search) ||
            artist.servingAreas?.toLowerCase().includes(search)
        );
    });

    return (
        <>
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Artist Directory</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><MapPin className="w-6 h-6 text-primary" /> Artist Locations</CardTitle>
                    <CardDescription>
                        A real-time directory of all registered artists and their service locations.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, state, district, locality..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Artist Name</TableHead>
                                <TableHead>State</TableHead>
                                <TableHead>District</TableHead>
                                <TableHead>Primary Locality</TableHead>
                                <TableHead>Serving Areas</TableHead>
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
                                    <TableCell>{artist.state || 'N/A'}</TableCell>
                                    <TableCell>{artist.district || 'N/A'}</TableCell>
                                    <TableCell>{artist.locality || 'N/A'}</TableCell>
                                    <TableCell>{artist.servingAreas || 'N/A'}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center">No artists found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    );
}
