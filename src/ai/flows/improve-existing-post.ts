'use server';

/**
 * @fileOverview Rewrites an existing blog post to match a desired style, generating a new title and tags.
 *
 * - improveExistingPost - A function that handles the rewriting process.
 * - ImproveExistingPostInput - The input type for the improveExistingPost function.
 * - ImproveExistingPostOutput - The return type for the improveExistingPost function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ImproveExistingPostInputSchema = z.object({
  existingPost: z.string().describe('The existing blog post content.'),
  desiredStyle: z.string().describe('The desired style for the blog post.'),
});
export type ImproveExistingPostInput = z.infer<typeof ImproveExistingPostInputSchema>;

const ImproveExistingPostOutputSchema = z.object({
  title: z.string().describe('The new, improved title for the blog post.'),
  body: z.string().describe('The rewritten blog post content.'),
  tags: z.array(z.string()).describe('A list of relevant tags for the rewritten post.'),
});
export type ImproveExistingPostOutput = z.infer<typeof ImproveExistingPostOutputSchema>;

export async function improveExistingPost(input: ImproveExistingPostInput): Promise<ImproveExistingPostOutput> {
  return improveExistingPostFlow(input);
}

const prompt = ai.definePrompt({
  name: 'improveExistingPostPrompt',
  input: {schema: ImproveExistingPostInputSchema},
  output: {schema: ImproveExistingPostOutputSchema},
  prompt: `You are an expert blog post writer. You will rewrite the existing blog post to match the desired style.
You must also generate a new, catchy title for the post and a list of relevant tags.

Existing Blog Post:
{{{existingPost}}}

Desired Style:
{{{desiredStyle}}}

Respond with the rewritten post body, a new title, and new tags in the specified JSON format.`,
  config: {
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

const improveExistingPostFlow = ai.defineFlow(
  {
    name: 'improveExistingPostFlow',
    inputSchema: ImproveExistingPostInputSchema,
    outputSchema: ImproveExistingPostOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
