'use client';

import * as React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MakeupIcon, MehndiIcon, PhotographyIcon } from '@/components/icons';
import type { MasterServicePackage } from '@/types';
import { PackageSearch } from 'lucide-react';

interface PackagesProps {
    packages: MasterServicePackage[];
    onServiceSelect: (service: MasterServicePackage) => void;
}

const getServiceIcon = (service: MasterServicePackage['service']) => {
    switch(service) {
        case 'mehndi': return <MehndiIcon className="w-3.5 h-3.5"/>;
        case 'makeup': return <MakeupIcon className="w-3.5 h-3.5"/>;
        case 'photography': return <PhotographyIcon className="w-3.5 h-3.5"/>;
        default: return null;
    }
}


export function Packages({ packages, onServiceSelect }: PackagesProps) {

    if (packages.length === 0) {
        return (
            <div className="text-center py-16">
                <p className="text-lg text-muted-foreground">No services have been configured for this category yet.</p>
            </div>
        );
    }

    return (
        <div className="py-12">
            <h2 className="text-center font-headline text-4xl md:text-5xl text-primary mb-8">Our Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {packages.map((service) => {
                    const lowestPrice = Math.min(...service.categories.map(c => c.basePrice));
                    return (
                        <div key={service.id} className="p-1 h-full">
                            <Card className="overflow-hidden flex flex-col h-full hover:shadow-xl transition-shadow">
                                <CardHeader className="p-0">
                                     <Image src={service.image} alt={service.name} width={400} height={250} className="w-full object-cover aspect-video" data-ai-hint="mehndi design"/>
                                </CardHeader>
                                <CardContent className="p-4 flex-grow">
                                    <CardTitle className="text-xl font-bold text-primary mb-2">{service.name}</CardTitle>
                                    <p className="text-sm text-muted-foreground mb-3">{service.description}</p>
                                    <div className="flex flex-wrap gap-1">
                                        {service.tags.map(tag => (
                                            <Badge key={tag} variant="secondary" className="gap-1.5 pl-2">
                                                {getServiceIcon(service.service)}
                                                <span className="capitalize">{tag}</span>
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                                <CardFooter className="p-4 bg-background/50 flex justify-between items-center mt-auto">
                                    <div className="text-lg font-bold text-primary">
                                        <span className="text-xs font-normal text-muted-foreground">Starts from</span><br/>
                                        ₹{lowestPrice.toLocaleString()}
                                    </div>
                                    <Button 
                                        onClick={() => onServiceSelect(service)} 
                                        className="bg-accent hover:bg-accent/90"
                                    >
                                        <PackageSearch className="mr-2 h-4 w-4"/>
                                        View Options
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}
