'use client'

import { cn } from '@/lib/utils'
import { useState } from 'react'

export type Accordion = {
  label: string
  children: React.ReactNode
  open?: boolean
}

const Chevron = function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 10 10"
      width="20"
      className="mt-1 shrink-0 text-gray-500 [&>line]:origin-center [&>line]:transition [&>line]:duration-300 [&>line]:ease-out"
    >
      <line
        x1="2"
        y1="2"
        x2="5"
        y2="5"
        className={cn({ '-translate-y-[3px] -rotate-90': open })}
        stroke="currentColor"
        strokeLinecap="round"
      />
      <line
        x1="8"
        y1="2"
        x2="5"
        y2="5"
        className={cn({ '-translate-y-[3px] rotate-90': open })}
        stroke="currentColor"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function Accordion({ label, children, open = false }: Accordion) {
  const [expanded, setExpanded] = useState(open)

  return (
    <div key={label}>
      <button
        type="button"
        className="w-full text-sm flex items-center justify-between cursor-pointer py-3"
        onClick={() => setExpanded(!expanded)}
      >
        {label}
        <Chevron open={expanded} />
      </button>
      <div
        className={cn(
          "grid [&>*]:overflow-hidden transition-all duration-500 ease-m-ease text-xl lg:text-2xl [&_li]:before:content-['•_']",
          expanded ? 'grid-rows-[1fr] opacity-100 my-3' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        {children}
      </div>
    </div>
  )
}
