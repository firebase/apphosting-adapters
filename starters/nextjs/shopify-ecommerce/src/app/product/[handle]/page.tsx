import { getCustomer, getProduct } from '@/lib/shopify'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ProductSection from '@/components/sections/product-section'
import Features from '@/components/sections/features'
import Truck from '@/components/icons/truck'
import Star from '@/components/icons/star'
import Rotate from '@/components/icons/rotate'
import ProductDetails from '@/components/sections/product-details'
import Reviews from '@/components/sections/reviews'
import { dc } from '@/lib/data-connect'
import { getProductReviews } from '@dataconnect/ecommerce-template'
import { cookies } from 'next/headers'

type Props = {
  params: Promise<{ handle: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ProductPage(props: Props) {
  const params = await props.params
  const searchParams = await props.searchParams
  const selectedOptions: Array<{ name: string; value: string }> = []

  // Set selected options from the query string
  Object.entries(searchParams).forEach(([name, value]) => {
    if (typeof value === 'string') {
      selectedOptions.push({ name, value })
    }

    if (Array.isArray(value)) {
      value.forEach((v) => {
        selectedOptions.push({ name, value: v })
      })
    }
  })

  const cookieStore = await cookies()
  const customerAccessToken = cookieStore.get('__session')?.value

  const product = await getProduct(params.handle)

  const [customer, { data: reviewsData }] = await Promise.all([
    getCustomer(customerAccessToken),
    getProductReviews(dc, { productId: product?.id ?? '' })
  ])

  if (!product) return notFound()

  const { title, options, description, images, featuredImage } = product
  const variants = product.variants.edges.map((edge) => edge.node)

  const currentVariant =
    variants.find((variant) =>
      variant.selectedOptions.every((option) =>
        selectedOptions.some(
          (selected) =>
            selected.name.toLowerCase() === option.name.toLowerCase() &&
            selected.value.toLowerCase() === option.value.toLowerCase()
        )
      )
    ) ?? variants[0]

  const averageRating = reviewsData?.reviews?.length
    ? (
        reviewsData.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewsData.reviews.length
      ).toFixed(1)
    : '0.0'

  return (
    <>
      <ProductSection
        title={title}
        options={options}
        description={description}
        images={images}
        currentVariant={currentVariant}
        avgRating={Number(averageRating)}
      />
      <Features
        list={[
          { name: 'Reviews', description: `(${reviewsData?.reviews?.length ?? 0})` },
          { icon: <Truck />, name: 'Shipping & Returns' }
        ]}
        inline
      />
      <ProductDetails
        image={featuredImage ?? images[0]}
        accordions={[
          {
            label: 'Description',
            children: <p>{description}</p>
          },
          {
            label: 'Specifications',
            children: (
              <ul>
                <li>Fit: Regular fit</li>
                <li>Neckline: Crew neck</li>
                <li>Sleeves: Long sleeves with ribbed cuffs</li>
                <li>Hem: Ribbed hem</li>
              </ul>
            )
          },
          {
            label: 'Design',
            children: (
              <p>
                Classic collegiate style with a modern twist, featuring chain-stitched embroidery
                for a touch of vintage charm. The sweater&apos;s simple yet refined design makes it
                versatile enough for casual or semi-casual wear.
              </p>
            )
          },
          {
            label: 'Material & Care',
            children: (
              <ul>
                <li>Material: 100% Chenille</li>
                <li>
                  Care: Machine wash cold, gentle cycle. Lay flat to dry. Avoid bleach and tumble
                  drying to maintain the soft texture of the chenille.
                </li>
              </ul>
            )
          }
        ]}
      />
      <Features
        list={[
          { icon: <Truck />, name: 'Free Shipping', description: 'On orders over $250' },
          { icon: <Rotate />, name: 'Free Returns', description: 'On full priced items only' },
          { icon: <Star />, name: '2 Year Warranty', description: 'As standard' }
        ]}
      />
      <Reviews
        reviews={reviewsData.reviews}
        avgRating={Number(averageRating)}
        productDetails={{
          productID: product.id,
          productSlug: product.handle,
          productName: product.title,
          variantTitle: currentVariant.title,
          variantPrice: new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currentVariant.price.currencyCode
          }).format(Number(currentVariant.price.amount)),
          variantImage: featuredImage ?? images[0]
        }}
        customer={customer}
      />
    </>
  )
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const product = await getProduct(params.handle)

  if (!product?.id) return notFound()

  const { seo, title, description, featuredImage } = product ?? {}

  return {
    title: seo.title || title,
    description: seo.description || description,
    openGraph: featuredImage
      ? {
          images: [
            {
              url: featuredImage.url,
              width: featuredImage.width,
              height: featuredImage.height,
              alt: featuredImage.altText ?? undefined
            }
          ]
        }
      : null
  }
}
