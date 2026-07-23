import OrderSummary from '@/components/sections/order-summary'
import { getCustomer } from '@/lib/shopify'
import { cookies } from 'next/headers'

export default async function OrderSummaryPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies()
  const id = (await params).id
  const customerAccessToken = cookieStore.get('__session')?.value
  const customer = await getCustomer(customerAccessToken)

  const order = customer?.orders?.find((order) => order.orderNumber.toString() === id)

  return <OrderSummary order={order} customer={customer} />
}
