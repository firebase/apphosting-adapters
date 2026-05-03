'use server';
/**
 * @fileOverview Analyzes a photo to suggest relevant topics and content ideas for a WordPress post.
 *
 * - analyzePhotoForContentSuggestions - A function that handles the photo analysis and content suggestion process.
 * - AnalyzePhotoForContentSuggestionsInput - The input type for the analyzePhotoForContentSuggestions function.
 * - AnalyzePhotoForContentSuggestionsOutput - The return type for the analyzePhotoForContentSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzePhotoForContentSuggestionsInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzePhotoForContentSuggestionsInput = z.infer<typeof AnalyzePhotoForContentSuggestionsInputSchema>;

const AnalyzePhotoForContentSuggestionsOutputSchema = z.object({
  suggestedTopics: z.array(z.string()).describe('A list of suggested topics for a WordPress post based on the photo.'),
  contentIdeas: z.array(z.string()).describe('A list of content ideas for a WordPress post based on the photo.'),
});
export type AnalyzePhotoForContentSuggestionsOutput = z.infer<typeof AnalyzePhotoForContentSuggestionsOutputSchema>;

export async function analyzePhotoForContentSuggestions(input: AnalyzePhotoForContentSuggestionsInput): Promise<AnalyzePhotoForContentSuggestionsOutput> {
  return analyzePhotoForContentSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzePhotoForContentSuggestionsPrompt',
  input: {schema: AnalyzePhotoForContentSuggestionsInputSchema},
  output: {schema: AnalyzePhotoForContentSuggestionsOutputSchema},
  prompt: `You are an expert content strategist for WordPress. You will analyze the photo provided and suggest relevant topics and content ideas for a WordPress post.

  Photo: {{media url=photoDataUri}}

  Please provide the suggested topics and content ideas in a JSON format.
  `,
});

const analyzePhotoForContentSuggestionsFlow = ai.defineFlow(
  {
    name: 'analyzePhotoForContentSuggestionsFlow',
    inputSchema: AnalyzePhotoForContentSuggestionsInputSchema,
    outputSchema: AnalyzePhotoForContentSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
