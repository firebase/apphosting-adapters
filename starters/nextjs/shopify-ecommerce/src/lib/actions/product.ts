'use server'

import { createCart, addToCart, removeFromCart, updateCart } from '@/lib/shopify'
import { revalidateTag } from 'next/cache'
import { cookies } from 'next/headers'
import { dc } from '@/lib/data-connect'
import { createReview } from '@dataconnect/ecommerce-template'

type Error = {
  message: string
}

export const handleAddToCart = async ({
  currentVariant,
  cartId
}: {
  currentVariant: ProductVariant
  cartId?: string
}): Promise<string | Error> => {
  try {
    const cookieStore = await cookies()
    const customerAccessToken = cookieStore.get('__session')?.value
    const cartID = cartId?.length ? cartId : cookieStore.get('cartId')?.value
    const cart = cartID?.length ? cartID : (await createCart(customerAccessToken)).id

    if (!cart) {
      return { message: 'No cart ID found' }
    }

    await addToCart(cart, [
      {
        merchandiseId: currentVariant.id,
        quantity: 1
      }
    ])

    // Reset cart cache
    revalidateTag('cart')

    return cart
  } catch (error) {
    return { message: `Error adding to cart: ${error}` }
  }
}

export const handleRemoveFromCart = async ({
  cartId,
  lineId
}: {
  cartId?: string
  lineId: string
}) => {
  if (!cartId) {
    return
  }

  await removeFromCart(cartId, [lineId])
  // Reset cart cache
  revalidateTag('cart')
}

export const handleUpdateCart = async ({
  cartId,
  lines
}: {
  cartId?: string
  lines: { id: string; merchandiseId: string; quantity: number }[]
}) => {
  if (!cartId) {
    return
  }

  await updateCart(cartId, lines)
  // Reset cart cache
  revalidateTag('cart')
}

export type CreateReviewPayload = {
  productID: string
  productSlug: string
  productName: string
  userID: string
  userName: string
  rating: number
  content: string
}

export const handleCreateReview = async (payload: CreateReviewPayload) => {
  await createReview(dc, payload)
  // Reset reviews cache
  revalidateTag('reviews')
}

export const clearCart = async () => {
  const cookieStore = await cookies()
  cookieStore.delete('cartId')
  // Reset cart cache
  revalidateTag('cart')

  // Create a new cart
  const customerAccessToken = cookieStore.get('__session')?.value
  await createCart(customerAccessToken)
}
