import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { Playfair_Display, Roboto, Dancing_Script } from 'next/font/google';

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair-display',
});

const roboto = Roboto({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '700'],
  variable: '--font-roboto',
});

const dancingScript = Dancing_Script({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '700'],
  variable: '--font-dancing-script',
});


export const metadata: Metadata = {
  title: 'GlamGo: Artistry at Your Fingertips',
  description: 'Discover and book the most talented mehndi and makeup artists near you. Your perfect look for any occasion is just a click away.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn('min-h-screen bg-background font-body antialiased', playfairDisplay.variable, roboto.variable, dancingScript.variable)}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
