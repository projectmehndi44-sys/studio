
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const router = useRouter();

    React.useEffect(() => {
        // This page is deprecated and its contents are moved. Redirect to the new pages.
        router.replace('/admin/financial-settings');
    }, [router]);

    // Render a loading state or null while redirecting
    return (
        <div className="flex items-center justify-center min-h-full">
            <p>Redirecting...</p>
        </div>
    );
}
