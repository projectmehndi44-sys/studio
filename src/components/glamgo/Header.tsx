

'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  User,
  ShieldCheck,
  LogOut,
  LayoutGrid
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
import type { Customer } from '@/types';

interface HeaderProps {
  isCustomerLoggedIn: boolean;
  onCustomerLogout: () => void;
  customer: Customer | null;
}

export function Header({
  isCustomerLoggedIn,
  onCustomerLogout,
  customer,
}: HeaderProps) {
  const router = useRouter();

  return (
    <header className="flex items-center justify-between w-full px-4 md:px-8 py-2 bg-background/80 backdrop-blur-sm sticky top-0 z-40 border-b">
      <Link href="/" className="flex items-center gap-2">
        <Sparkles className="w-8 h-8 text-accent" />
         <h1 className="font-headline text-3xl font-bold text-primary">
            Mehendi<span className="text-accent">f</span>y
        </h1>
      </Link>
      <div className="flex items-center gap-2">
        {isCustomerLoggedIn && customer ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                   <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${customer?.name}`} alt={customer?.name || 'User'} />
                  <AvatarFallback>
                    {customer?.name ? customer.name.charAt(0).toUpperCase() : '?'}
                  </AvatarFallback>
                </Avatar>
                <span>{customer?.name}</span>
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
        ) : (
           <Link href="/admin/login">
            <Button variant="outline">
                <ShieldCheck className="mr-2 h-4 w-4" /> Admin Portal
            </Button>
            </Link>
        )}
      </div>
    </header>
  );
}

    
