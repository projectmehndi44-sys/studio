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
Your task is to identify the price on our shop's price tag.

CRITICAL INSTRUCTIONS:
1. IGNORE COLOURS: The tag color (brown, red, white, orange, etc.) is irrelevant. Focus ONLY on the design layout.
2. IDENTIFY THE RUPEE SYMBOL: Locate the currency symbol "₹".
3. EXTRACT THE PRICE: Look for the LARGE digits immediately following or next to the "₹" symbol. This is the item amount.
4. IGNORE EVERYTHING ELSE: Disregard branding, barcodes, or small secondary numbers.
5. NO COLOUR BIAS: Do not assume a tag color means a specific price. Only read the actual numbers printed next to the ₹ sign.
6. ACCURACY: Return ONLY the exact numeric price found after or next to the "₹" symbol.

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
