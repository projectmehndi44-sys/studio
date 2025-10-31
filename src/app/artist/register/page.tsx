'use client';

import * as React from 'react';
import { ArtistRegistrationModal } from '@/components/utsavlook/ArtistRegistrationModal';
import { useRouter } from 'next/navigation';

export default function ArtistRegisterPage() {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = React.useState(true);

    const handleModalChange = (open: boolean) => {
        if (!open) {
            setIsModalOpen(false);
            // Redirect back to the artist landing page when modal is closed
            router.push('/artist');
        } else {
            setIsModalOpen(true);
        }
    }

    return (
        <ArtistRegistrationModal 
            isOpen={isModalOpen}
            onOpenChange={handleModalChange}
        />
    );
}
