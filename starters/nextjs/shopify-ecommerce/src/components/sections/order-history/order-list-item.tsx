import Button from '@/components/ui/button'
import Link from 'next/link'

export default function OrderListItem({ order }: { order: Order }) {
  const { totalPrice, totalQuantity, processedAt, lineItems, orderNumber } = order

  return (
    <article className="flex gap-10 items-center py-5">
      {lineItems[0].variant.image.url ? (
        <img
          src={lineItems[0].variant.image.url as string}
          alt={lineItems[0].title}
          width="100"
          height="100"
          className="size-16 md:size-10 rounded-full object-cover shrink-0 bg-gray-200"
        />
      ) : (
        <div className="size-16 md:size-10 bg-gray-200 rounded-full shrink-0" />
      )}
      <div className="w-full flex max-md:flex-col md:gap-10 items-center [&_div]:w-full">
        <div className="max-md:text-sm font-medium">#{orderNumber}</div>
        <div className="max-md:text-xs">
          <span className="md:hidden text-gray-400 mr-2">Date</span>
          {new Intl.DateTimeFormat('en-US', {
            dateStyle: 'medium'
          }).format(new Date(processedAt))}
        </div>
        <div className="max-md:text-xs md:text-right">
          <span className="md:hidden text-gray-400 mr-2">Items</span>
          {totalQuantity}
        </div>
        <div className="max-md:text-xs md:text-right">
          <span className="md:hidden text-gray-400 mr-2">Total</span>
          {totalPrice.amount} {totalPrice.currencyCode}
        </div>
      </div>
      <div className="w-32 flex gap-2 items-center justify-end shrink-0">
        <Link href={`/orders/${orderNumber}`}>
          <Button variant="tertiary" size="sm">
            View
          </Button>
        </Link>
        <Button size="sm">Track</Button>
      </div>
    </article>
  )
}
