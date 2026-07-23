import CardOverlay from '@/components/card-overlay'
import ProductList from '@/components/sections/product-list'
import { dc } from '@/lib/data-connect'
import { getCollectionByHandle } from '@firebasegen/default-connector'

export default async function ProductListPage({ params }: { params: Promise<{ handle: string }> }) {
  const handle = (await params).handle

  const { data: collectionData } = await getCollectionByHandle(dc, { handle })
  const collection = collectionData?.collections?.at(0)
  const products = collection?.products_via_ProductCollection

  return (
    <>
      <ProductList
        title={collection?.name as string}
        products={products?.map((product) => ({
          id: product.id,
          title: product.title,
          handle: product.handle,
          featuredImage: product.productImages_on_product[0],
          variants: product.productVariants_on_product
        }))}
      />
      <CardOverlay
        title={collection?.name as string}
        description={collection?.description as string}
        cta={{ label: 'Shop Now', href: `/category/${handle}` }}
        image={
          collection?.featuredImage?.url ??
          (products?.[0]?.productImages_on_product?.[0]?.url as string)
        }
        align="center"
      />
    </>
  )
}
