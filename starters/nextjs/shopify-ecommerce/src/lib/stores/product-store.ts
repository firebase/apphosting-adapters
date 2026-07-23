import { create } from 'zustand'
import { useRouter } from 'next/navigation'

type ProductState = {
  [key: string]: string
} & {
  image?: string
}

type ProductStore = {
  state: ProductState
  updateOption: (name: string, value: string) => ProductState
  updateImage: (index: string) => ProductState
  initializeFromURL: () => void
}

export const useProductStore = create<ProductStore>((set, get) => ({
  state: {},

  updateOption: (name: string, value: string) => {
    const newState = {
      ...get().state,
      [name]: value
    }
    set({ state: newState })
    return newState
  },

  updateImage: (index: string) => {
    const newState = {
      ...get().state,
      image: index
    }
    set({ state: newState })
    return newState
  },

  initializeFromURL: () => {
    const searchParams = new URLSearchParams(window.location.search)
    const params: ProductState = {}

    for (const [key, value] of searchParams.entries()) {
      params[key] = value
    }

    set({ state: params })
  }
}))

// Custom hook to handle URL updates
export function useUpdateURL() {
  const router = useRouter()

  return (state: ProductState) => {
    const newParams = new URLSearchParams(window.location.search)
    Object.entries(state).forEach(([key, value]) => {
      newParams.set(key, value)
    })
    router.push(`?${newParams.toString()}`, { scroll: false })
  }
}
