'use client'

import { handleUpdateCart } from '@/lib/actions/product'
import Minus from '../icons/minus'
import Plus from '../icons/plus'

type Props = {
  cartId?: string
  lines: { id: string; merchandiseId: string; quantity: number }
}

export default function Stepper({ cartId, lines }: Props) {
  return (
    <div className="flex justify-between items-center min-w-32 border rounded-full">
      <button
        type="button"
        onClick={() => {
          handleUpdateCart({ cartId, lines: [{ ...lines, quantity: lines.quantity - 1 }] })
        }}
        disabled={lines.quantity === 0}
        aria-label="Decrease count"
        className="p-3 transition-opacity disabled:opacity-20"
      >
        <Minus className="size-5" />
      </button>
      <div className="font-medium text-center tabular-nums">{lines.quantity}</div>
      <button
        type="button"
        onClick={() => {
          handleUpdateCart({ cartId, lines: [{ ...lines, quantity: lines.quantity + 1 }] })
        }}
        aria-label="Increase count"
        className="p-3"
      >
        <Plus className="size-5" />
      </button>
    </div>
  )
}
