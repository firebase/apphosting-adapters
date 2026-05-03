// src/ai/flows/generate-content-from-comment.ts
'use server';
/**
 * @fileOverview Generates WordPress content (title, body, tags) from a user comment.
 *
 * - generateContentFromComment - A function that generates WordPress content based on a comment.
 * - GenerateContentFromCommentInput - The input type for the generateContentFromComment function.
 * - GenerateContentFromCommentOutput - The return type for the generateContentFromComment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateContentFromCommentInputSchema = z.object({
  comment: z.string().describe('The comment to generate content from.'),
});
export type GenerateContentFromCommentInput = z.infer<typeof GenerateContentFromCommentInputSchema>;

const GenerateContentFromCommentOutputSchema = z.object({
  title: z.string().describe('The title of the WordPress post.'),
  body: z.string().describe('The body of the WordPress post.'),
  tags: z.array(z.string()).describe('Suggested tags for the WordPress post.'),
});
export type GenerateContentFromCommentOutput = z.infer<typeof GenerateContentFromCommentOutputSchema>;

export async function generateContentFromComment(input: GenerateContentFromCommentInput): Promise<GenerateContentFromCommentOutput> {
  return generateContentFromCommentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateContentFromCommentPrompt',
  input: {schema: GenerateContentFromCommentInputSchema},
  output: {schema: GenerateContentFromCommentOutputSchema},
  prompt: `You are an AI assistant that generates WordPress content based on user comments.

  Based on the following comment, generate a title, body, and suggested tags for a WordPress post.

  Comment: {{{comment}}}

  The title should be concise and engaging.
  The body should be informative and well-written.
  The tags should be relevant and helpful for SEO.

  Ensure that the title, body and tags are appropriate and professional.
  `,config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const generateContentFromCommentFlow = ai.defineFlow(
  {
    name: 'generateContentFromCommentFlow',
    inputSchema: GenerateContentFromCommentInputSchema,
    outputSchema: GenerateContentFromCommentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
