'use client'

import Button from '@/components/ui/button'
import CartItem from './cart-item'
import { useCartStore } from '@/lib/stores/cart-store'
import { useShallow } from 'zustand/shallow'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

export default function CartSection() {
  const { products, totalQuantity } = useCartStore(
    useShallow((state) => ({ products: state.products, totalQuantity: state.totalQuantity }))
  )
  const { user } = useAuth()
  const isSignedIn = !!user?.uid

  const [shippingInfo, setShippingInfo] = useState({
    name: '',
    email: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zipCode: ''
  })

  useEffect(() => {
    if (isSignedIn && user.displayName) {
      setShippingInfo({
        name: user?.displayName ?? '',
        email: user?.email ?? '',
        address1: '',
        address2: '',
        city: '',
        state: '',
        zipCode: ''
      })
    }
  }, [isSignedIn, user?.displayName, user?.email])

  const total = products.reduce((acc, item) => acc + item.price, 0)
  const isCheckoutDisabled =
    totalQuantity === 0 ||
    !shippingInfo.name ||
    !shippingInfo.email ||
    !shippingInfo.address1 ||
    !shippingInfo.city ||
    !shippingInfo.state ||
    !shippingInfo.zipCode

  if (totalQuantity === 0) {
    return (
      <section className="flex flex-col gap-8 items-center justify-center h-[75vh]">
        <h1 className="text-2xl">Your cart is empty</h1>
        <Button href="/">Continue shopping</Button>
      </section>
    )
  }

  return (
    <section className="text-foreground bg-background pt-20 pb-10 lg:pt-48 lg:pb-20 min-h-[75vh]">
      <div className="relative container flex max-md:flex-col gap-20">
        <div className="w-full space-y-5 md:sticky md:top-24 md:h-[calc(100vh-80px)] md:overflow-y-auto">
          <h1 className="text-4xl pb-5 bg-background sticky top-0 z-10">
            Your Cart <span className="text-gray-400">{totalQuantity}</span>
          </h1>
          {products &&
            products.map((item) => (
              <CartItem key={`${item.productId}-${item.selectedOption}`} product={item} />
            ))}
        </div>

        <div className="md:sticky md:top-20 w-full md:max-w-md flex flex-col gap-10 h-fit">
          <h2 className="text-4xl">Summary</h2>

          <ul className="border-y divide-y">
            <li className="flex justify-between py-4">
              <span>Subtotal</span>
              <span>
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(products.reduce((acc, item) => acc + item.price, 0))}
              </span>
            </li>
            <li className="flex justify-between py-4">
              <span>Shipping</span>
              <span>Free</span>
            </li>
            <li className="flex justify-between py-4">
              <span>Tax</span>
              <span>
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(0)}
              </span>
            </li>
          </ul>

          <div className="flex flex-wrap justify-between text-2xl">
            <span>Grand Total</span>
            <span>
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
              }).format(total)}
            </span>
          </div>

          {isSignedIn ? (
            <>
              <div className="py-10 space-y-6 border-y border-gray-200">
                <h2 className="text-2xl">Shipping Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={shippingInfo.name}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, name: e.target.value })}
                    className="px-4 py-2 rounded-full bg-gray-200 border-2 border-gray-200 hover:border-gray-300 focus:border-foreground transition-colors outline-none md:col-span-2"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={shippingInfo.email}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, email: e.target.value })}
                    className="px-4 py-2 rounded-full bg-gray-200 border-2 border-gray-200 hover:border-gray-300 focus:border-foreground transition-colors outline-none md:col-span-2"
                  />
                  <input
                    type="text"
                    placeholder="Address Line 1"
                    value={shippingInfo.address1}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, address1: e.target.value })}
                    className="px-4 py-2 rounded-full bg-gray-200 border-2 border-gray-200 hover:border-gray-300 focus:border-foreground transition-colors outline-none md:col-span-2"
                  />
                  <input
                    type="text"
                    placeholder="Address Line 2"
                    value={shippingInfo.address2}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, address2: e.target.value })}
                    className="px-4 py-2 rounded-full bg-gray-200 border-2 border-gray-200 hover:border-gray-300 focus:border-foreground transition-colors outline-none md:col-span-2"
                  />
                  <input
                    type="text"
                    placeholder="City"
                    value={shippingInfo.city}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                    className="px-4 py-2 rounded-full bg-gray-200 border-2 border-gray-200 hover:border-gray-300 focus:border-foreground transition-colors outline-none md:col-span-2"
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={shippingInfo.state}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, state: e.target.value })}
                    className="px-4 py-2 rounded-full bg-gray-200 border-2 border-gray-200 hover:border-gray-300 focus:border-foreground transition-colors outline-none"
                  />
                  <input
                    type="text"
                    placeholder="ZIP Code"
                    value={shippingInfo.zipCode}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, zipCode: e.target.value })}
                    className="px-4 py-2 rounded-full bg-gray-200 border-2 border-gray-200 hover:border-gray-300 focus:border-foreground transition-colors outline-none"
                  />
                </div>
              </div>
              {isCheckoutDisabled ? (
                <Button variant="primary" className="w-full" disabled>
                  Checkout
                </Button>
              ) : (
                <Button href="/checkout" variant="primary" className="w-full">
                  Checkout
                </Button>
              )}
            </>
          ) : (
            <div className="py-10 space-y-6 text-center">
              <p className="text-lg">Sign in to complete your purchase</p>
              <Button href="/auth" className="w-full">
                Sign In
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
