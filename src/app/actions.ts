
'use server';

import { getStyleMatch, type StyleMatchInput } from "@/ai/flows/style-match";
import { getPersonalizedArtistRecommendations, type PersonalizedArtistRecommendationsInput } from "@/ai/flows/personalized-artist-recommendation";

export async function fetchStyleMatch(input: StyleMatchInput) {
    return await getStyleMatch(input);
}

export async function fetchRecommendations(input: PersonalizedArtistRecommendationsInput) {
    const result = await getPersonalizedArtistRecommendations(input);
    return result.artistRecommendations;
}
