
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { Playfair_Display, Roboto, Dancing_Script, Pinyon_Script } from 'next/font/google';

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

const dancingScript = Dancing_Script({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400'],
  variable: '--font-dancing-script',
});

const pinyonScript = Pinyon_Script({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400'],
  variable: '--font-cursive',
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
      <body className={cn('font-body antialiased min-h-screen', playfairDisplay.variable, roboto.variable, dancingScript.variable, pinyonScript.variable)}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
