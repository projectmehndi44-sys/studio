
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

// This is a placeholder page. The actual content is rendered within layout.tsx and page.tsx
export default function ArtistProfilePage() {
    const router = useRouter();

    React.useEffect(() => {
        const isArtistAuthenticated = localStorage.getItem('isArtistAuthenticated');
        if (isArtistAuthenticated !== 'true') {
            router.push('/artist/login');
        }
    }, [router]);
    
    return null;
}
