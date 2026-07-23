import OrderListItem from './order-list-item'

export default function OrderHistory({ orders }: { orders?: Order[] }) {
  if (!orders || orders.length === 0) {
    return <p className="text-gray-500">No orders found</p>
  }

  const sortedOrders = [...orders].sort((a, b) => {
    return new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime()
  })

  return (
    <div className="w-full">
      <div className="max-lg:hidden text-gray-500 flex gap-10">
        <div className="ml-20 w-full">Order Number</div>
        <div className="w-full">Date</div>
        <div className="w-full text-right">Items</div>
        <div className="w-full text-right">Total</div>
        <div className="w-32 shrink-0" />
      </div>
      {sortedOrders.map((order) => (
        <OrderListItem key={order.id} order={order} />
      ))}
    </div>
  )
}
