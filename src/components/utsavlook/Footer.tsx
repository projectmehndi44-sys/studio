
'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
} from 'lucide-react';

export function Footer() {

  return (
    <footer className="w-full bg-secondary text-secondary-foreground mt-16 border-t">
        <div className="container mx-auto py-12 px-4 md:px-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            <div className="flex flex-col gap-2">
                <Link href="/" className="flex items-center gap-2">
                    <Sparkles className="w-8 h-8 text-accent" />
                    <h1 className="font-headline text-3xl font-bold text-accent">
                        Utsav<span className="text-primary">Look</span>
                    </h1>
                </Link>
                 <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} UtsavLook. All rights reserved.</p>
            </div>

            <div>
                <h4 className="font-bold mb-2 text-primary">For Customers</h4>
                <nav className="flex flex-col gap-1 text-sm">
                    <Link href="/#services" className="hover:text-accent">Book a Service</Link>
                    <Link href="/account" className="hover:text-accent">My Account</Link>
                    <Link href="/cart" className="hover:text-accent">My Cart</Link>
                </nav>
            </div>
            <div>
                <h4 className="font-bold mb-2 text-primary">For Artists</h4>
                <nav className="flex flex-col gap-1 text-sm">
                    <Link href="/artist" className="hover:text-accent">Artist Program</Link>
                    <Link href="/artist/register" className="hover:text-accent">Register as an Artist</Link>
                    <Link href="/artist/login" className="hover:text-accent">Artist Login</Link>
                </nav>
            </div>
            <div>
                 <h4 className="font-bold mb-2 text-primary">Company</h4>
                <nav className="flex flex-col gap-1 text-sm">
                    <Link href="/about" className="hover:text-accent">About Us</Link>
                    <Link href="/contact" className="hover:text-accent">Contact Us</Link>
                    <Link href="/terms" className="hover:text-accent">Terms &amp; Conditions</Link>
                    <Link href="/privacy" className="hover:text-accent">Privacy Policy</Link>
                    <Link href="/refund" className="hover:text-accent">Refund Policy</Link>
                    <Link href="/shipping" className="hover:text-accent">Shipping Policy</Link>
                </nav>
            </div>
        </div>
    </footer>
  );
}
