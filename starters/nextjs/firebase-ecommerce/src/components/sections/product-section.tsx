'use client'

import { useState, useEffect } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { cn } from '@/lib/utils'
import Button from '../ui/button'
import Rating from '../ui/rating'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { ProductVariant_Key } from '@firebasegen/default-connector'
import { useCartStore } from '@/lib/stores/cart-store'
import { useShallow } from 'zustand/shallow'
import { useProductStore } from '@/lib/stores/product-store'

type Props = {
  productId: string
  title?: string
  options: Record<string, string[]>
  images?: {
    url: string
    altText?: string | null
    height?: number | null
    width?: number | null
  }[]
  currentVariant?: {
    id: string
    price: number
    availableForSale: boolean
    inventoryQuantity: number
    selectedOptions_on_productVariant: {
      name?: string | null
      value?: string | null
    }[]
  } & ProductVariant_Key
  description?: string
  avgRating: number
}

export default function ProductSection({
  productId,
  title,
  description,
  options,
  images,
  currentVariant,
  avgRating
}: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })
  const [thumbnailEmblaRef, thumbnailEmblaApi] = useEmblaCarousel({
    containScroll: 'keepSnaps',
    dragFree: true
  })
  const [selectedImage, setSelectedImage] = useState(0)
  const searchParams = useSearchParams()
  const { push } = useRouter()
  const { updateOption, state } = useProductStore()
  const { addProduct } = useCartStore(useShallow((state) => ({ addProduct: state.addProduct })))

  useEffect(() => {
    if (emblaApi) {
      emblaApi.on('select', () => {
        const index = emblaApi.selectedScrollSnap()
        setSelectedImage(index)
        thumbnailEmblaApi?.scrollTo(index)
      })
    }
  }, [emblaApi, thumbnailEmblaApi])

  // Initialize selections from URL on mount and clear on unmount
  useEffect(() => {
    // Reset the store first
    useProductStore.setState({ state: {} })

    // Then initialize from URL if params exist
    const currentSelections: Record<string, string> = {}
    for (const [key, value] of searchParams.entries()) {
      currentSelections[key] = value
    }

    if (Object.keys(currentSelections).length > 0) {
      Object.entries(currentSelections).forEach(([name, value]) => {
        updateOption(name, value)
      })
    }

    // Cleanup function to reset store state when unmounting
    return () => {
      useProductStore.setState({ state: {} })
    }
  }, [searchParams, updateOption])

  const handleOptionSelect = (name: string, value: string) => {
    // Check if the option is already selected
    const isSelected = state[name.toLowerCase()] === value.toLowerCase()

    if (isSelected) {
      // If selected, remove it from selections
      const newSelections = { ...state }
      delete newSelections[name.toLowerCase()]
      useProductStore.setState({ state: newSelections })

      // Remove from URL params
      const newParams = new URLSearchParams(searchParams.toString())
      newParams.delete(name.toLowerCase())
      push(`?${newParams.toString()}`, { scroll: false })
    } else {
      // If not selected, update as before
      updateOption(name, value)

      // Update URL
      const newParams = new URLSearchParams(searchParams.toString())
      newParams.set(name.toLowerCase(), value.toLowerCase())
      push(`?${newParams.toString()}`, { scroll: false })
    }
  }

  return (
    <section className="text-foreground bg-background">
      <div className="lg:container grid lg:grid-cols-2 gap-8 lg:p-6">
        <div className="space-y-4">
          <div
            ref={emblaRef}
            className="overflow-hidden max-w-full rounded-xl lg:rounded-3xl max-lg:m-3"
          >
            <div className="flex">
              {images?.length &&
                images.map((image, index) => (
                  <div
                    key={`main-image-${index}`}
                    className="flex-shrink-0 w-full h-full cursor-grab active:cursor-grabbing"
                  >
                    <div className="relative aspect-square lg:aspect-[4/5]">
                      {image ? (
                        <img
                          src={image.url}
                          alt={image.altText || 'Product photo'}
                          sizes="(max-width: 768px) 100vw, 752px"
                          className="object-cover bg-gray-200 absolute w-full h-full inset-0"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gray-200" />
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div ref={thumbnailEmblaRef} className="overflow-hidden max-w-full">
            <div className="flex gap-3 w-screen max-lg:px-3 max-lg:scroll-px-3">
              {images?.length &&
                images.map((image, index) => (
                  <button
                    key={`thumbnail-${index}`}
                    aria-label={`image-${index + 1}`}
                    onClick={() => {
                      emblaApi?.scrollTo(index)
                      setSelectedImage(index)
                    }}
                    style={{ backgroundImage: `url(${image})` }}
                    className={cn(
                      'relative h-14 w-14 lg:h-28 lg:w-28 shrink-0 transition-all duration-500 ease-in-out rounded-xl lg:rounded-3xl hover:brightness-95',
                      { selected: selectedImage === index }
                    )}
                  >
                    <img
                      src={image.url}
                      alt={`Thumbnail ${index + 1}`}
                      sizes="(max-width: 768px) 56px, 112px"
                      className="object-cover rounded-xl lg:rounded-3xl absolute w-full h-full inset-0"
                    />
                  </button>
                ))}
            </div>
          </div>
        </div>

        <div className="px-4 py-5 flex items-center justify-center">
          <div className="space-y-4 lg:max-w-lg w-full">
            <h1 className="text-4xl">{title}</h1>
            <Rating rating={avgRating} />
            <p className="lg:text-lg leading-7">{description}</p>
            <div className="text-2xl font-normal">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
              }).format(Number(currentVariant?.price || 0))}
            </div>
            <div className="pt-2 lg:pt-12 space-y-4">
              {Object.entries(options).map(([name, values]) => (
                <div key={name} className="space-y-2">
                  <h3 className="text-sm">{name}</h3>
                  <ul className="flex flex-wrap gap-2">
                    {values.map((value) => (
                      <li key={value}>
                        <Button
                          variant="square"
                          onClick={() => handleOptionSelect(name, value)}
                          className={cn(
                            'transition-all ease-in-out',
                            state[name.toLowerCase()] === value.toLowerCase()
                              ? 'selected text-white bg-foreground hover:bg-foreground duration-1000'
                              : 'duration-500'
                          )}
                        >
                          {value}
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <Button
              variant="primary"
              disabled={
                !currentVariant ||
                Object.keys(options).length > Object.keys(state).length ||
                Object.keys(options).some((optionName) => !state[optionName.toLowerCase()])
              }
              onClick={async () => {
                if (!currentVariant) return
                addProduct({
                  productId,
                  quantity: 1,
                  price: currentVariant.price,
                  name: title ?? '',
                  selectedOption: Object.entries(options).map(([name]) => ({
                    name,
                    value: state[name.toLowerCase()] || ''
                  })),
                  image: images?.[0]
                })
              }}
              className="w-full lg:max-w-72"
            >
              {Object.keys(options).length > Object.keys(state).length ||
              Object.keys(options).some((optionName) => !state[optionName.toLowerCase()])
                ? 'Select options'
                : 'Add to cart'}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
