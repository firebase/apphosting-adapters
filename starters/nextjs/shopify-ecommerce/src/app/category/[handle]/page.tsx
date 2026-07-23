import CardOverlay from '@/components/sections/card-overlay'
import ProductList from '@/components/sections/product-list'
import { getCollectionProducts, getCollection } from '@/lib/shopify'

export default async function ProductListPage({ params }: { params: Promise<{ handle: string }> }) {
  const handle = (await params).handle

  const [products, collection] = await Promise.all([
    getCollectionProducts({ collection: handle }),
    getCollection(handle)
  ])

  return (
    <>
      <ProductList title={collection?.title as string} products={products} />
      <CardOverlay
        title={collection?.title as string}
        description={collection?.description as string}
        cta={{ label: 'Shop Now', href: `/category/${collection?.handle}` }}
        image={collection?.image?.url as string}
        align="center"
      />
    </>
  )
}
