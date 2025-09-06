import React from 'react';
import { Sparkles, User, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Header() {
  return (
    <header className="flex items-center justify-between w-full px-4 md:px-8 py-2 bg-background/80 backdrop-blur-sm sticky top-0 z-40 border-b">
      <div className="flex items-center gap-2">
        <Sparkles className="w-8 h-8 text-accent" />
        <h1 className="font-headline text-5xl text-primary">GlamGo</h1>
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost">Login</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Login as</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Customer</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Palette className="mr-2 h-4 w-4" />
              <span>Artist</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>Sign Up</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Sign up as</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Customer</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Palette className="mr-2 h-4 w-4" />
              <span>Artist</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
