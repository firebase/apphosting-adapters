import OrderSummary from '@/components/sections/order-summary'
import { getOrderById } from '../../../../dataconnect-generated/js/default-connector'
import { dc } from '@/lib/data-connect'

export default async function OrderSummaryPage({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id
  const { data } = await getOrderById(dc, { id })

  return <OrderSummary order={data?.order} />
}
