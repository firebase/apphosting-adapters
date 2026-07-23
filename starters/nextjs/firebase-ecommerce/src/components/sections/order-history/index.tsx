'use client'

import { useAuth } from '@/hooks/useAuth'
import OrderListItem from './order-list-item'
import { GetOrdersByCustomerIdData } from '@firebasegen/default-connector'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { useCartStore } from '@/lib/stores/cart-store'
import { useShallow } from 'zustand/shallow'

type Props = {
  orders: GetOrdersByCustomerIdData['orders']
}

export default function OrderHistory({ orders }: Props) {
  const searchParams = useSearchParams()
  const success = searchParams.get('success')
  const { refresh } = useRouter()
  const { clearCart } = useCartStore(useShallow((state) => ({ clearCart: state.clearCart })))

  useEffect(() => {
    if (success) {
      clearCart()
      setTimeout(() => {
        refresh()
      }, 1500)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { user: customer } = useAuth()

  if (!orders || orders?.length === 0) {
    return (
      <h1 className="text-4xl">
        Hello, {customer?.displayName ?? customer?.email}
        <br />
        Total Orders: <span className="text-gray-400">{orders?.length}</span>
      </h1>
    )
  }

  return (
    <>
      <h1 className="text-4xl">
        Hello, {customer?.displayName ?? customer?.email}!
        <br />
        Total Orders: <span className="text-gray-400">{orders?.length}</span>
      </h1>
      <div className="w-full">
        <div className="max-lg:hidden text-gray-500 flex gap-10">
          <div className="ml-20 w-full">Items</div>
          <div className="w-full">Date</div>
          <div className="w-full text-right">Items</div>
          <div className="w-full text-right">Total</div>
          <div className="w-32 shrink-0" />
        </div>
        {orders.map((order) => (
          <OrderListItem key={order.id} order={order} />
        ))}
      </div>
    </>
  )
}
