'use client'

import React from 'react'
import Button from './button'
import useEmblaCarousel from 'embla-carousel-react'
import { useEffect, useCallback, useState } from 'react'
import ArrowThin from '../icons/arrow-thin'

export type Carousel = {
  title?: string
  cta?: {
    label: string
    href: string
  }
  children: React.ReactNode
}

export default function Carousel({ title, cta, children }: Carousel) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })
  const [progress, setProgress] = useState(0)
  const [scrollbarPosition, setScrollbarPosition] = useState({ left: 0 })
  const [canScroll, setCanScroll] = useState(false)
  const count = React.Children.count(children)

  const previous = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const next = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  useEffect(() => {
    if (!emblaApi || count === 0) return

    emblaApi.reInit()
    const updateProgress = () => {
      const scrollProgress = emblaApi.scrollProgress()
      setProgress(scrollProgress * 100)
      setScrollbarPosition({ left: Math.min(scrollProgress * 100, 100 - 100 / count) })
    }

    setCanScroll(emblaApi.canScrollNext() || emblaApi.canScrollPrev())
    emblaApi.on('scroll', updateProgress)
    emblaApi.on('reInit', () => {
      setCanScroll(emblaApi.canScrollNext() || emblaApi.canScrollPrev())
    })
    updateProgress()
  }, [emblaApi, count])

  if (count === 0) return null

  return (
    <>
      <div className="flex max-lg:flex-col gap-10 lg:gap-20">
        {title ? (
          <div className="w-full lg:w-fit px-3 flex lg:flex-col justify-between max-lg:items-end gap-6 lg:max-w-1/2">
            <h2 className="text-2xl lg:text-6xl">{title}</h2>
            {cta && (
              <Button href={cta.href} variant="link" className="font-normal">
                {cta.label}
              </Button>
            )}
          </div>
        ) : null}

        <div ref={emblaRef} className="overflow-hidden lg:rounded-3xl">
          <div className="flex">{children}</div>
        </div>
      </div>

      {canScroll && (
        <div className="flex justify-between items-center max-lg:px-3">
          <div className="relative flex h-1 w-full max-w-56 items-center overflow-hidden rounded-full bg-gray-300">
            <input
              aria-label="Carousel progress"
              type="range"
              min={0}
              max={100}
              value={progress}
              onChange={(e) => setProgress(e.currentTarget.valueAsNumber)}
              className="absolute h-full w-full appearance-none opacity-0"
            />
            <div
              className="pointer-events-none absolute h-1 rounded-full bg-foreground transition-all ease-out"
              style={{ width: `${100 / count}%`, left: `${scrollbarPosition.left}%` }}
            />
          </div>
          <div className="flex gap-1.5 items-center">
            <Button onClick={previous} aria-label="Previous category" variant="link">
              <ArrowThin className="size-6 rotate-180" />
            </Button>
            <Button onClick={next} aria-label="Next category" variant="link">
              <ArrowThin className="size-6" />
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
