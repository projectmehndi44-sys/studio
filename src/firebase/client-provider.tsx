
'use client';

import { FirebaseProvider } from './provider';

// This provider ensures that Firebase is initialized only on the client side.
// It wraps the main FirebaseProvider which now contains the initialization logic.
export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FirebaseProvider>
      {children}
    </FirebaseProvider>
  );
}
