'use client'

import { ReactNode, useCallback, useEffect, useState } from 'react'
import { clsx } from 'clsx'
import X from '../icons/x'

export default function AnnouncementBar({ children }: { children: ReactNode }) {
  const [banner, setBanner] = useState({ dismissed: true, initialized: false })

  useEffect(() => {
    const hidden = localStorage.getItem('hidden-banner') === 'true'
    setBanner({ dismissed: hidden, initialized: true })
  }, [])

  const hideBanner = useCallback(() => {
    setBanner({ dismissed: true, initialized: true })
    localStorage.setItem('hidden-banner', 'true')
  }, [])

  return (
    <div
      id="announcement-bar"
      className={clsx(
        'dark z-50 relative grid w-full overflow-hidden bg-background transition-all duration-300 ease-in-out',
        banner.dismissed ? 'pointer-events-none grid-rows-[0fr]' : 'grid-rows-[1fr]'
      )}
    >
      <div className="overflow-hidden">
        <p className="p-3 pr-12 text-foreground lg:px-12 lg:text-center [&_strong]:font-semibold">
          {children}
        </p>

        <button
          aria-label="Dismiss banner"
          onClick={(e) => {
            e.preventDefault()
            hideBanner()
          }}
          className="absolute right-2 top-2 grid h-8 w-8 place-content-center text-foreground hover:text-gray-400 z-10 transition-colors duration-300 lg:top-1/2 lg:-translate-y-1/2"
        >
          <X className="size-5" />
        </button>
      </div>
    </div>
  )
}
