'use client'

import { Product, useCartStore } from '@/lib/stores/cart-store'
import Minus from '../icons/minus'
import Plus from '../icons/plus'
import { useShallow } from 'zustand/shallow'

type Props = {
  item: { productId: string; quantity: number; selectedOption: Product['selectedOption'] }
}

export default function Stepper({ item }: Props) {
  const { updateQuantity } = useCartStore(
    useShallow((state) => ({
      updateQuantity: state.updateQuantity
    }))
  )

  return (
    <div className="flex justify-between items-center min-w-32 border rounded-full">
      <button
        type="button"
        onClick={() => {
          updateQuantity({
            productId: item.productId,
            quantity: item.quantity - 1,
            selectedOption: item.selectedOption
          })
        }}
        disabled={item.quantity === 0}
        aria-label="Decrease count"
        className="p-3 transition-opacity disabled:opacity-20"
      >
        <Minus className="size-5" />
      </button>
      <div className="font-medium text-center tabular-nums">{item.quantity}</div>
      <button
        type="button"
        onClick={() => {
          updateQuantity({
            productId: item.productId,
            quantity: item.quantity + 1,
            selectedOption: item.selectedOption
          })
        }}
        aria-label="Increase count"
        className="p-3"
      >
        <Plus className="size-5" />
      </button>
    </div>
  )
}
