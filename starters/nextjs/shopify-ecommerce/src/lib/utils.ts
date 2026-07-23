import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function extractVariantOptions(products: ShopifyProduct[]): Record<string, string[]> {
  const options: Record<string, Set<string>> = {}

  // Iterate through each product
  products.forEach((product) => {
    // Look through each product's options
    product.options.forEach((option) => {
      const optionName = option.name.toLowerCase()

      // Initialize the Set if it doesn't exist
      if (!options[optionName]) {
        options[optionName] = new Set()
      }

      // Add all values for this option
      option.values.forEach((value) => {
        options[optionName].add(value.toLowerCase())
      })
    })
  })

  // Convert Sets to arrays and sort them
  return Object.entries(options).reduce(
    (acc, [key, values]) => {
      acc[key] = Array.from(values).sort()
      return acc
    },
    {} as Record<string, string[]>
  )
}
