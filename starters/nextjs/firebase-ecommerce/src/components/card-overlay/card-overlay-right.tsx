import Button from '../ui/button'
import Arrow from '../icons/arrow'

type Props = {
  title: string
  description?: string
  cta?: {
    label: string
    href: string
  }
  image: string
  align?: 'center' | 'right'
}
export function CardOverlayRight({ title, description, cta, image }: Props) {
  return (
    <section className="container">
      <div className="max-w-screen-2xl mx-auto relative lg:h-svh flex flex-col justify-end gap-2.5 lg:max-h-[921px] lg:p-10 items-end rounded-2xl lg:rounded-4xl p-6 overflow-hidden">
        {image ? (
          <div className="absolute inset-0 overflow-hidden rounded-3xl lg:rounded-4xl">
            <div className="relative h-full w-full">
              <img
                src={image}
                alt={title}
                sizes="(max-width: 768px) 100vw, 1552px"
                className="object-cover bg-gray-200 absolute w-full h-full inset-0"
              />
              <div className="blurred-edges [--blur:20px]" />
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 bg-gray-200" />
        )}
        <article className="flex flex-col gap-10 text-foreground bg-background px-6 py-8 min-h-80 lg:rounded-3xl max-w-64 lg:max-w-xl rounded-lg lg:h-full z-10">
          {title && (
            <h2 className="text-2xl lg:text-5xl mb-auto lg:w-4/5 max-w-md mr-auto">{title}</h2>
          )}
          <div className="space-y-10 max-w-lg lg:ml-auto">
            {description && <p className="lg:text-lg leading-7">{description}</p>}
            {cta && (
              <Button href={cta.href} variant="link">
                {cta.label}
                <Arrow className="size-3.5 group-hover:translate-x-1 transition-transform" />
              </Button>
            )}
          </div>
        </article>
      </div>
    </section>
  )
}
