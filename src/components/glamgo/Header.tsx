'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  User,
  Palette,
  ShieldCheck,
  LogOut,
  LogIn,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  isCustomerLoggedIn: boolean;
  onCustomerLogout: () => void;
  customer: { name: string } | null;
}

export function Header({
  isCustomerLoggedIn,
  onCustomerLogout,
  customer,
}: HeaderProps) {
  const router = useRouter();
  const { toast } = useToast();

  const handleArtistLogin = () => {
    // This function is now primarily for showing the toast, as navigation is handled by the Link component.
    toast({
      title: 'Artist Login',
      description: 'Please enter your artist credentials.',
    });
  };

  return (
    <header className="flex items-center justify-between w-full px-4 md:px-8 py-2 bg-background/80 backdrop-blur-sm sticky top-0 z-40 border-b">
      <div className="flex items-center gap-2">
        <Sparkles className="w-8 h-8 text-accent" />
        <Link href="/" className="flex items-center gap-2">
          <h1 className="font-headline text-5xl text-primary">GlamGo</h1>
        </Link>
      </div>
      <div className="flex items-center gap-2">
        {isCustomerLoggedIn ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {customer?.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>{customer?.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={onCustomerLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/admin/login" passHref>
               <Button variant="outline">
                  <ShieldCheck className="mr-2 h-4 w-4" /> Admin Portal
               </Button>
            </Link>
             <Link href="/admin/login" passHref>
                <Button>
                    <Palette className="mr-2 h-4 w-4" /> Artist Login
                </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
