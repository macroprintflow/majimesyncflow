'use server';

/**
 * @fileOverview This file defines a Genkit flow for intelligent carrier selection.
 *
 * - suggestCarrier - A function that suggests the best carrier (Delhivery or Shiprocket) for an order.
 * - SuggestCarrierInput - The input type for the suggestCarrier function.
 * - SuggestCarrierOutput - The return type for the suggestCarrier function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestCarrierInputSchema = z.object({
  destination: z.string().describe('The destination address for the order.'),
  weight: z.number().describe('The weight of the order in kilograms.'),
  orderDetails: z.string().describe('Additional details about the order.'),
});
export type SuggestCarrierInput = z.infer<typeof SuggestCarrierInputSchema>;

const SuggestCarrierOutputSchema = z.object({
  carrier: z.enum(['DELHIVERY', 'SHIPROCKET']).describe('The suggested carrier for the order.'),
  reason: z.string().describe('The reason for suggesting the carrier.'),
});
export type SuggestCarrierOutput = z.infer<typeof SuggestCarrierOutputSchema>;

export async function suggestCarrier(input: SuggestCarrierInput): Promise<SuggestCarrierOutput> {
  return suggestCarrierFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestCarrierPrompt',
  input: {schema: SuggestCarrierInputSchema},
  output: {schema: SuggestCarrierOutputSchema},
  prompt: `You are an AI assistant that suggests the best carrier for an order based on the destination, weight, and order details.

You have access to two carriers: Delhivery and Shiprocket.

Consider the following factors when suggesting a carrier:

*   **Destination:** Delhivery is generally better for major metropolitan areas, while Shiprocket may be better for smaller towns and rural areas.
*   **Weight:** Delhivery may be more cost-effective for heavier shipments, while Shiprocket may be better for lighter shipments.
*   **Real-time carrier performance data:** Consider any real-time performance data available for each carrier, such as on-time delivery rates and customer satisfaction ratings.
*   **Other order details:** Consider any other relevant order details, such as the type of product being shipped and any special handling requirements.

Destination: {{{destination}}}
Weight: {{{weight}}} kg
Order Details: {{{orderDetails}}}

Based on the above information, which carrier would you suggest?

Output in JSON format:
{
  "carrier": "DELHIVERY" | "SHIPROCKET",
  "reason": "reason for suggesting the carrier"
}
`,
});

const suggestCarrierFlow = ai.defineFlow(
  {
    name: 'suggestCarrierFlow',
    inputSchema: SuggestCarrierInputSchema,
    outputSchema: SuggestCarrierOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
