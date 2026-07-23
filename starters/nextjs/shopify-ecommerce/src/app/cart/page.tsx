import CartSection from '@/components/sections/cart-section'
import Button from '@/components/ui/button'
import { getCart } from '@/lib/shopify'
import { cookies } from 'next/headers'

export default async function CartPage() {
  const cartId = (await cookies()).get('cartId')?.value
  const cart = await getCart(cartId)

  if (cart?.lines.length === 0 || !cart?.id) {
    return (
      <section className="flex flex-col gap-8 items-center justify-center h-[75vh]">
        <h1 className="text-2xl">Your cart is empty</h1>
        <Button href="/">Continue shopping</Button>
      </section>
    )
  }

  return <CartSection cart={cart} items={cart.lines} cartId={cartId} />
}
