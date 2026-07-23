'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useEffect, useRef, useState } from 'react'
import FirebaseIcon from '../../icons/firebase'
import User from '../../icons/user'
import HamburgerButton from './hamburger-button'
import CartIcon from './cart-icon'
import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  MenuItem
} from '@headlessui/react'
import Search from '@/components/icons/search'
import clsx from 'clsx'
import DropdownMenu from '@/components/ui/dropdown-menu'
import { handleSearch, SearchResult } from '@/lib/actions/search'
import { useAuth } from '@/hooks/useAuth'
import { auth } from '@/lib/firebase'
import { signOut } from 'firebase/auth'

type Props = {
  navigation: { label: string; href: string }[]
}

export default function Header({ navigation }: Props) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const { push } = useRouter()
  const [query, setQuery] = useState('')
  const { user } = useAuth()
  const isLoggedIn = !!user?.uid
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult>([])

  const pathname = usePathname()
  useEffect(() => {
    setMobileNavOpen(false)
  }, [pathname])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 300)

    return () => {
      clearTimeout(timer)
    }
  }, [query])

  useEffect(() => {
    const performSearch = async () => {
      if (debouncedQuery.length < 3) {
        return setSearchResults([])
      }
      setLoading(true)
      try {
        const results = await handleSearch({ query: debouncedQuery })
        if ('message' in results) {
          return setSearchResults([])
        }
        setSearchResults(results)
      } finally {
        setLoading(false)
      }
    }

    performSearch()
  }, [debouncedQuery])

  useEffect(() => {
    if (mobileNavOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileNavOpen])

  return (
    <header className="sticky top-0 z-40 text-foreground bg-background border-b">
      <div className="container relative">
        <div className="max-w-screen-2xl mx-auto flex gap-10 items-center h-[60px]">
          <HamburgerButton isOpen={mobileNavOpen} setIsOpen={setMobileNavOpen} />

          <Link
            href="/"
            onClick={() => setMobileNavOpen(false)}
            className="flex items-center gap-1 max-lg:absolute max-lg:top-1/2 max-lg:left-1/2 max-lg:-translate-x-1/2 max-lg:-translate-y-1/2 z-50"
          >
            <FirebaseIcon className="size-8 shrink-0" />
            <span className="text-2xl font-bold whitespace-nowrap mt-1">Gem</span>
          </Link>

          <nav
            className={cn(
              'w-full max-lg:mobile-nav-menu lg:grid lg:grid-cols-2 lg:gap-10 lg:items-center lg:mx-auto',
              mobileNavOpen
                ? 'opacity-100 translate-y-0'
                : 'max-lg:opacity-0 max-lg:translate-y-4 max-lg:pointer-events-none'
            )}
          >
            <div className="max-lg:mb-5 w-full lg:max-w-96 lg:ml-auto">
              <Combobox
                value={query}
                onChange={(value) => {
                  const result = searchResults.find((r) => r.title === value)
                  if (result?.handle) {
                    push(`/product/${result.handle}`)
                    setQuery('')
                    setSearchResults([])
                    setMobileNavOpen(false)
                    searchInputRef.current?.blur()
                  }
                }}
              >
                <div className="w-full lg:max-w-md relative">
                  <div className="relative flex items-center">
                    <Search className="absolute left-4 size-4 text-gray-400 pointer-events-none" />
                    <ComboboxInput
                      ref={searchInputRef}
                      className="text-[16px] w-full pl-10 pr-4 py-2 rounded-full bg-gray-200 border-2 border-gray-200 hover:border-gray-300 focus:border-foreground transition-colors outline-none"
                      placeholder="Search products"
                      autoComplete="off"
                      onChange={(e) => {
                        setQuery(e.target.value)
                      }}
                    />
                  </div>
                  <ComboboxOptions
                    className={clsx(
                      'absolute mt-2 w-full bg-white rounded-3xl border border-gray-300 p-2 max-h-60 overflow-y-auto',
                      searchResults.length > 0 || loading ? 'visible' : 'invisible'
                    )}
                  >
                    {loading ? (
                      <div className="space-y-1.5 p-1">
                        {Array.from({ length: 4 }).map((_, index) => (
                          <div key={index} className="h-8 bg-gray-200 rounded-full animate-pulse" />
                        ))}
                      </div>
                    ) : (
                      searchResults.map((result) => (
                        <ComboboxOption key={result.id} value={result.title}>
                          <div className="font-medium px-4 py-2 cursor-pointer hover:bg-gray-200 transition-colors rounded-full">
                            {result.title}
                          </div>
                        </ComboboxOption>
                      ))
                    )}
                  </ComboboxOptions>
                </div>
              </Combobox>
            </div>

            <ul className="flex max-lg:flex-col gap-3 lg:gap-1">
              {navigation.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="max-lg:block max-lg:w-full max-lg:text-lg lg:px-3 py-1.5 rounded-full lg:bg-gray-200 lg:hover:bg-gray-300 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex gap-2 items-center max-lg:ml-auto z-50">
            {isLoggedIn ? (
              <DropdownMenu icon={<User className="size-5" />}>
                <MenuItem>
                  <Link
                    href="/orders"
                    className="flex w-full items-center rounded-full px-4 py-2 font-medium hover:bg-gray-200 transition-colors"
                  >
                    Orders
                  </Link>
                </MenuItem>
                <MenuItem>
                  <button
                    onClick={() => {
                      signOut(auth)
                      push('/auth')
                    }}
                    className="flex w-full items-center rounded-full px-4 py-2 font-medium hover:bg-gray-200 transition-colors"
                  >
                    Sign out
                  </button>
                </MenuItem>
              </DropdownMenu>
            ) : (
              <Link
                href="/auth"
                aria-label="Sign in"
                className="p-1 lg:p-1.5 rounded-full lg:bg-gray-100 lg:hover:bg-gray-200 transition-colors"
              >
                <User className="size-5" />
              </Link>
            )}
            <CartIcon />
          </div>
        </div>
      </div>
    </header>
  )
}
