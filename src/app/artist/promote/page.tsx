
'use client';

import * as React from 'react';
import { useArtistPortal } from '../dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Download, Copy, Share2, Palette, Star, IndianRupee, Image as ImageIcon } from 'lucide-react';
import NextImage from 'next/image';
import { fetchPromoImage } from '@/app/actions';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';

export default function ArtistPromoteRedirectPage() {
  const router = useRouter();
  
  React.useEffect(() => {
    router.replace('/artist/dashboard/promote');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin" />
      <p className="ml-2">Redirecting...</p>
    </div>
  );
}
