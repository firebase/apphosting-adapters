'use server';

import { generateContentFromComment } from '@/ai/flows/generate-content-from-comment';
import { analyzePhotoForContentSuggestions } from '@/ai/flows/analyze-photo-for-content-suggestions';
import { improveExistingPost } from '@/ai/flows/improve-existing-post';
import type { GeneratedContent } from './types';

export async function generateFromCommentAction(comment: string): Promise<GeneratedContent> {
  if (!comment) {
    throw new Error('Comment cannot be empty.');
  }

  try {
    const result = await generateContentFromComment({ comment });
    return result;
  } catch (error) {
    console.error('Error generating content from comment:', error);
    throw new Error('Failed to generate content. Please try again.');
  }
}

export async function generateFromPhotoAction(photoDataUri: string): Promise<GeneratedContent> {
  if (!photoDataUri) {
    throw new Error('Photo data cannot be empty.');
  }

  try {
    // Step 1: Analyze photo for suggestions
    const suggestions = await analyzePhotoForContentSuggestions({ photoDataUri });

    // Step 2: Format suggestions into a prompt for the next step
    const combinedIdeas = `
      Based on an analysis of a provided image, please generate a blog post.
      
      Key themes and topics identified from the image:
      - ${suggestions.suggestedTopics.join('\n- ')}
      
      Specific content ideas to explore:
      - ${suggestions.contentIdeas.join('\n- ')}
      
      Use these points as inspiration to write a compelling and relevant blog post with a title, body, and tags.
    `;
    
    // Step 3: Generate the full post using the formatted suggestions
    const result = await generateContentFromComment({ comment: combinedIdeas });

    return result;
  } catch (error) {
    console.error('Error generating content from photo:', error);
    throw new Error('Failed to generate content from the photo. Please try again.');
  }
}

export async function improvePostAction(existingPost: string, desiredStyle: string): Promise<GeneratedContent> {
  if (!existingPost || !desiredStyle) {
    throw new Error('Existing post and desired style cannot be empty.');
  }

  try {
    const result = await improveExistingPost({ existingPost, desiredStyle });
    return result;
  } catch (error) {
    console.error('Error improving post:', error);
    throw new Error('Failed to improve post. Please try again.');
  }
}
