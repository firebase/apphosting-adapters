'use server'

import {
  searchProductDescriptionUsingL2similarity,
  searchProductTitleUsingL2similarity,
  searchProductReviewContentUsingL2similarity
} from '@firebasegen/default-connector'
import { dc } from '@/lib/data-connect'

type Error = {
  message: string
}

export type SearchResult = {
  title: string
  handle: string
  id: string
}[]

export const handleSearch = async ({ query }: { query: string }): Promise<SearchResult | Error> => {
  try {
    // Return early if no search query is provided
    if (!query) {
      return { message: 'No query provided' }
    }

    // Perform parallel searches across product descriptions, names and reviews
    const [productDescriptionSearchResults, productNameSearchResults, reviewSearchResults] =
      await Promise.all([
        searchProductDescriptionUsingL2similarity(dc, { query }),
        searchProductTitleUsingL2similarity(dc, { query }),
        searchProductReviewContentUsingL2similarity(dc, { query })
      ])

    // Combine and normalize search results from all sources
    // Then remove duplicates based on productID
    const searchResults = [
      // Map product name search results to standard format
      ...productNameSearchResults.data.products_titleEmbedding_similarity.map((product) => ({
        title: product.title,
        handle: product.handle,
        id: product.id
      })),
      // Map product description search results to standard format
      ...productDescriptionSearchResults.data.products_descriptionEmbedding_similarity.map(
        (product) => ({
          title: product.title,
          handle: product.handle,
          id: product.id
        }),
        // Map review search results to standard format
        ...reviewSearchResults.data.productReviews_contentEmbedding_similarity.map((review) => ({
          title: review.product.title,
          handle: review.product.handle,
          id: review.product.id
        }))
      )
      // Filter out duplicate products by keeping only the first occurrence of each productID
    ].filter((item, index, self) => index === self.findIndex((t) => t.id === item.id))

    return searchResults
  } catch (error) {
    return { message: `Error performing search: ${error}` }
  }
}
