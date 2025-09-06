import React from 'react';
import Link from 'next/link';
import { Sparkles, User, Palette, ShieldCheck, LogOut, LogIn } from 'lucide-react';
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

interface HeaderProps {
    onArtistRegister: () => void;
    isCustomerLoggedIn: boolean;
    onCustomerLogin: () => void;
    onCustomerLogout: () => void;
    customer: { name: string } | null;
}

export function Header({ 
  onArtistRegister, 
  isCustomerLoggedIn, 
  onCustomerLogin, 
  onCustomerLogout, 
  customer 
}: HeaderProps) {
  const { toast } = useToast();

  const handleArtistLogin = () => {
    // In a real app, this would redirect to a login page
    toast({ title: 'Login', description: 'Redirecting to artist login...' });
  };
    
  const handleCustomerSignUp = () => {
    // In a real app, this would redirect to a sign up page
    toast({ title: 'Sign Up', description: 'Redirecting to customer sign up...' });
  };


  return (
    <header className="flex items-center justify-between w-full px-4 md:px-8 py-2 bg-background/80 backdrop-blur-sm sticky top-0 z-40 border-b">
      <div className="flex items-center gap-2">
        <Sparkles className="w-8 h-8 text-accent" />
        <h1 className="font-headline text-5xl text-primary">GlamGo</h1>
      </div>
      <div className="flex items-center gap-2">
        <Link href="/admin">
          <Button variant="outline">
            <ShieldCheck className="mr-2 h-4 w-4" /> Admin Portal
          </Button>
        </Link>
        {isCustomerLoggedIn ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback>{customer?.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span>{customer?.name}</span>
                </Button>
            </DropdownMenuTrigger>
             <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={onCustomerLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                </DropdownMenuItem>
             </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost">Login</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Login as</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={onCustomerLogin}>
                <LogIn className="mr-2 h-4 w-4" />
                <span>Customer</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={handleArtistLogin}>
                <Palette className="mr-2 h-4 w-4" />
                <span>Artist</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>Sign Up</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Sign up as</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onClick={handleCustomerSignUp}>
              <User className="mr-2 h-4 w-4" />
              <span>Customer</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={onArtistRegister}>
              <Palette className="mr-2 h-4 w-4" />
              <span>Register as Artist</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
