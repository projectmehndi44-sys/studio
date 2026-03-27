
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
Your ONLY task is to identify the numeric price located immediately adjacent to a "₹" symbol.

STRICT INSTRUCTIONS:
1. RUPEE SYMBOL IS MANDATORY: You MUST locate the currency symbol "₹". If the "₹" symbol is not clearly visible in the photo, return a price of 0.
2. EXTRACT ONLY THE PRICE: Look ONLY for the digits (the amount) written next to the "₹" symbol.
3. IGNORE EVERYTHING ELSE: Disregard tag color, background design, shop names, barcodes, or any other numbers.
4. SPATIAL AWARENESS: In this shop's design, the price is the digits following the ₹ symbol.
5. NO COLOR BIAS: It does not matter if the tag is brown, red, or white. Only focus on the ₹ symbol and the price digits.

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
