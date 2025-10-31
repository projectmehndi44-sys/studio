'use client';

import React from 'react';
import Link from 'next/link';
import {
  User,
  LogOut,
  LayoutGrid,
  ShoppingBag,
  Palette,
  LogIn,
  ShieldCheck,
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import type { Customer } from '@/lib/types';

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
  const router = useRouter();
  
  return (
    <header className="flex items-center justify-between w-full px-4 md:px-8 py-2 bg-background/80 backdrop-blur-sm sticky top-0 z-40 border-b">
      <Link href="/" className="flex items-center gap-2">
        <h1 className="font-headline text-xl md:text-3xl font-bold text-accent">
            Utsav<span className="text-primary">Look</span>
        </h1>
      </Link>
      <div className="flex items-center gap-1 md:gap-2">
        {isCustomerLoggedIn && customer ? (
          <>
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
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 p-1 md:p-2">
                    <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${customer?.name}`} alt={customer?.name || 'User'} />
                    <AvatarFallback>
                        {customer?.name ? customer.name.charAt(0).toUpperCase() : '?'}
                    </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline">{customer?.name}</span>
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => router.push('/account')} className="cursor-pointer">
                    <LayoutGrid className="mr-2 h-4 w-4" />
                    <span>My Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={onCustomerLogout}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
           <div className="flex items-center gap-1 md:gap-2">
              <Button variant="ghost" size="sm" onClick={() => router.push('/login')}>
                <LogIn className="mr-1 h-4 w-4" />
                Login
              </Button>
              <Link href="/admin/login">
                <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
                    <ShieldCheck className="h-5 w-5" />
                    <span className="sr-only">Admin</span>
                </Button>
              </Link>
           </div>
        )}
      </div>
    </header>
  );
}
