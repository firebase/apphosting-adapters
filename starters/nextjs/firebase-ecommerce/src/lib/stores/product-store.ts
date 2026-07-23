import { create } from 'zustand'

type ProductState = {
  [key: string]: string
} & {
  image?: string
}

type ProductStore = {
  state: ProductState
  updateOption: (name: string, value: string) => ProductState
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
  }
}))
