
'use client';

import * as React from 'react';
import Image from 'next/image';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MehndiIcon } from '@/components/icons';
import { packages as allPackages } from '@/lib/packages-data';
import type { MehndiPackage } from '@/types';
import { Check, PackagePlus } from 'lucide-react';
import Autoplay from "embla-carousel-autoplay"


interface PackagesProps {
    onAddToCart: (pkg: MehndiPackage) => void;
    cart: MehndiPackage[];
}

export function Packages({ onAddToCart, cart }: PackagesProps) {
    return (
        <div className="py-12">
            <h2 className="text-center font-headline text-5xl text-primary mb-8">Our Packages</h2>
             <Carousel opts={{ align: "start", loop: true, }} plugins={[ Autoplay({ delay: 5000, }), ]} className="w-full max-w-7xl mx-auto" >
                <CarouselContent>
                    {allPackages.map((pkg) => {
                        const isInCart = cart.some(item => item.id === pkg.id);
                        return (
                            <CarouselItem key={pkg.id} className="md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                                <div className="p-1 h-full">
                                    <Card className="overflow-hidden flex flex-col h-full hover:shadow-xl transition-shadow">
                                        <CardHeader className="p-0">
                                             <Image src={pkg.image} alt={pkg.name} width={400} height={250} className="w-full object-cover aspect-video" data-ai-hint="mehndi design"/>
                                        </CardHeader>
                                        <CardContent className="p-4 flex-grow">
                                            <CardTitle className="text-xl font-bold text-primary mb-2">{pkg.name}</CardTitle>
                                            <p className="text-sm text-muted-foreground mb-3">{pkg.description}</p>
                                            <div className="flex flex-wrap gap-1">
                                                {pkg.tags.map(tag => (
                                                    <Badge key={tag} variant="secondary" className="gap-1.5 pl-2">
                                                        <MehndiIcon className="w-3.5 h-3.5"/>
                                                        <span className="capitalize">{tag}</span>
                                                    </Badge>
                                                ))}
                                            </div>
                                        </CardContent>
                                        <CardFooter className="p-4 bg-background/50 flex justify-between items-center mt-auto">
                                            <div className="text-lg font-bold text-primary">
                                                <span className="text-xs font-normal text-muted-foreground">Starting from</span><br/>
                                                ₹{pkg.price.toLocaleString()}
                                            </div>
                                            <Button 
                                                onClick={() => onAddToCart(pkg)} 
                                                className={isInCart ? "bg-green-600 hover:bg-green-700" : "bg-accent hover:bg-accent/90"}
                                                disabled={isInCart}
                                            >
                                                {isInCart ? <Check className="mr-2 h-4 w-4"/> : <PackagePlus className="mr-2 h-4 w-4"/>}
                                                {isInCart ? 'Added' : 'Add to Booking'}
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                </div>
                            </CarouselItem>
                        )
                    })}
                </CarouselContent>
            </Carousel>
        </div>
    );
}
