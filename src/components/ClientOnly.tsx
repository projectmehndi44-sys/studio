
'use client';

import * as React from 'react';

/**
 * A utility component that prevents its children from rendering on the server.
 * This is useful for wrapping components that cause hydration mismatches due to
 * browser-specific APIs, random ID generation, or other client-only logic.
 */
export function ClientOnly({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = React.useState(false);

  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  return <>{children}</>;
}
