'use server';
/**
 * @fileOverview A Genkit flow for generating personalized "We miss you" WhatsApp messages.
 *
 * - generateLoyaltyMessage - A function that generates a personalized loyalty message for inactive customers.
 * - AutomatedLoyaltyMessageInput - The input type for the generateLoyaltyMessage function.
 * - AutomatedLoyaltyMessageOutput - The return type for the generateLoyaltyMessage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AutomatedLoyaltyMessageInputSchema = z.object({
  customerName: z.string().describe("The name of the customer to address in the message."),
  offerDetails: z.string().describe("The details of the special offer to include in the message (e.g., '10% off your next purchase')."),
  storeName: z.string().describe("The name of the store (e.g., 'Krishna's SUPER 9+')."),
});
export type AutomatedLoyaltyMessageInput = z.infer<typeof AutomatedLoyaltyMessageInputSchema>;

const AutomatedLoyaltyMessageOutputSchema = z.object({
  whatsappMessage: z.string().describe("The personalized 'We miss you' WhatsApp message."),
});
export type AutomatedLoyaltyMessageOutput = z.infer<typeof AutomatedLoyaltyMessageOutputSchema>;

export async function generateLoyaltyMessage(input: AutomatedLoyaltyMessageInput): Promise<AutomatedLoyaltyMessageOutput> {
  return automatedLoyaltyMessageFlow(input);
}

const automatedLoyaltyMessagePrompt = ai.definePrompt({
  name: 'automatedLoyaltyMessagePrompt',
  input: { schema: AutomatedLoyaltyMessageInputSchema },
  output: { schema: AutomatedLoyaltyMessageOutputSchema },
  prompt: `You are a friendly and engaging marketing assistant for a retail store named "{{{storeName}}}".
Your task is to craft a personalized "We miss you" message for a customer who hasn't visited in a while.
The message should be suitable for sending via WhatsApp.

Include the customer's name, express that the store misses them, and clearly present the special offer.
Keep the tone warm, inviting, and encouraging repeat business.

Customer Name: {{{customerName}}}
Store Name: {{{storeName}}}
Special Offer: {{{offerDetails}}}

Example Message Structure:
"Hi [Customer Name]! It's been a while since we saw you at [Store Name]. We've missed you!
As a special thank you, here's an exclusive offer just for you: [Special Offer].
We hope to see you soon!
Best,
The Team at [Store Name]"

Now, generate the WhatsApp message:`,
});

const automatedLoyaltyMessageFlow = ai.defineFlow(
  {
    name: 'automatedLoyaltyMessageFlow',
    inputSchema: AutomatedLoyaltyMessageInputSchema,
    outputSchema: AutomatedLoyaltyMessageOutputSchema,
  },
  async (input) => {
    const { output } = await automatedLoyaltyMessagePrompt(input);
    if (!output) {
      throw new Error('Failed to generate loyalty message.');
    }
    return output;
  }
);
