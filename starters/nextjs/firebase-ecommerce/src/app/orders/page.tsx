import OrderHistory from '@/components/sections/order-history'
import { getOrdersByCustomerId } from '@firebasegen/default-connector'
import { dc } from '@/lib/data-connect'
import { cookies } from 'next/headers'

export default async function OrdersPage() {
  const cookieStore = await cookies()
  const customerId = cookieStore.get('customerId')?.value ?? ''
  const { data } = await getOrdersByCustomerId(dc, { customerId })

  return (
    <section className="text-foreground bg-background">
      <div className="container pt-20 pb-10 lg:pt-48 lg:pb-20 space-y-10">
        <OrderHistory orders={data.orders} />
      </div>
    </section>
  )
}
