import Link from 'next/link'
import ShoppingBag from '../../icons/shopping-bag'
import { useCartStore } from '@/lib/stores/cart-store'
import { useShallow } from 'zustand/shallow'

export default function CartIcon() {
  const { totalQuantity } = useCartStore(
    useShallow((state) => ({ totalQuantity: state.totalQuantity }))
  )

  return (
    <Link
      href="/cart"
      aria-label="Cart"
      className="relative inline-flex p-1 lg:p-1.5 rounded-full lg:bg-gray-100 lg:hover:bg-gray-200 transition-colors"
    >
      <ShoppingBag className="size-5" />
      {totalQuantity > 0 ? (
        <span className="dark absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 flex items-center justify-center rounded-full text-foreground bg-background text-xs px-1 min-w-4 h-4">
          {totalQuantity}
        </span>
      ) : null}
    </Link>
  )
}
