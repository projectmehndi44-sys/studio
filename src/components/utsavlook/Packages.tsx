
'use client';

import * as React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { MasterServicePackage } from '@/lib/types';
import { PackageSearch, IndianRupee } from 'lucide-react';

interface PackagesProps {
    packages: MasterServicePackage[];
    onServiceSelect: (service: MasterServicePackage) => void;
}

export function Packages({ packages, onServiceSelect }: PackagesProps) {

    if (packages.length === 0) {
        return null;
    }

    return (
        <>
            {packages.map((service) => {
                const lowestPrice = Math.min(...service.categories.map(c => c.basePrice));
                return (
                    <div key={service.id} className="h-full p-1">
                        <Card 
                            className="bg-background rounded-2xl shadow-brand hover:shadow-brand-lg transition-all duration-300 h-full flex flex-col cursor-pointer group"
                            onClick={() => onServiceSelect(service)}
                        >
                            <CardContent className="p-0 flex flex-col items-center flex-grow">
                                <div className="relative w-full rounded-t-2xl overflow-hidden">
                                    <div className="relative aspect-[4/3] w-full">
                                        <Image
                                            src={service.image}
                                            alt={service.name}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                </div>
                                <div className="p-4 text-center flex-grow flex flex-col">
                                    <h3 className="text-xl font-headline text-primary font-bold">{service.name}</h3>
                                    <p className="text-sm text-muted-foreground mt-1 flex-grow line-clamp-3">
                                        {service.description}
                                    </p>
                                    <div className="flex flex-wrap gap-1 justify-center mt-3">
                                        {service.tags.map(tag => (
                                            <Badge key={tag} variant="secondary" className="capitalize">{tag}</Badge>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="p-4 bg-muted/50 border-t mt-auto">
                               <div className="flex justify-between items-center w-full">
                                    <div className="text-lg font-bold text-primary flex flex-col items-start">
                                        <span className="text-xs font-normal text-muted-foreground">Starts From</span>
                                        <div className="flex items-center">
                                            <IndianRupee className="w-4 h-4 mr-0.5"/>
                                            {lowestPrice.toLocaleString()}
                                        </div>
                                    </div>
                                    <Button 
                                        className="btn-gradient rounded-full"
                                    >
                                        <PackageSearch className="mr-2 h-4 w-4"/>
                                        View Options
                                    </Button>
                                </div>
                            </CardFooter>
                        </Card>
                    </div>
                )
            })}
        </>
    );
}

    
