'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Palette,
  User,
  Shield,
  Briefcase,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Customer } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  isCustomerLoggedIn: boolean;
  onCustomerLogout: () => void;
  customer: Customer | null;
  cartCount: number;
}

export function Header({
  isCustomerLoggedIn,
  onCustomerLogout,
  customer,
  cartCount,
}: HeaderProps) {
  
  return (
    <header className="flex items-center justify-between w-full px-4 md:px-8 py-2 bg-background/80 backdrop-blur-sm sticky top-0 z-40 border-b">
      <Link href="/" className="flex items-center gap-2">
        <h1 className="font-headline text-xl md:text-3xl font-bold text-accent">
            Utsav<span className="text-primary">Look</span>
        </h1>
      </Link>
      <div className="flex items-center gap-1 md:gap-2">
            <Button variant="ghost" className="relative" asChild>
                <Link href="/cart">
                    <ShoppingBag className="h-6 w-6"/>
                    {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs flex items-center justify-center text-white border-2 border-background">
                            {cartCount}
                        </span>
                    )}
                    <span className="sr-only">View Cart</span>
                </Link>
            </Button>
            
            {isCustomerLoggedIn && customer ? (
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${customer.name}`} alt={customer.name} />
                                <AvatarFallback>{customer.name ? customer.name.charAt(0) : 'U'}</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Hi, {customer.name}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild><Link href="/account" className="flex items-center"><User className="mr-2 h-4 w-4" />Dashboard</Link></DropdownMenuItem>
                        <DropdownMenuItem asChild><Link href="/account/profile" className="flex items-center"><User className="mr-2 h-4 w-4" />My Profile</Link></DropdownMenuItem>
                        <DropdownMenuItem asChild><Link href="/account/bookings" className="flex items-center"><Briefcase className="mr-2 h-4 w-4" />My Bookings</Link></DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={onCustomerLogout} className="text-destructive"><LogOut className="mr-2 h-4 w-4" />Logout</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : (
                <Button asChild className="btn-gradient rounded-full">
                    <Link href="/login">
                        <User className="mr-2 h-4 w-4" /> Login
                    </Link>
                </Button>
            )}
             <div className="hidden md:block">
              <Button variant="outline" size="icon" asChild>
                <Link href="/admin">
                  <Shield className="h-5 w-5" />
                  <span className="sr-only">Admin Portal</span>
                </Link>
              </Button>
            </div>
      </div>
    </header>
  );
}
