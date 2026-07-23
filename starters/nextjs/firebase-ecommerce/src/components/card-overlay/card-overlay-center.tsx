'use client'

import { useEffect } from 'react'

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

export function CardOverlayCenter({ title, description, cta, image }: Props) {
  useEffect(() => {
    if (window.location.hash === '#about') {
      const descriptionElement = document.getElementById('card-overlay-description')
      if (descriptionElement) {
        descriptionElement.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }, [])

  return (
    <section className="container py-3 lg:py-10">
      <div className="max-w-screen-2xl mx-auto relative lg:h-svh flex flex-col justify-end gap-2.5 lg:max-h-[921px] lg:p-10 lg:rounded-4xl lg:overflow-hidden lg:relative">
        {image ? (
          <div className="lg:absolute lg:inset-0 lg:z-0 overflow-hidden w-full">
            <div className="relative h-full w-full hidden lg:block">
              <img
                src={image}
                alt={title}
                className="object-cover bg-gray-200 absolute w-full h-full inset-0"
              />
              <div className="blurred-edges [--blur:20px]" />
            </div>
          </div>
        ) : (
          <div className="hidden lg:block absolute inset-0 bg-gray-200" />
        )}
        <article className="flex flex-col gap-10 text-foreground bg-background px-6 py-8 min-h-80 lg:rounded-3xl max-lg:dark mx-auto w-full max-w-6xl rounded-2xl lg:flex-row lg:z-10">
          {title && (
            <h2 className="text-2xl lg:text-5xl mb-auto lg:w-4/5 max-w-md mr-auto">{title}</h2>
          )}
          <div className="space-y-10 max-w-lg lg:ml-auto">
            {description && (
              <p id="card-overlay-description" className="lg:text-lg leading-7">
                {description}
              </p>
            )}
            {cta && (
              <Button href={cta.href} variant="link">
                {cta.label}
                <Arrow className="size-3.5 group-hover:translate-x-1 transition-transform" />
              </Button>
            )}
          </div>
        </article>
        <div className="relative w-full lg:hidden aspect-[4/5] rounded-2xl overflow-hidden">
          {' '}
          {image ? (
            <div className="relative h-full w-full max-lg:rounded-xl">
              <img
                src={image}
                alt={title}
                className="object-cover bg-gray-200 absolute w-full h-full inset-0"
              />
              <div className="blurred-edges [--blur:20px]" />
            </div>
          ) : (
            <div className="h-full w-full bg-gray-200" />
          )}
        </div>
      </div>
    </section>
  )
}
