'use server';

import {
  getPersonalizedArtistRecommendations,
  type PersonalizedArtistRecommendationsInput,
  type PersonalizedArtistRecommendationsOutput,
} from '@/ai/flows/personalized-artist-recommendations';
import type { Artist } from '@/types';

/**
 * This is the raw artist data that comes back from the AI.
 * It does not include client-side generated data like random images or ratings.
 */
export type RawArtistRecommendation = PersonalizedArtistRecommendationsOutput['artistRecommendations'][number];


export async function fetchRecommendations(
  input: PersonalizedArtistRecommendationsInput
): Promise<RawArtistRecommendation[]> {
  try {
    const recommendations = await getPersonalizedArtistRecommendations(input);
    return recommendations.artistRecommendations || [];
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    // In a real app, you would have more robust error handling
    return [];
  }
}
