import ProductCard from '../ui/product-card'
import ProductGridItem from '../ui/product-grid-item'

type Props = {
  title: string
  products: ShopifyProduct[]
  variant?: 'character' | 'simple' | 'minimal'
}

export default function ProductGrid({ title, products, variant = 'character' }: Props) {
  return (
    <section className="text-foreground bg-background py-16 md:py-24">
      <div className="container">
        {title ? (
          <h2 className="text-justify text-2xl md:text-8xl max-md:px-12 after:content-[''] after:inline-block after:w-full">
            {title}
          </h2>
        ) : null}

        {products && products.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-5">
            {products.map((product, index) =>
              variant === 'minimal' ? (
                <ProductCard
                  key={product.id}
                  image={product.images.edges[0].node}
                  name={product.title}
                  price={`${product.priceRange.minVariantPrice.currencyCode} ${product.priceRange.minVariantPrice.amount}`}
                  slug={product.handle}
                  title={product.title}
                  tags={product.variants.edges[0].node.selectedOptions
                    .map((option) => option.value)
                    .join('/')}
                />
              ) : (
                <ProductGridItem
                  key={product.id}
                  index={index}
                  variant={variant}
                  image={product.images.edges[0].node}
                  name={product.title}
                  price={product.priceRange.minVariantPrice.amount}
                  slug={product.handle}
                  tags={product.variants.edges[0].node.selectedOptions
                    .map((option) => option.value)
                    .join('/')}
                />
              )
            )}
          </div>
        ) : null}
      </div>
    </section>
  )
}
