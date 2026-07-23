'use client'

import { useEffect } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  children: React.ReactNode
}

export default function Sheet({ open, setOpen, children }: Props) {
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [open, setOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [setOpen])

  return (
    <>
      <aside
        className={cn(
          'z-50 h-dvh w-full lg:max-w-xl space-y-6 lg:space-y-12 fixed top-0 right-0 bg-background transition-transform duration-700 ease-m-ease p-3 pb-10 lg:p-20 lg:rounded-l-2xl overflow-hidden',
          open ? 'translate-x-0 pointer-events-auto' : 'translate-x-[110%] pointer-events-none'
        )}
        tabIndex={open ? undefined : -1}
      >
        {children}
      </aside>
      <div
        role="button"
        aria-label="Background overlay"
        onClick={() => setOpen(false)}
        className={cn(
          'max-lg:hidden z-40 cursor-default absolute inset-0 bg-black/50 transition-opacity duration-700 ease-m-ease',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      />
    </>
  )
}
