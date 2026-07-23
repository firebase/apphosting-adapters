import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type Product = {
  productId: string
  quantity: number
  price: number
  name: string
  image?: {
    url: string
    altText?: string | null
    height?: number | null
    width?: number | null
  }
  selectedOption: {
    name: string
    value: string
  }[]
}

type CartStore = {
  products: Product[]
  totalQuantity: number
  addProduct: (product: Product) => void
  removeProduct: ({
    productId,
    selectedOption
  }: {
    productId: string
    selectedOption: Product['selectedOption']
  }) => void
  updateQuantity: ({
    productId,
    quantity,
    selectedOption
  }: {
    productId: string
    quantity: number
    selectedOption: Product['selectedOption']
  }) => void
  clearCart: () => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      products: [],

      totalQuantity: get()?.products?.reduce((acc, product) => acc + product.quantity, 0) ?? 0,

      addProduct: (product: Product) => {
        const existingProductIndex = get().products.findIndex(
          (p) =>
            p.productId === product.productId &&
            p.selectedOption.length === product.selectedOption.length &&
            p.selectedOption.every(
              (option, index) =>
                option.name === product.selectedOption[index].name &&
                option.value === product.selectedOption[index].value
            )
        )

        if (existingProductIndex !== -1) {
          // Product with same variant exists, update quantity
          const updatedProducts = [...get().products]
          updatedProducts[existingProductIndex].quantity += product.quantity
          updatedProducts[existingProductIndex].price += product.price

          set({
            totalQuantity: get().totalQuantity + product.quantity,
            products: updatedProducts
          })
          return
        }

        // New product or different variant, add to cart
        set({
          totalQuantity: get().totalQuantity + product.quantity,
          products: [...get().products, product]
        })
      },

      removeProduct: ({
        productId,
        selectedOption
      }: {
        productId: string
        selectedOption: Product['selectedOption']
      }) => {
        set({ totalQuantity: get().totalQuantity - 1 })
        set({
          products: get().products.filter(
            (p) =>
              p.productId !== productId ||
              !p.selectedOption.every(
                (option, index) =>
                  option.name === selectedOption[index].name &&
                  option.value === selectedOption[index].value
              )
          )
        })
      },

      updateQuantity: ({
        productId,
        quantity,
        selectedOption
      }: {
        productId: string
        quantity: number
        selectedOption: Product['selectedOption']
      }) => {
        const existingProductIndex = get().products.findIndex(
          (p) =>
            p.productId === productId &&
            p.selectedOption.length === selectedOption.length &&
            p.selectedOption.every(
              (option, index) =>
                option.name === selectedOption[index].name &&
                option.value === selectedOption[index].value
            )
        )

        if (existingProductIndex !== -1) {
          const updatedProducts = [...get().products]
          const oldQuantity = updatedProducts[existingProductIndex].quantity
          const pricePerUnit = updatedProducts[existingProductIndex].price / oldQuantity

          updatedProducts[existingProductIndex].quantity = quantity
          updatedProducts[existingProductIndex].price = pricePerUnit * quantity

          set({
            products: updatedProducts,
            totalQuantity: get().totalQuantity - oldQuantity + quantity
          })
        }
      },

      clearCart: () => {
        set({ products: [], totalQuantity: 0 })
      }
    }),
    {
      name: 'cart',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
