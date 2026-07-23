import { getCart } from '@/lib/shopify'
import { cookies } from 'next/headers'
import Header from './header'

const navigation = [
  { label: 'New', href: '/category/winter-essentials' },
  { label: 'Men', href: '/category/winter-essentials' },
  { label: 'Women', href: '/category/winter-essentials' },
  { label: 'Sale', href: '/category/winter-essentials' }
]

export default async function HeaderContainer() {
  const cookieStore = await cookies()
  const cartId = cookieStore.get('cartId')?.value
  const customerAccessToken = cookieStore.get('__session')?.value
  const cart = await getCart(cartId)

  return <Header cart={cart} navigation={navigation} customerAccessToken={customerAccessToken} />
}
