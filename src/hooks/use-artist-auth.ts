
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
  const router = useRouter();

  React.useEffect(() => {
    // Wait until the initial Firebase Auth check is complete
    if (isAuthLoading) {
      return;
    }

    // If auth is done and there's no user, then there's no artist.
    if (!user) {
      setArtist(null);
      setIsArtistLoading(false);
      return;
    }
    
    // If we have a user, try to fetch their artist profile.
    getArtist(user.uid).then((artistProfile) => {
      if (artistProfile) {
        setArtist(artistProfile);
      } else {
        // The user is authenticated but doesn't have an artist profile.
        setArtist(null);
      }
      setIsArtistLoading(false);
    }).catch(() => {
        setArtist(null);
        setIsArtistLoading(false);
    });

  }, [user, isAuthLoading, router]);

  return { artist, isArtistLoading };
}
