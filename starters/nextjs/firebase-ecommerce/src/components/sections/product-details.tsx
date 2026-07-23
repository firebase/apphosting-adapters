import Accordion, { Accordion as AccordionType } from '../ui/accordion'

type Props = {
  image?: {
    url: string
    height: number
    width: number
    altText?: string | null
  }
  accordions: AccordionType[]
  className?: string
}

export default function ProductDetails({ image, accordions, className }: Props) {
  if (!accordions.length) return null

  return (
    <section className={`text-foreground bg-background py-10 lg:py-24 ${className}`}>
      <div className="container grid lg:grid-cols-2 gap-10 lg:items-center xl:px-48">
        <div className="max-lg:order-last">
          {accordions.length > 0
            ? accordions.map((accordion) => <Accordion key={accordion.label} {...accordion} />)
            : null}
        </div>

        <div className="relative overflow-hidden rounded-full mx-auto lg:ml-auto before:blurred-edges [--blur:15px]">
          {image ? (
            <img
              src={image.url}
              alt={image.altText || 'Product'}
              height="617"
              width="466"
              className="h-full w-fit max-h-[617px] object-cover rounded-full"
            />
          ) : (
            <div className="absolute inset-0 bg-gray-200" />
          )}
        </div>
      </div>
    </section>
  )
}
