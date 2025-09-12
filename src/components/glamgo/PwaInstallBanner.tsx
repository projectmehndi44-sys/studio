
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
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-lg z-50">
        <div className="bg-background/90 backdrop-blur-sm rounded-lg shadow-2xl border border-primary/20 p-4 flex items-center gap-4 animate-in slide-in-from-bottom-10 fade-in duration-500">
            <Sparkles className="w-10 h-10 text-accent hidden sm:block"/>
            <div className="flex-grow">
                <h3 className="font-bold text-primary">Get the Full App Experience!</h3>
                <p className="text-sm text-muted-foreground">Add UtsavLook to your home screen for faster access and offline use.</p>
            </div>
             <Button onClick={handleInstallClick}>
                <Download className="mr-2 h-4 w-4"/>
                Install
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsVisible(false)} className="h-8 w-8">
                <X className="h-4 w-4"/>
                <span className="sr-only">Dismiss</span>
            </Button>
        </div>
    </div>
  );
}
