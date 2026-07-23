'use client'

import StripeCheckout from '@/components/sections/stripe-checkout'
import Button from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useCartStore } from '@/lib/stores/cart-store'
import { useShallow } from 'zustand/shallow'

export default function CheckoutPage() {
  const { user } = useAuth()

  const { products, totalQuantity } = useCartStore(
    useShallow((state) => ({ products: state.products, totalQuantity: state.totalQuantity }))
  )

  const isSignedIn = !!user?.uid
  const total = products.reduce((acc, item) => acc + item.price, 0)

  if (totalQuantity === 0) {
    return (
      <section className="text-foreground bg-background pt-10 pb-10 lg:pt-48 lg:pb-20 min-h-[75vh]">
        <div className="relative container flex flex-col items-center gap-10 max-w-[768px] mx-auto">
          <h1 className="text-3xl">Your cart is empty</h1>
          <Button href="/">Continue shopping</Button>
        </div>
      </section>
    )
  }

  if (!isSignedIn) {
    return (
      <section className="text-foreground bg-background pt-10 pb-10 lg:pt-48 lg:pb-20 min-h-[75vh]">
        <div className="relative container flex flex-col items-center gap-10 max-w-[768px] mx-auto">
          <h1 className="text-3xl">Please sign in to checkout</h1>
          <Button href="/sign-in">Sign in</Button>
        </div>
      </section>
    )
  }

  return (
    <section className="text-foreground bg-background pt-10 pb-10 lg:pt-48 lg:pb-20 min-h-[75vh]">
      <div className="relative container flex flex-col items-center gap-10 max-w-[768px] mx-auto">
        <h1 className="text-3xl">Checkout</h1>

        <div className="w-full space-y-5 rounded-2xl">
          <h2 className="text-xl font-medium mb-6">Order Summary</h2>

          {/* Product List */}
          <div className="space-y-4 mb-8">
            {products.map((item) => (
              <div
                key={`${item.productId}-${item.selectedOption}`}
                className="flex gap-4 items-center"
              >
                {item.image?.url ? (
                  <img
                    src={item.image.url}
                    alt={item.name}
                    width={64}
                    height={64}
                    className="rounded-lg object-cover bg-gray-200"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-200 rounded-lg" />
                )}
                <div className="flex-1">
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="text-sm text-gray-500">
                    {item.selectedOption.map((opt) => opt.value).join('/')}
                  </p>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">QTY</span> {item.quantity}
                </div>
                <div className="font-medium">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                  }).format(item.price)}
                </div>
              </div>
            ))}
          </div>

          {/* Order Totals */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span>
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(total)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Shipping</span>
              <span>Free</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tax</span>
              <span>
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(0)}
              </span>
            </div>
            <div className="flex justify-between text-xl pt-4 border-t">
              <span>Total</span>
              <span>
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(total)}
              </span>
            </div>
          </div>
        </div>

        <StripeCheckout amount={total} products={products} />
      </div>
    </section>
  )
}
