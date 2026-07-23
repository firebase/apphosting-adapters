import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const extractVariantOptions = (
  products: {
    id: string
    title: string
    handle: string
    featuredImage: {
      url: string
      altText?: string | null
      width: number
      height: number
    }
    variants: {
      id: string
      price: number
      availableForSale: boolean
      inventoryQuantity: number
      selectedOptions_on_productVariant: {
        name?: string | null
        value?: string | null
      }[]
    }[]
  }[]
) => {
  if (!products) return {}

  return products.reduce(
    (acc, product) => {
      product.variants.forEach((variant) => {
        variant.selectedOptions_on_productVariant.forEach((option) => {
          if (!option.name || !option.value) return

          const name = option.name.toLowerCase()
          if (!acc[name]) {
            acc[name] = new Set<string>()
          }
          acc[name].add(option.value.toLowerCase())
        })
      })
      return acc
    },
    {} as Record<string, Set<string>>
  )
}
