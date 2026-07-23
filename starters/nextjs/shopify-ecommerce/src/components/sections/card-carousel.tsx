import Carousel, { Carousel as Props } from '../ui/carousel'

export default function CardCarousel({ title, cta, children }: Props) {
  return (
    <section className="text-foreground bg-background pt-10 pb-3 lg:py-24">
      <div className="lg:container space-y-10">
        <Carousel title={title} cta={cta}>
          {children}
        </Carousel>
      </div>
    </section>
  )
}
