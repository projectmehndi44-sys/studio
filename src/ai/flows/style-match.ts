// This is a server-side file
'use server';

/**
 * @fileOverview AI Style Match Flow
 *
 * This file defines a Genkit flow that provides personalized mehndi and makeup style
 * recommendations based on a user's outfit photo and event description.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Define the input schema for the flow
const StyleMatchInputSchema = z.object({
  outfitPhoto: z
    .string()
    .describe(
      "A photo of the user's outfit, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  eventDescription: z
    .string()
    .describe(
      'A text description of the event, occasion, or any specific style preferences.'
    ),
});
export type StyleMatchInput = z.infer<typeof StyleMatchInputSchema>;

// Define the output schema for the flow
const StyleMatchOutputSchema = z.object({
  mehndiRecommendation: z
    .string()
    .describe(
      'A creative and descriptive recommendation for a mehndi style that complements the outfit and event. Describe the patterns, density, and placement (e.g., "A delicate, floral vine pattern up the fingers with a focus on negative space to complement the light fabric of the dress.").'
    ),
  makeupRecommendation: z
    .string()
    .describe(
      'A detailed recommendation for a makeup look. Mention specific colors and techniques (e.g., "A soft glam look with shimmery gold eyeshadow, a subtle winged liner, and a warm nude lipstick to match the outfit\'s golden embroidery.").'
    ),
});
export type StyleMatchOutput = z.infer<typeof StyleMatchOutputSchema>;

// Define the Genkit prompt
const styleMatchPrompt = ai.definePrompt({
  name: 'styleMatchPrompt',
  input: { schema: StyleMatchInputSchema },
  output: { schema: StyleMatchOutputSchema },
  model: 'googleai/gemini-2.5-flash',
  prompt: `You are an expert fashion stylist specializing in Indian ethnic wear, mehndi, and makeup artistry.

  Your task is to create style recommendations based on an image of a user's outfit and their description of the event.

  Analyze the outfit in the photo for its color, pattern, fabric, and overall style (e.g., traditional, modern, minimalist).
  Use the event description for context (e.g., wedding, sangeet, daytime event).

  Based on your analysis, provide a specific and creative recommendation for both a mehndi style and a makeup look that would perfectly complement the outfit and occasion.

  Outfit Photo: {{media url=outfitPhoto}}
  Event Description: {{{eventDescription}}}

  Provide the recommendations in the required JSON format.
  `,
});

// Define the Genkit flow
const styleMatchFlow = ai.defineFlow(
  {
    name: 'styleMatchFlow',
    inputSchema: StyleMatchInputSchema,
    outputSchema: StyleMatchOutputSchema,
  },
  async (input) => {
    const { output } = await styleMatchPrompt(input);

    if (!output) {
      throw new Error('The AI model could not generate a style match. Please try again.');
    }
    
    return output;
  }
);

/**
 *  A function that calls the styleMatchFlow with the input and returns the output
 * @param input The user's outfit photo and event description.
 * @returns {Promise<StyleMatchOutput>}
 */
export async function getStyleMatch(input: StyleMatchInput): Promise<StyleMatchOutput> {
  return styleMatchFlow(input);
}
