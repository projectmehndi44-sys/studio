
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

export function PwaInstallBanner() {
  const [installPrompt, setInstallPrompt] = React.useState<Event | null>(null);
  const [isVisible, setIsVisible] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event);
      // Check if the app is already running in standalone mode
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      if (!isStandalone) {
         setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;

    // The type for BeforeInstallPromptEvent is not standard across all browsers
    const promptEvent = installPrompt as any;

    try {
      promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      
      if (outcome === 'accepted') {
        toast({ title: 'Installation successful!', description: 'UtsavLook is now on your home screen.' });
        setIsVisible(false);
      } else {
        toast({ title: 'Installation dismissed.', description: 'You can add it to your home screen later from your browser menu.' });
      }
    } catch (error) {
       toast({ title: 'Installation failed', description: 'Could not install the app. You can still add it manually from your browser menu.', variant: 'destructive' });
    } finally {
        setInstallPrompt(null);
    }
  };
  
  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 w-full z-50 animate-in slide-in-from-top-10 fade-in duration-500">
        <div className="bg-primary/95 backdrop-blur-sm text-primary-foreground p-3 flex items-center justify-center gap-4">
            <Sparkles className="w-8 h-8 text-amber-300 hidden sm:block flex-shrink-0"/>
            <div className="flex-grow text-center">
                <h3 className="font-bold">Get the Full App Experience!</h3>
                <p className="text-sm text-primary-foreground/80 hidden md:block">Add UtsavLook to your home screen for faster access and offline use.</p>
            </div>
             <Button onClick={handleInstallClick} variant="secondary" className="bg-amber-400 text-amber-900 hover:bg-amber-500">
                <Download className="mr-2 h-4 w-4"/>
                Install
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsVisible(false)} className="h-8 w-8 text-primary-foreground hover:bg-white/20 hover:text-primary-foreground">
                <X className="h-5 w-5"/>
                <span className="sr-only">Dismiss</span>
            </Button>
        </div>
    </div>
  );
}
