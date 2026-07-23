import Link from 'next/link'
import Arrow from '../../icons/arrow'
import Button from '../../ui/button'
import ProductListItem from './product-list-item'

type Props = {
  order?: Order
  customer?: Customer
}

export default function OrderSummary({ order, customer }: Props) {
  if (!order || !customer) return null

  const {
    processedAt,
    totalPrice,
    shippingAddress,
    subtotalPrice,
    totalTax,
    totalShippingPrice,
    orderNumber
  } = order
  const { firstName, lastName, email } = customer

  return (
    <section className="text-foreground bg-background">
      <div className="container py-10 lg:py-24 space-y-10">
        <Button href="/orders" variant="link" className="font-normal gap-4 lg:mb-14">
          <Arrow className="size-3 rotate-180" />
          Back
        </Button>

        <div className="flex max-sm:flex-col gap-10 justify-between sm:items-center">
          <h1 className="text-2xl lg:text-4xl">Order #{orderNumber}</h1>
          <div className="max-sm:w-full flex gap-10 items-center">
            <div className="text-sm">
              <span className="text-gray-400">Date</span>
              <span className="block">
                {new Intl.DateTimeFormat('en-US', {
                  dateStyle: 'medium'
                }).format(new Date(processedAt))}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-gray-400">Payment Method</span>
              <span className="block">Visa **** 0001</span>
            </div>

            <Button size="sm" className="max-sm:ml-auto">
              Track
            </Button>
          </div>
        </div>

        <div className="flex max-lg:flex-col gap-5">
          <aside className="w-full lg:max-w-sm p-5 border border-gray-100 rounded-2xl text-sm">
            <h2 className="text-xl font-medium mb-10">Order Details</h2>
            {customer && (
              <div className="mb-10">
                <h3 className="text-gray-400">Contact Information</h3>
                <span>{`${firstName} ${lastName}`}</span>
                <Link href={`mailto:${email}`} className="block">
                  {email}
                </Link>
              </div>
            )}
            <h3 className="text-gray-400">Shipping Address</h3>
            <address className="not-italic w-32">
              {shippingAddress.address1}
              <br />
              {shippingAddress.city}, {shippingAddress.province} {shippingAddress.zip}
            </address>
          </aside>

          <div className="w-full space-y-5">
            <div className="w-full space-y-3 p-5 border border-gray-100 rounded-2xl">
              <h2 className="text-xl font-medium mb-10">Order Summary</h2>
              {order.lineItems.map((item) => (
                <ProductListItem key={item.variant.id} {...item} />
              ))}
              <ul className="space-y-3 pt-10">
                {[
                  {
                    label: 'Subtotal',
                    value: `${subtotalPrice.amount} ${subtotalPrice.currencyCode}`
                  },
                  { label: 'Tax', value: `${totalTax.amount} ${totalTax.currencyCode}` },
                  {
                    label: 'Shipping',
                    value: `${totalShippingPrice.amount} ${totalShippingPrice.currencyCode}`
                  }
                ].map((entry) => (
                  <li key={entry.label} className="flex justify-between">
                    <span className="text-gray-400">{entry.label}</span> {entry.value}
                  </li>
                ))}
                <li className="text-xl flex justify-between pt-7">
                  <span className="mr-auto">Total</span> {totalPrice.amount}{' '}
                  {totalPrice.currencyCode}
                </li>
              </ul>
            </div>

            <div className="w-full space-y-4 p-5 border border-gray-100 rounded-2xl">
              <h2 className="text-xl">Contact Us</h2>
              <p className="text-gray-500 text-sm">
                If you need help with this order, please contact us via email at{' '}
                <Link href="mailto:orders@firebase.com">orders@firebase.com</Link>, or get in touch
                via Live Chat.
              </p>
              <div className="flex gap-4 items-center pt-6">
                <Button size="sm">Talk to us</Button>
                <p className="text-gray-500 text-sm">3 minute wait</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
