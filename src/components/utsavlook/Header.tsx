
'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Palette,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
      </div>
    </header>
  );
}
