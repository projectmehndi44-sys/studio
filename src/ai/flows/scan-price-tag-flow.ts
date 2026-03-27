'use server';
/**
 * @fileOverview A Genkit flow for extracting price and product information from a price tag photo.
 *
 * - scanPriceTag - A function that processes a photo of a price tag and returns price and name.
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
  name: z.string().describe('The name of the product extracted from the tag. Use "Price Tag Item" if not clear.'),
  price: z.number().describe('The numeric price extracted from the tag.'),
  confidence: z.number().describe('How confident the AI is in the extraction (0 to 1).'),
});
export type ScanPriceTagOutput = z.infer<typeof ScanPriceTagOutputSchema>;

export async function scanPriceTag(input: ScanPriceTagInput): Promise<ScanPriceTagOutput> {
  return scanPriceTagFlow(input);
}

const prompt = ai.definePrompt({
  name: 'scanPriceTagPrompt',
  input: {schema: ScanPriceTagInputSchema},
  output: {schema: ScanPriceTagOutputSchema},
  prompt: `You are a professional retail scanner for Krishna's SUPER 9+ POS. 
Your task is to analyze the provided image of a price tag or product label.

1. Extract the numeric Price (ignore currency symbols like ₹, RS, etc.).
2. Extract the Product Name if clearly visible. If not, return "Scanned Item".
3. Return the data in the specified JSON format.

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
