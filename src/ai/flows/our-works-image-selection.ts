'use server';

/**
 * @fileOverview An AI tool to select visually appealing images for the 'Our Works' gallery.
 *
 * - selectOurWorksImages - A function that selects a set of images from a Firebase Storage bucket.
 * - SelectOurWorksImagesInput - The input type for the selectOurWorksImages function.
 * - SelectOurWorksImagesOutput - The return type for the selectOurWorksImages function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SelectOurWorksImagesInputSchema = z.object({
  imageUrls: z.array(z.string()).describe('An array of URLs for images in Firebase Storage.'),
  maxImages: z.number().describe('The maximum number of images to select for the gallery.'),
});
export type SelectOurWorksImagesInput = z.infer<typeof SelectOurWorksImagesInputSchema>;

const SelectOurWorksImagesOutputSchema = z.object({
  selectedImageUrls: z
    .array(z.string())
    .describe('An array of URLs for the selected images for the gallery.'),
});
export type SelectOurWorksImagesOutput = z.infer<typeof SelectOurWorksImagesOutputSchema>;

export async function selectOurWorksImages(input: SelectOurWorksImagesInput): Promise<SelectOurWorksImagesOutput> {
  return selectOurWorksImagesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'selectOurWorksImagesPrompt',
  input: {schema: SelectOurWorksImagesInputSchema},
  output: {schema: SelectOurWorksImagesOutputSchema},
  prompt: `You are an AI assistant helping an admin select visually appealing images for an "Our Works" gallery.

  Given a list of image URLs, select the {{maxImages}} most visually appealing images for the gallery.  Consider image quality, composition, and relevance to the themes of mehndi, makeup, and photography.

  Return ONLY the selected image URLs in a JSON array.

  Image URLs: {{{imageUrls}}}
  Maximum Images: {{maxImages}}`,
});

const selectOurWorksImagesFlow = ai.defineFlow(
  {
    name: 'selectOurWorksImagesFlow',
    inputSchema: SelectOurWorksImagesInputSchema,
    outputSchema: SelectOurWorksImagesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
