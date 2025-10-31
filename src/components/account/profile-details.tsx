'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Customer } from "@/lib/types";
import Image from "next/image";
import { placeholderImages } from "@/lib/placeholder-images.json";
import { Button } from "../ui/button";
import { Mail, Phone, User } from "lucide-react";

interface ProfileDetailsProps {
    customer: Customer;
}

export const ProfileDetails = ({ customer }: ProfileDetailsProps) => {
    const userAvatar = placeholderImages.find(p => p.id === 'user-avatar');

    return (
        <Card className="shadow-lg rounded-lg overflow-hidden h-full">
            <CardHeader className="text-center items-center bg-primary/5 p-6">
                <div className="relative mb-4">
                    <Image 
                        src={userAvatar?.imageUrl || ''} 
                        alt={customer.name}
                        width={100}
                        height={100}
                        className="rounded-full border-4 border-card shadow-md"
                        data-ai-hint={userAvatar?.imageHint}
                    />
                </div>
                <CardTitle className="text-2xl text-primary">{customer.name}</CardTitle>
                <CardDescription>Customer since {new Date().getFullYear()}</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
                <ul className="space-y-4 text-sm">
                    <li className="flex items-center gap-3">
                        <User className="h-5 w-5 text-accent" />
                        <span className="text-muted-foreground">{customer.name}</span>
                    </li>
                    <li className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-accent" />
                        <span className="text-muted-foreground">{customer.phone}</span>
                    </li>
                    <li className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-accent" />
                        <span className="text-muted-foreground">{customer.email || 'Not provided'}</span>
                    </li>
                </ul>
                <Button className="w-full mt-6 bg-accent text-accent-foreground hover:bg-accent/90">Edit Profile</Button>
            </CardContent>
        </Card>
    );
}
