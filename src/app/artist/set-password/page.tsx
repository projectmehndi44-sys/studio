

'use client';

import * as React from 'react';

export default function SetPasswordPage() {
    React.useEffect(() => {
        // This page is deprecated. The flow is now handled via password reset emails.
        window.location.href = '/artist/login';
    }, []);

    return (
        <div className="w-full flex items-center justify-center min-h-screen">
            <p>Redirecting to login...</p>
        </div>
    );
}

    