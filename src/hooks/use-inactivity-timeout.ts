
'use client';

import * as React from 'react';
import { useToast } from './use-toast';

const useInactivityTimeout = (logoutAction: () => void, timeout = 360000) => { // Default to 6 minutes
    const { toast } = useToast();
    const timeoutId = React.useRef<NodeJS.Timeout>();

    const resetTimer = React.useCallback(() => {
        if (timeoutId.current) {
            clearTimeout(timeoutId.current);
        }
        
        timeoutId.current = setTimeout(() => {
             // Use a stable toast function call inside the timeout
            toast({
                title: "Session Expired",
                description: "You have been logged out due to inactivity.",
                variant: "destructive"
            });
            logoutAction();
        }, timeout);
    }, [timeout, logoutAction, toast]);

    React.useEffect(() => {
        const events: (keyof WindowEventMap)[] = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
        
        const eventListener = () => {
            resetTimer();
        };

        // Set up event listeners for user activity
        events.forEach(event => window.addEventListener(event, eventListener));
        
        // Initialize timer
        resetTimer();

        // Cleanup function to remove event listeners and clear timeout
        return () => {
            if (timeoutId.current) {
                clearTimeout(timeoutId.current);
            }
            events.forEach(event => window.removeEventListener(event, eventListener));
        };
    }, [resetTimer]);

    return null; // This hook does not render anything
};

export { useInactivityTimeout };
