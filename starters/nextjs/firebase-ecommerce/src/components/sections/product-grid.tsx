import ProductCard from '../ui/product-card'
import ProductGridItem from '../ui/product-grid-item'

type Props = {
  title: string
  variant?: 'character' | 'simple' | 'minimal'
  products: {
    id: string
    title: string
    handle: string
    price: string
    image?: {
      url: string
      altText?: string | null
      width: number
      height: number
    }
    variants?: string[]
  }[]
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
                  image={product.image}
                  name={product.title}
                  price={product.price}
                  slug={product.handle}
                  title={product.title}
                  tags={product.variants?.join('/') || ''}
                />
              ) : (
                <ProductGridItem
                  key={product.id}
                  index={index}
                  variant={variant}
                  image={product.image}
                  name={product.title}
                  price={product.price}
                  slug={product.handle}
                  tags={product.variants?.join('/') || ''}
                />
              )
            )}
          </div>
        ) : null}
      </div>
    </section>
  )
}
