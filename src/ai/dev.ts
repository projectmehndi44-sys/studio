import { config } from 'dotenv';
config();

import { defineFlow, renderFlow } from 'genkit';
import * as z from 'zod';
import * as path from 'path';
import * someFlow from '@/ai/flows/personalized-artist-recommendations';
import * someOtherFlow from '@/ai/flows/style-match';

const allFlows = {
  ...someFlow,
  ...someOtherFlow,
};

// This is a dev-only file that loads all flows and renders a dev UI.
// It is not intended for production use.
export default defineFlow(
  {
    name: 'devUi',
    inputSchema: z.any(),
    outputSchema: z.string(),
  },
  async (subject) => {
    return await renderFlow({
      flow: allFlows[subject] || allFlows,
      options: {
        fields: {
          photoDataUri: {
            format: 'uri',
          },
        },
      },
    });
  }
);
