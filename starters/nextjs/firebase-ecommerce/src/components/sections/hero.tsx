import Button from '../ui/button'

type Props = {
  title: string
  description?: string
  primaryCta?: {
    label: string
    href: string
  }
  secondaryCta?: {
    label: string
    href: string
  }
  image: string
}

export default function Hero({ title, description, primaryCta, secondaryCta, image }: Props) {
  return (
    <section className="text-foreground bg-background pt-5 pb-3 lg:pt-10 lg:pb-20">
      <div className="relative container flex flex-col items-center">
        <h1 className="text-5xl lg:text-9xl text-center max-w-5xl translate-y-5 lg:translate-y-10 z-10">
          {title}
        </h1>

        <div className="relative w-full h-[549px] lg:h-[900px] rounded-3xl lg:rounded-4xl overflow-hidden">
          {image ? (
            <>
              <img
                src={image}
                alt={title}
                sizes="(max-width: 768px) 100vw, 1554px"
                className="object-cover bg-gray-200 absolute w-full h-full inset-0"
              />
              <div className="blurred-edges [--blur:25px]" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gray-200" />
          )}
        </div>

        <article className="absolute bottom-10 lg:bottom-12 space-y-10 w-full max-w-xl">
          {description ? (
            <p className="text-white/90 text-center lg:text-lg leading-7 px-7">{description}</p>
          ) : null}

          <div className="flex gap-4 justify-center">
            {primaryCta ? <Button href={primaryCta.href}>{primaryCta.label}</Button> : null}
            {secondaryCta ? (
              <Button href={secondaryCta.href} variant="secondary">
                {secondaryCta.label}
              </Button>
            ) : null}
          </div>
        </article>
      </div>
    </section>
  )
}
