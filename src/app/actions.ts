'use server';

import {
  getPersonalizedArtistRecommendations,
  type PersonalizedArtistRecommendationsInput,
  type PersonalizedArtistRecommendationsOutput,
} from '@/ai/flows/personalized-artist-recommendations';
import { getStyleMatch, type StyleMatchInput, type StyleMatchOutput } from '@/ai/flows/style-match';
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

export async function fetchStyleMatch(
  input: StyleMatchInput
): Promise<StyleMatchOutput | null> {
  try {
    const recommendations = await getStyleMatch(input);
    return recommendations;
  } catch (error) {
    console.error('Error fetching style match:', error);
    // In a real app, you would have more robust error handling
    return null;
  }
}
