'use client'

import { useState, useEffect } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { cn } from '@/lib/utils'
import Button from '../ui/button'
import Rating from '../ui/rating'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { setCookie, getCookie } from 'cookies-next'
import { create } from 'zustand'
import { handleAddToCart } from '@/lib/actions/product'

type Props = {
  title: string | null
  options: ProductOption[]
  images: Image[]
  currentVariant?: ProductVariant
  description: string | null
  avgRating: number
}

// Simple Zustand store for handling selections
type SelectionState = {
  selections: Record<string, string>
  updateSelection: (name: string, value: string) => void
}

const useSelectionStore = create<SelectionState>((set) => ({
  selections: {},
  updateSelection: (name, value) =>
    set((state) => ({
      selections: {
        ...state.selections,
        [name.toLowerCase()]: value.toLowerCase()
      }
    }))
}))

export default function ProductSection({
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
  const { selections, updateSelection } = useSelectionStore()

  useEffect(() => {
    if (emblaApi) {
      emblaApi.on('select', () => {
        const index = emblaApi.selectedScrollSnap()
        setSelectedImage(index)
        thumbnailEmblaApi?.scrollTo(index)
      })
    }
  }, [emblaApi, thumbnailEmblaApi])

  // Initialize selections from URL on mount
  useEffect(() => {
    const currentSelections: Record<string, string> = {}
    for (const [key, value] of searchParams.entries()) {
      currentSelections[key] = value
    }
    Object.entries(currentSelections).forEach(([name, value]) => {
      updateSelection(name, value)
    })
  }, [searchParams, updateSelection])

  const handleOptionSelect = (name: string, value: string) => {
    // Check if the option is already selected
    const isSelected = selections[name.toLowerCase()] === value.toLowerCase()

    if (isSelected) {
      // If selected, remove it from selections
      const newSelections = { ...selections }
      delete newSelections[name.toLowerCase()]
      useSelectionStore.setState({ selections: newSelections })

      // Remove from URL params
      const newParams = new URLSearchParams(searchParams.toString())
      newParams.delete(name.toLowerCase())
      push(`?${newParams.toString()}`, { scroll: false })
    } else {
      // If not selected, update as before
      updateSelection(name, value)

      // Update URL
      const newParams = new URLSearchParams(searchParams.toString())
      newParams.set(name.toLowerCase(), value.toLowerCase())
      push(`?${newParams.toString()}`, { scroll: false })
    }
  }

  return (
    <section className="text-foreground bg-background">
      <div className="lg:container grid lg:grid-cols-2 gap-8 lg:p-6">
        <div className="lg:sticky lg:top-24 lg:h-fit space-y-4">
          <div
            ref={emblaRef}
            className="overflow-hidden max-w-full rounded-xl lg:rounded-3xl max-lg:m-3"
          >
            <div className="flex">
              {images?.length > 0 &&
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
                          className="object-cover bg-gray-200 absolute inset-0 w-full h-full"
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
              {images?.length > 1 &&
                images.map((image, index) => (
                  <button
                    key={`thumbnail-${index}`}
                    aria-label={`image-${index + 1}`}
                    onClick={() => {
                      emblaApi?.scrollTo(index)
                      setSelectedImage(index)
                    }}
                    className={cn(
                      'relative h-14 w-14 lg:h-28 lg:w-28 shrink-0 transition-all duration-500 ease-in-out rounded-xl lg:rounded-3xl hover:brightness-95',
                      { selected: selectedImage === index }
                    )}
                  >
                    <img
                      src={image.url}
                      alt={`Thumbnail ${index + 1}`}
                      sizes="(max-width: 768px) 56px, 112px"
                      className="object-cover rounded-xl lg:rounded-3xl absolute inset-0 w-full h-full"
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
                currency: currentVariant?.price.currencyCode || 'USD'
              }).format(Number(currentVariant?.price.amount || 0))}
            </div>
            <div className="pt-2 lg:pt-12 space-y-4">
              {options.map((option) => (
                <div key={option.id} className="space-y-2">
                  <h3 className="text-sm">{option.name}</h3>
                  <ul className="flex flex-wrap gap-2">
                    {option.values.map((value) => (
                      <li key={value}>
                        <Button
                          variant="square"
                          onClick={() => handleOptionSelect(option.name, value)}
                          className={cn(
                            'transition-all ease-in-out',
                            selections[option.name.toLowerCase()] === value.toLowerCase()
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
              disabled={!currentVariant}
              onClick={async () => {
                if (!currentVariant) return
                const cartId = (await getCookie('cartId')) as string | undefined

                const res = await handleAddToCart({
                  currentVariant,
                  cartId
                })
                if (typeof res === 'string') {
                  setCookie('cartId', res)
                }
              }}
              className="w-full lg:max-w-72"
            >
              Add to cart
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
