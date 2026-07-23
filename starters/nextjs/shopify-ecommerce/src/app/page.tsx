import CardCarousel from '@/components/sections/card-carousel'
import CardOverlay from '@/components/sections/card-overlay'
import Details from '@/components/sections/details'
import Hero from '@/components/sections/hero'
import ProductGrid from '@/components/sections/product-grid'
import CategoryCard from '@/components/ui/category-card'

import { getCollections } from '@/lib/shopify'
import { notFound } from 'next/navigation'

export default async function Home() {
  const collections = await getCollections()
  const mainCollection = collections.find((collection) => collection.title === 'O24 — Collection')
  const winterEssentials = collections.find(
    (collection) => collection.title === 'Winter Essentials'
  )
  const mistCollection = collections.find((collection) => collection.title === 'Mist Collection')

  if (!collections.length) return notFound()

  return (
    <>
      <Hero
        title={mainCollection?.title as string}
        description={mainCollection?.description as string}
        image={mainCollection?.image.url as string}
        primaryCta={{ label: 'Shop Now', href: '/products' }}
        secondaryCta={{ label: 'Learn More', href: '/products' }}
      />
      <Details title="About" body={mainCollection?.description as string} />
      <CardCarousel title="Explore" cta={{ label: 'Shop All', href: '/products' }}>
        {collections
          .filter((collection) => collection?.image?.url?.length > 0)
          .map((collection) => (
            <CategoryCard key={collection.handle} collection={collection} />
          ))}
      </CardCarousel>
      <CardOverlay
        title={mistCollection?.title as string}
        description={mistCollection?.description as string}
        cta={{ label: 'Shop Now', href: `/category/${mistCollection?.handle}` }}
        image={mistCollection?.image.url as string}
      />
      <ProductGrid
        title={winterEssentials?.title as string}
        products={winterEssentials?.products.edges.map((edge) => edge.node) || []}
        variant="character"
      />
    </>
  )
}
