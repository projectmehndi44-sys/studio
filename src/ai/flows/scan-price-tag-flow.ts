'use server';
/**
 * @fileOverview A Genkit flow for extracting price information from Krishna's Super 9+ price tags.
 *
 * - scanPriceTag - A function that processes a photo of a price tag and returns the price.
 * - ScanPriceTagInput - The input type for the scanPriceTag function.
 * - ScanPriceTagOutput - The return type for the scanPriceTag function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ScanPriceTagInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a price tag, as a data URI. Format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ScanPriceTagInput = z.infer<typeof ScanPriceTagInputSchema>;

const ScanPriceTagOutputSchema = z.object({
  name: z.string().describe('The name of the product if visible. Use "Scanned Item" if not clear.'),
  price: z.number().describe('The numeric price extracted from the tag.'),
  confidence: z.number().describe('Confidence level 0-1.'),
});
export type ScanPriceTagOutput = z.infer<typeof ScanPriceTagOutputSchema>;

export async function scanPriceTag(input: ScanPriceTagInput): Promise<ScanPriceTagOutput> {
  return scanPriceTagFlow(input);
}

const prompt = ai.definePrompt({
  name: 'scanPriceTagPrompt',
  input: {schema: ScanPriceTagInputSchema},
  output: {schema: ScanPriceTagOutputSchema},
  prompt: `You are a specialized retail vision agent for Krishna's SUPER 9+. 
Your task is to identify the price on a specific price tag layout, regardless of the tag's background color.

1. Locate the currency symbol "₹".
2. Extract the LARGE numeric price digits immediately following the symbol.
3. Ignore any branding text like "KRISHNA'S SUPER 9+" or other smaller text elements.
4. Focus strictly on the design pattern: Branding at the top, a large Rupee symbol, and the price value.
5. Return the numeric price.

Photo: {{media url=photoDataUri}}`,
});

const scanPriceTagFlow = ai.defineFlow(
  {
    name: 'scanPriceTagFlow',
    inputSchema: ScanPriceTagInputSchema,
    outputSchema: ScanPriceTagOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) throw new Error('Failed to extract price data.');
    return output;
  }
);