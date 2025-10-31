// This is a server-side file
'use server';

/**
 * @fileOverview Personalized artist recommendations flow.
 *
 * This file defines a Genkit flow that provides personalized recommendations for mehndi and makeup artists
 * based on user history and style preferences.
 *
 * @exports {
 *   getPersonalizedArtistRecommendations,
 *   PersonalizedArtistRecommendationsInput,
 *   PersonalizedArtistRecommendationsOutput,
 * }
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';


// Define the input schema for the flow
const PersonalizedArtistRecommendationsInputSchema = z.object({
  userHistory: z
    .string()
    .describe(
      'A string containing the user interaction history, including past bookings, liked styles, and preferences.'
    ),
  stylePreferences: z
    .string()
    .describe('A string describing the user style preferences for makeup and mehndi.'),
  location: z
    .string()
    .optional()
    .describe(
      'Optional user location to filter recommendations for nearby artists.  This can be a city, address, or postal code.'
    ),
});
export type PersonalizedArtistRecommendationsInput = z.infer<typeof PersonalizedArtistRecommendationsInputSchema>;

// Define the output schema for the flow
const PersonalizedArtistRecommendationsOutputSchema = z.object({
  artistRecommendations: z.array(
    z.object({
      artistId: z.string().describe('The unique identifier of the artist.'),
      name: z.string().describe('The name of the artist.'),
      profilePicture: z
        .string()
        .describe(
          'URL of the artist profile picture.'
        ),
      serviceTypes: z
        .array(z.enum(['mehndi', 'makeup', 'photography']))
        .describe('The types of services the artist provides.'),
      location: z.string().describe('The location of the artist.'),
      charge: z.number().describe('The average charge for the artist services.'),
      styleTags: z.array(z.string()).describe('Relevant style tags for the artist.'),
      reason: z.string().describe('A brief explanation for why this artist is a good match.'),
    })
  ).describe('An array of recommended artists based on user preferences.'),
});
export type PersonalizedArtistRecommendationsOutput = z.infer<typeof PersonalizedArtistRecommendationsOutputSchema>;

// Define the Genkit prompt
const personalizedArtistRecommendationsPrompt = ai.definePrompt({
  name: 'personalizedArtistRecommendationsPrompt',
  input: {schema: PersonalizedArtistRecommendationsInputSchema},
  output: {schema: PersonalizedArtistRecommendationsOutputSchema},
  model: 'googleai/gemini-2.5-flash',
  prompt: `You are an AI assistant designed to provide personalized recommendations for mehndi and makeup artists.

  Based on the user's history, style preferences, and optionally their location, recommend artists that best match their needs.
  Consider the following information to tailor your recommendations:

  User History: {{{userHistory}}}
  Style Preferences: {{{stylePreferences}}}
  Location: {{{location}}}

  Provide the recommendations in the following JSON format.
  `,
});

// Define the Genkit flow
const personalizedArtistRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedArtistRecommendationsFlow',
    inputSchema: PersonalizedArtistRecommendationsInputSchema,
    outputSchema: PersonalizedArtistRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await personalizedArtistRecommendationsPrompt(input);
    
    // Return the output only if it exists, otherwise return an empty array.
    // This prevents the flow from crashing if the model returns a null response.
    return output || { artistRecommendations: [] };
  }
);

/**
 *  A function that calls the personalizedArtistRecommendationsFlow with the input and returns the output
 * @param input
 * @returns {Promise<PersonalizedArtistRecommendationsOutput>}
 */
export async function getPersonalizedArtistRecommendations(input: PersonalizedArtistRecommendationsInput): Promise<PersonalizedArtistRecommendationsOutput> {
  return personalizedArtistRecommendationsFlow(input);
}
