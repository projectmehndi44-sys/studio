
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { Playfair_Display, Roboto, Anton } from 'next/font/google';

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair-display',
});

const roboto = Roboto({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '700'],
  variable: '--font-roboto',
});

const anton = Anton({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400'],
  variable: '--font-anton',
});


export const metadata: Metadata = {
  title: 'Artistry at Your Fingertips',
  description: 'Discover and book the most talented mehndi and makeup artists near you. Your perfect look for any occasion is just a click away.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn('font-body antialiased min-h-screen', playfairDisplay.variable, roboto.variable, anton.variable)}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
