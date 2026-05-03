'use server';

import type { GeneratedContent, WpPost, WpPostType, WpTag } from './types';

/**
 * Converts an array of tag names into an array of tag IDs.
 * It fetches existing tags from WordPress, creates any that don't exist,
 * and returns their numerical IDs.
 * @param tagNames - An array of tag names (strings).
 * @param baseUrl - The base URL of the WordPress site.
 * @param headers - The authorization headers for the API request.
 * @returns A promise that resolves to an array of tag IDs (numbers).
 */
async function getTagIds(tagNames: string[], baseUrl: string, headers: HeadersInit): Promise<number[]> {
    if (!tagNames || tagNames.length === 0) {
        return [];
    }

    try {
        // 1. Fetch existing tags to avoid creating duplicates.
        const existingTagsResponse = await fetch(`${baseUrl}/wp-json/wp/v2/tags?per_page=100&orderby=count&order=desc`, { headers, cache: 'no-store' });
        
        const existingTags: WpTag[] = await existingTagsResponse.json().catch(() => []);
        const existingTagsMap = new Map(existingTags.map((tag) => [tag.name.toLowerCase(), tag.id]));
        
        const tagIds: number[] = [];

        for (const tagName of tagNames) {
            const lowerCaseTagName = tagName.toLowerCase();
            // 2. Check if the tag already exists.
            if (existingTagsMap.has(lowerCaseTagName)) {
                tagIds.push(existingTagsMap.get(lowerCaseTagName)!);
            } else {
                // 3. If not, create it.
                try {
                    const createTagResponse = await fetch(`${baseUrl}/wp-json/wp/v2/tags`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({ name: tagName }),
                    });

                    if (createTagResponse.ok) {
                        const newTag: WpTag = await createTagResponse.json();
                        tagIds.push(newTag.id);
                        // Add to our map to avoid re-creating if it appears again in the same post.
                        existingTagsMap.set(newTag.name.toLowerCase(), newTag.id);
                    } else {
                        console.warn(`Failed to create tag: ${tagName}. Status: ${createTagResponse.status}`);
                    }
                } catch (createError) {
                     console.warn(`Error creating tag '${tagName}':`, createError);
                }
            }
        }
        return tagIds;
    } catch (error) {
        console.error("An error occurred while processing tags:", error);
        // Return an empty array to ensure post publication is not blocked by a tag issue.
        return [];
    }
}


export async function publishToWordPressAction(
  content: GeneratedContent,
  wpUrl: string,
  username: string,
  appPass: string
): Promise<{ postUrl: string, postId: number }> {
  const { title, body, tags, postId, postType = 'posts' } = content;

  if (!wpUrl || !username || !appPass) {
    throw new Error('WordPress URL, username, and application password are required.');
  }

  let fullUrl = wpUrl;
  if (!/^https?:\/\//i.test(fullUrl)) {
    fullUrl = 'https://' + fullUrl;
  }
  // Sanitize URL by removing /wp-admin and/or trailing slash
  fullUrl = fullUrl.replace(/\/wp-admin\/?$/, "").replace(/\/$/, "");

  const endpoint = postId
    ? `${fullUrl}/wp-json/wp/v2/${postType}/${postId}`
    : `${fullUrl}/wp-json/wp/v2/${postType}`;

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Basic ${Buffer.from(`${username}:${appPass}`).toString('base64')}`,
  };

  const postData: {
    title: string;
    content: string;
    status: 'publish' | 'draft';
    tags?: number[];
  } = {
    title,
    content: body,
    status: 'publish',
  };

  if (postType === 'posts' && tags && tags.length > 0) {
    const tagIds = await getTagIds(tags, fullUrl, headers);
    if (tagIds.length > 0) {
        postData.tags = tagIds;
    }
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(postData),
      cache: 'no-store'
    });

    if (!response.ok) {
      const responseData = await response.json().catch(() => null);
      const errorMessage = responseData?.message || response.statusText || 'An unknown error occurred while publishing to WordPress.';
      throw new Error(`WordPress API Error: ${errorMessage}`);
    }

    const responseData = await response.json().catch(() => null);

    if (!responseData?.link || !responseData?.id) {
      throw new Error('Published successfully, but did not receive a valid post URL or ID from WordPress.');
    }

    return { postUrl: responseData.link, postId: responseData.id };
  } catch (error) {
    console.error('Error publishing to WordPress:', error);
    if (error instanceof Error) {
      if (error.message.includes('Unexpected token')) {
        throw new Error('Could not publish. Received an invalid (non-JSON) response. Please check your Site URL.');
      }
      throw error;
    }
    throw new Error('Failed to publish to WordPress. Please check your credentials, URL, and if the post ID is correct.');
  }
}

export async function searchWordPressPostsAction(
  query: string,
  wpUrl: string,
  username: string,
  appPass: string,
  postType: WpPostType
): Promise<WpPost[]> {
  if (!wpUrl || !username || !appPass) {
    throw new Error('WordPress URL, username, and application password are required.');
  }
  if (!query) {
    throw new Error('Search query cannot be empty.');
  }

  let fullUrl = wpUrl;
  if (!/^https?:\/\//i.test(fullUrl)) {
    fullUrl = 'https://' + fullUrl;
  }
  // Sanitize URL by removing /wp-admin and/or trailing slash
  fullUrl = fullUrl.replace(/\/wp-admin\/?$/, "").replace(/\/$/, "");

  const endpoint = `${fullUrl}/wp-json/wp/v2/${postType}?search=${encodeURIComponent(query)}&status=publish&_fields=id,title,content,excerpt`;

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Basic ${Buffer.from(`${username}:${appPass}`).toString('base64')}`,
  };

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers,
      cache: 'no-store'
    });

    if (!response.ok) {
       let errorMessage = `Error: ${response.status} ${response.statusText}`;
       try {
         const errorData = await response.json();
         errorMessage = `WordPress Error: ${errorData.message || 'Could not fetch posts.'}`;
       } catch (e) {
          errorMessage = `Could not connect to the WordPress REST API. Please check the Site URL and ensure the API is not blocked. Status: ${response.status}`;
       }
       throw new Error(errorMessage);
    }
    
    try {
      const posts: WpPost[] = await response.json();
      return posts;
    } catch (e) {
      throw new Error('Received an invalid response from WordPress. The REST API might be disabled or returning HTML instead of JSON.');
    }

  } catch (error) {
    console.error('Error searching WordPress posts:', error);
     if (error instanceof Error) {
        throw new Error(error.message);
    }
    throw new Error('Failed to search posts. Please check your credentials and URL.');
  }
}

export async function getWordPressPostAction(
  postId: number,
  postType: WpPostType,
  wpUrl: string,
  username: string,
  appPass: string
): Promise<WpPost> {
  if (!wpUrl || !username || !appPass) {
    throw new Error('WordPress URL, username, and application password are required.');
  }
  if (!postId) {
    throw new Error('Post ID is required.');
  }

  let fullUrl = wpUrl;
  if (!/^https?:\/\//i.test(fullUrl)) {
    fullUrl = 'https://' + fullUrl;
  }
  fullUrl = fullUrl.replace(/\/wp-admin\/?$/, "").replace(/\/$/, "");

  const endpoint = `${fullUrl}/wp-json/wp/v2/${postType}/${postId}?_fields=id,title,content,excerpt`;

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Basic ${Buffer.from(`${username}:${appPass}`).toString('base64')}`,
  };

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers,
      cache: 'no-store'
    });

    if (!response.ok) {
       let errorMessage = `Error: ${response.status} ${response.statusText}`;
       try {
         const errorData = await response.json();
         errorMessage = `WordPress Error: ${errorData.message || 'Could not fetch post.'}`;
       } catch (e) {
          errorMessage = `Could not connect to the WordPress REST API. Status: ${response.status}`;
       }
       throw new Error(errorMessage);
    }
    
    const post: WpPost = await response.json();
    return post;

  } catch (error) {
    console.error('Error fetching WordPress post:', error);
     if (error instanceof Error) {
        throw new Error(error.message);
    }
    throw new Error('Failed to fetch post. Please check your credentials and URL.');
  }
}
