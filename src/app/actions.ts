'use server';

import {
  getPersonalizedArtistRecommendations,
  type PersonalizedArtistRecommendationsInput,
  type PersonalizedArtistRecommendationsOutput,
} from '@/ai/flows/personalized-artist-recommendations';
import type { Artist } from '@/types';

function transformRecommendation(
  recs: PersonalizedArtistRecommendationsOutput
): Artist[] {
    if (!recs || !recs.artistRecommendations) return [];

    return recs.artistRecommendations.map((rec) => ({
      id: rec.artistId,
      name: rec.name,
      profilePicture: rec.profilePicture || `https://picsum.photos/200/200?random=${Math.floor(Math.random() * 100)}`,
      workImages: [
        `https://picsum.photos/600/400?random=${Math.floor(Math.random() * 1000)}`,
        `https://picsum.photos/600/400?random=${Math.floor(Math.random() * 1000)}`,
        `https://picsum.photos/600/400?random=${Math.floor(Math.random() * 1000)}`,
      ],
      services: rec.serviceTypes,
      location: rec.location,
      charge: rec.charge,
      rating: +(4.5 + Math.random() * 0.5).toFixed(1), // Mock rating
      styleTags: rec.styleTags,
    }));
}


export async function fetchRecommendations(
  input: PersonalizedArtistRecommendationsInput
): Promise<Artist[]> {
  try {
    const recommendations = await getPersonalizedArtistRecommendations(input);
    return transformRecommendation(recommendations);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    // In a real app, you would have more robust error handling
    return [];
  }
}
