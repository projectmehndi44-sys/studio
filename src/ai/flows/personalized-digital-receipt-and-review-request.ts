'use server';
/**
 * @fileOverview A Genkit flow for generating personalized digital receipts and review requests.
 *
 * - generatePersonalizedDigitalReceiptAndReviewRequest - A function that generates a personalized WhatsApp message with order details and a review link.
 * - PersonalizedDigitalReceiptAndReviewRequestInput - The input type for the generatePersonalizedDigitalReceiptAndReviewRequest function.
 * - PersonalizedDigitalReceiptAndReviewRequestOutput - The return type for the generatePersonalizedDigitalReceiptAndReviewRequest function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedDigitalReceiptAndReviewRequestInputSchema = z.object({
  customerName: z.string().describe('The name of the customer for personalization.'),
  orderId: z.string().describe('The unique identifier for the customer\'s order.'),
  orderItems: z
    .array(
      z.object({
        name: z.string().describe('The name of the item.'),
        quantity: z.number().int().positive().describe('The quantity of the item.'),
        price: z.number().positive().describe('The price of a single unit of the item.'),
      })
    )
    .describe('A list of items purchased in the order.'),
  orderTotal: z.number().positive().describe('The total cost of the order.'),
  pdfReceiptLink: z
    .string()
    .url()
    .describe('A URL to the PDF version of the full receipt.'),
  reviewLink: z.string().url().describe('A URL where the customer can leave a review.'),
});
export type PersonalizedDigitalReceiptAndReviewRequestInput = z.infer<
  typeof PersonalizedDigitalReceiptAndReviewRequestInputSchema
>;

const PersonalizedDigitalReceiptAndReviewRequestOutputSchema = z.object({
  whatsappMessage: z
    .string()
    .describe('The personalized message content formatted for WhatsApp, including receipt summary and review request.'),
});
export type PersonalizedDigitalReceiptAndReviewRequestOutput = z.infer<
  typeof PersonalizedDigitalReceiptAndReviewRequestOutputSchema
>;

export async function generatePersonalizedDigitalReceiptAndReviewRequest(
  input: PersonalizedDigitalReceiptAndReviewRequestInput
): Promise<PersonalizedDigitalReceiptAndReviewRequestOutput> {
  return personalizedDigitalReceiptAndReviewRequestFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedDigitalReceiptAndReviewRequestPrompt',
  input: {schema: PersonalizedDigitalReceiptAndReviewRequestInputSchema},
  output: {schema: PersonalizedDigitalReceiptAndReviewRequestOutputSchema},
  prompt: `You are a friendly customer service agent for Krishna's SUPER 9+ POS. Your task is to generate a personalized WhatsApp message for a customer after their purchase. The message should be polite, concise, and include their order summary, a link to their full PDF receipt, and a clear, polite request for a review with a provided link.

Here are the details:
Customer Name: {{{customerName}}}
Order ID: {{{orderId}}}
Order Items:
{{#each orderItems}}
- {{{name}}} (x{{{quantity}}}) - ₹{{{price}}}
{{/each}}
Order Total: ₹{{{orderTotal}}}
PDF Receipt Link: {{{pdfReceiptLink}}}
Review Link: {{{reviewLink}}}

Please craft a concise and engaging message for WhatsApp. Focus on friendliness and clarity.`,
});

const personalizedDigitalReceiptAndReviewRequestFlow = ai.defineFlow(
  {
    name: 'personalizedDigitalReceiptAndReviewRequestFlow',
    inputSchema: PersonalizedDigitalReceiptAndReviewRequestInputSchema,
    outputSchema: PersonalizedDigitalReceiptAndReviewRequestOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
