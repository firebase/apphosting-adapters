'use server'

import {
  searchProductDescriptionUsingL2similarity,
  searchProductNameUsingL2similarity,
  searchReviewContentUsingL2similarity
} from '../../../dataconnect-generated/js/ecommerce-template'
import { dc } from '@/lib/data-connect'

type Error = {
  message: string
}

type SearchResult = {
  productName: string
  productID: string
  productSlug: string
}

export const handleSearch = async ({
  query
}: {
  query: string
}): Promise<SearchResult[] | Error> => {
  try {
    // Return early if no search query is provided
    if (!query) {
      return { message: 'No query provided' }
    }

    // Perform parallel searches across product descriptions, names and reviews
    const [productDescriptionSearchResults, productNameSearchResults, reviewSearchResults] =
      await Promise.all([
        searchProductDescriptionUsingL2similarity(dc, { query }),
        searchProductNameUsingL2similarity(dc, { query }),
        searchReviewContentUsingL2similarity(dc, { query })
      ])

    // Combine and normalize search results from all sources
    // Then remove duplicates based on productID
    const searchResults = [
      // Map product name search results to standard format
      ...productNameSearchResults.data.products_nameEmbedding_similarity.map((product) => ({
        productName: product.productName,
        productID: product.productID,
        productSlug: product.productSlug
      })),
      // Map product description search results to standard format
      ...productDescriptionSearchResults.data.products_descriptionEmbedding_similarity.map(
        (product) => ({
          productName: product.productName,
          productID: product.productID,
          productSlug: product.productSlug
        }),
        // Map review search results to standard format
        ...reviewSearchResults.data.reviews_contentEmbedding_similarity.map((review) => ({
          productName: review.productName,
          productID: review.productID,
          productSlug: review.productSlug
        }))
      )
      // Filter out duplicate products by keeping only the first occurrence of each productID
    ].filter((item, index, self) => index === self.findIndex((t) => t.productID === item.productID))

    return searchResults
  } catch (error) {
    return { message: `Error performing search: ${error}` }
  }
}
