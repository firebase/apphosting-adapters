import OrderHistory from '@/components/sections/order-history'
import { getCustomer } from '@/lib/shopify'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function OrdersPage() {
  const cookieStore = await cookies()
  const customerAccessToken = cookieStore.get('__session')?.value

  if (!customerAccessToken) {
    redirect('/auth')
  }

  const customer = await getCustomer(customerAccessToken, 'no-cache')

  return (
    <section className="text-foreground bg-background">
      <div className="container pt-20 pb-10 lg:pt-48 lg:pb-20 space-y-10">
        <h1 className="text-4xl">
          Hello, {customer?.firstName} {customer?.lastName}!
          <br />
          Total Orders: <span className="text-gray-400">{customer?.orders?.length}</span>
        </h1>
        <OrderHistory orders={customer?.orders || []} />
      </div>
    </section>
  )
}
