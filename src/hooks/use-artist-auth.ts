
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { getArtist } from '@/lib/services';
import type { Artist } from '@/lib/types';

interface ArtistAuth {
  artist: Artist | null;
  isArtistLoading: boolean;
}

export function useArtistAuth(): ArtistAuth {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const [artist, setArtist] = React.useState<Artist | null>(null);
  const [isArtistLoading, setIsArtistLoading] = React.useState(true);

  React.useEffect(() => {
    if (isAuthLoading) {
      setIsArtistLoading(true);
      return;
    }

    if (!user) {
      setArtist(null);
      setIsArtistLoading(false);
      return;
    }
    
    setIsArtistLoading(true);
    getArtist(user.uid).then((artistProfile) => {
      if (artistProfile) {
        setArtist(artistProfile);
      } else {
        setArtist(null);
      }
      setIsArtistLoading(false);
    }).catch((err) => {
        console.error("Failed to fetch artist profile:", err);
        setArtist(null);
        setIsArtistLoading(false);
    });

  }, [user, isAuthLoading]);

  return { artist, isArtistLoading };
}
