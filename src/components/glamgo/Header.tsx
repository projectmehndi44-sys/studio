import React from 'react';
import { Sparkles } from 'lucide-react';

export function Header() {
  return (
    <header className="flex items-center justify-center w-full py-4 bg-background/80 backdrop-blur-sm sticky top-0 z-40 border-b">
      <div className="flex items-center gap-2">
        <Sparkles className="w-8 h-8 text-accent" />
        <h1 className="font-headline text-5xl text-primary">GlamGo</h1>
      </div>
    </header>
  );
}
