'use client'

import { useState } from 'react'

import Select from '../ui/select'
import Filter from '../ui/filter'
import ProductCard from '../ui/product-card'
import { cn, extractVariantOptions } from '@/lib/utils'
import { useSearchParams } from 'next/navigation'

type Props = {
  title: string
  products?: {
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
}

export default function ProductList({ title, products }: Props) {
  const [openFilters, setOpenFilters] = useState(false)
  const searchParams = useSearchParams()

  // Get all filter values from search params, ignoring sort parameter
  const activeFilters = Array.from(searchParams.entries()).reduce(
    (acc, [key, value]) => {
      if (key === 'sort') return acc
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(...value.toLowerCase().split(','))
      return acc
    },
    {} as Record<string, string[]>
  )

  // Filter products based on search params
  const filteredProducts = products?.filter((product) => {
    if (Object.keys(activeFilters).length === 0) return true

    return Object.entries(activeFilters).every(([filterKey, filterValues]) => {
      const productVariants = product.variants
      return productVariants.some((variant) =>
        variant.selectedOptions_on_productVariant.some(
          (option) =>
            option.name?.toLowerCase() === filterKey.toLowerCase() &&
            option.value &&
            filterValues.includes(option.value.toLowerCase())
        )
      )
    })
  })

  if (!products?.length) return null

  // Replace the hardcoded variantOptions with:
  const variantOptions = extractVariantOptions(products)

  const filterOptions = Object.entries(variantOptions).map(([label, options]) => ({
    label: label.charAt(0).toUpperCase() + label.slice(1),
    options: Array.from(options).map((value) => ({
      label: value.charAt(0).toUpperCase() + value.slice(1),
      value: value
    }))
  }))

  return (
    <section className="text-foreground bg-background py-16 lg:py-24 space-y-8 lg:space-y-20">
      <div className="container flex flex-wrap justify-between items-end gap-8">
        {title && <h1 className="text-4xl lg:text-8xl max-w-3xl">{title}</h1>}

        <div className="flex flex-wrap gap-2">
          <Filter filters={filterOptions} open={openFilters} setOpen={setOpenFilters} />
          <Select
            label="Sort"
            defaultValue={{ label: 'Featured items', value: 'featured-items' }}
            options={[
              { label: 'Price: Low to high', value: 'price-asc' },
              { label: 'Price: High to low', value: 'price-desc' }
            ]}
            onChange={() => {}}
          />
        </div>
      </div>

      <div className="container grid lg:grid-cols-6 gap-x-2 gap-y-6 lg:gap-x-5 lg:gap-y-16">
        {filteredProducts?.map((product, index) => {
          const mobileIndex = products?.indexOf(product) ?? 0
          return (
            <ProductCard
              key={product.handle}
              image={product.featuredImage}
              name={product.title}
              price={product.variants[0].price.toString()}
              slug={product.handle}
              title={product.title}
              className={cn(
                {
                  'col-span-2': mobileIndex % 10 === 3 || mobileIndex % 10 === 4,
                  'max-lg:col-span-2': [2, 7].includes(mobileIndex % 10)
                },
                [3, 4].includes(index % 10) ? 'lg:col-span-3' : 'lg:col-span-2'
              )}
            />
          )
        })}
      </div>
    </section>
  )
}
