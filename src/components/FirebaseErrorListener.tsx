
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';

/**
 * This is a client-side component that listens for custom 'permission-error' events
 * and throws them, so they can be caught by Next.js's development error overlay.
 * It should be placed in the root layout.
 */
export function FirebaseErrorListener() {
  useEffect(() => {
    const handleError = (error: Error) => {
      // Throwing the error here will cause it to be picked up by Next.js's
      // error overlay in development mode, which is what we want for rich debugging.
      throw error;
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  return null; // This component does not render anything.
}
