import Link from 'next/link'

import { cn } from '@/lib/utils'
import Button from './button'
import Arrow from '../icons/arrow'

type Props = {
  name: string
  price: string
  image?: {
    url: string
    width: number
    height: number
    altText?: string | null
  }
  slug: string
  tags: string
  index: number
  variant?: 'character' | 'simple'
}

export default function ProductGridItem({
  name,
  price,
  image,
  slug,
  tags = 'Red',
  index,
  variant = 'character'
}: Props) {
  return (
    <Link
      href={`/product/${slug}`}
      className={cn(
        'group relative overflow-hidden flex items-center justify-center gap-2 aspect-square rounded-4xl p-16 max-lg:odd:rounded-full',
        { 'lg:rounded-full': variant === 'simple' && [0, 3, 4, 7].includes(index % 8) }
      )}
    >
      {image ? (
        <>
          <img
            src={image.url}
            alt={`${name} product image`}
            sizes="(max-width: 768px) 100vw, 467px"
            className="absolute inset-0 object-cover aspect-square group-hover:brightness-95 transition-all select-none w-full h-full"
          />
          <div className="blurred-edges [--blur:10px]" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gray-200" />
      )}
      <div className="blurred-edges [--blur:15px]" />
      <article className="flex flex-wrap items-center justify-between gap-x-6 px-6 py-3 bg-background rounded-full min-h-12 lg:w-full max-w-md z-10">
        {name ? <h3 className="line-clamp-1">{name}</h3> : null}
        {tags ? <p className="max-lg:hidden text-gray-500">{tags}</p> : null}
        {price ? <span className="max-lg:hidden">{price}</span> : null}
      </article>
      <Button aria-label="View product" className="h-12 z-10">
        <Arrow className="size-3.5" />
      </Button>
    </Link>
  )
}
