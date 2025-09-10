
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from './use-toast';

const useInactivityTimeout = (logoutAction: () => void, timeout = 300000) => { // Default to 5 minutes
    const { toast } = useToast();
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const resetTimer = React.useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            toast({
                title: "Session Expired",
                description: "You have been logged out due to inactivity.",
                variant: "destructive"
            });
            logoutAction();
        }, timeout);
    }, [timeout, logoutAction, toast]);

    React.useEffect(() => {
        // Do not run this hook on the server
        if (typeof window === 'undefined') {
            return;
        }

        const events = ['mousemove', 'keydown', 'click', 'scroll'];
        
        const eventListener = () => {
            resetTimer();
        };

        // Set up event listeners
        events.forEach(event => window.addEventListener(event, eventListener));
        
        // Initialize timer
        resetTimer();

        // Cleanup
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            events.forEach(event => window.removeEventListener(event, eventListener));
        };
    }, [resetTimer]);

    return null;
};

export { useInactivityTimeout };
