'use client'

import Link from 'next/link'
import Button from '@/components/ui/button'
import CartItem from './cart-item'
import { useRouter } from 'next/navigation'
import { clearCart } from '@/lib/actions/product'

type Props = {
  cartId?: string
  cart: Cart
  items: CartItem[]
}

export default function CartSection({ cartId, cart, items }: Props) {
  const { push } = useRouter()

  return (
    <section className="text-foreground bg-background pt-20 pb-10 lg:pt-48 lg:pb-20 min-h-[75vh]">
      <div className="relative container flex max-md:flex-col gap-20">
        <div className="w-full space-y-5">
          <h1 className="text-4xl pb-5">
            Your Cart <span className="text-gray-400">{cart.totalQuantity}</span>
          </h1>
          {items && items.map((item) => <CartItem key={item.id} product={item} cartId={cartId} />)}
        </div>

        <div className="md:sticky md:top-36 w-full md:max-w-md flex flex-col gap-10 h-fit">
          <h2 className="text-4xl">Summary</h2>

          <ul className="border-y divide-y">
            <li className="flex justify-between py-4">
              <span>Subtotal</span>
              <span>
                {cart.cost.subtotalAmount.amount} {cart.cost.subtotalAmount.currencyCode}
              </span>
            </li>
            <li className="flex justify-between py-4">
              <span>Shipping</span>
              <Button variant="link" className="h-6">
                Add Address
              </Button>
            </li>
            <li className="flex justify-between py-4">
              <span>Tax</span>
              <span>
                {cart.cost.totalTaxAmount.amount} {cart.cost.totalTaxAmount.currencyCode}
              </span>
            </li>
          </ul>

          <div className="flex flex-wrap justify-between text-2xl">
            <span>Grand Total</span>
            <span>
              {cart.cost.totalAmount.amount} {cart.cost.totalAmount.currencyCode}
            </span>
          </div>

          {cart.checkoutUrl && items.length > 0 ? (
            <Link href={cart.checkoutUrl} target="_blank" rel="noreferrer">
              <Button
                className="w-full"
                onClick={() => {
                  clearCart()
                  push('/orders')
                }}
              >
                Checkout
              </Button>
            </Link>
          ) : (
            <Button className="w-full" disabled>
              Checkout
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}
