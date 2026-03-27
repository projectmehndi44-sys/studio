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
  price: z.number().describe('The numeric price extracted from the tag. Must be 0 if no Rupee symbol is found.'),
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
1. RUPEE SYMBOL MANDATORY: You MUST locate the currency symbol "₹". If you do not see the "₹" symbol, set the price to 0.
2. EXTRACT THE PRICE: Look for the LARGE digits immediately following or next to the "₹" symbol. This is the item amount.
3. IGNORE COLORS: The color of the tag (brown, red, white, etc.) does NOT matter. Only read the actual printed digits next to the ₹ symbol.
4. FOCUS ON DESIGN: Focus ONLY on the printed design layout of the tag. 
5. NO NOISE: Disregard branding, barcodes, or small secondary numbers elsewhere on the tag.
6. ACCURACY: Return ONLY the exact numeric price found next to the "₹" symbol.

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
