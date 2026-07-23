import Link from 'next/link'

type Props = {
  name: string
  price: string
  image: Image
  slug: string
  title: string
  className?: string
  tags?: string
}

export default function ProductCard({ className, name, price, image, slug, title, tags }: Props) {
  return (
    <Link
      href={`/product/${slug}`}
      className={`group relative flex flex-col gap-4 items-center justify-center w-full ${className}`}
    >
      <div className="relative aspect-square rounded-3xl lg:rounded-4xl w-full max-lg:min-w-[calc(50vw-15.25px)] overflow-hidden">
        {image ? (
          <>
            <img
              src={image.url}
              alt={name}
              sizes="(max-width: 768px) 100vw, 710px"
              className="object-cover bg-gray-200 group-hover:brightness-95 transition-all select-none absolute inset-0"
            />
            <div className="blurred-edges [--blur:10px]" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gray-200" />
        )}
      </div>
      <article className="max-md:text-xs flex flex-wrap items-center justify-between gap-x-6 px-3 lg:px-6 w-full mb-auto">
        <h3 className="line-clamp-1">{title}</h3>
        {tags ? <p className="max-lg:hidden text-gray-500">{tags}</p> : null}
        {price ? <span>{price}</span> : null}
      </article>
    </Link>
  )
}
