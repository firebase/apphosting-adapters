import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import stripe from '@/lib/stripe'
import Stripe from 'stripe'
import { dc } from '@/lib/data-connect'
import {
  createOrder,
  createOrderItem,
  updateOrderByPaymentIntentId
} from '@firebasegen/default-connector'

const secret = process.env.STRIPE_WEBHOOK_SECRET
export async function POST(request: Request) {
  try {
    if (!secret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not set')
    }

    const body = await request.text()
    const headersStore = await headers()
    const signature = headersStore.get('stripe-signature') ?? ''

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, secret)
    } catch (err) {
      const error = err as Error
      console.error(`Webhook signature verification failed: ${error.message}`)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    switch (event.type) {
      // Occurs when a PaymentIntent has successfully completed payment.
      // The payment has been captured and the funds are available.
      // This event contains detailed metadata about the transaction.
      // Use this webhook to:
      // - Update order status in your database
      // - Trigger fulfillment processes
      // - Update inventory systems
      // - Record customer purchase history
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const metadata = paymentIntent.metadata
        try {
          const orderItems = JSON.parse(metadata.order_items || '[]') as {
            productId: string
            quantity: number
            price: number
          }[]

          const { data: order } = await createOrder(dc, {
            customerId: metadata.customer_id,
            paymentIntentId: paymentIntent.id,
            subtotalPrice: paymentIntent.amount,
            totalTax: 0,
            totalShippingPrice: 0,
            totalPrice: paymentIntent.amount,
            financialStatus: 'pending',
            fulfillmentStatus: 'pending'
          })

          const items = orderItems.map(
            (item: { productId: string; quantity: number; price: number }) => {
              return {
                orderId: order.order_insert.id,
                productId: item.productId,
                quantity: item.quantity,
                price: item.price
              }
            }
          )

          await Promise.all(items.map((item) => createOrderItem(dc, item)))
        } catch (error) {
          console.error('Error processing payment metadata:', error)
        }
        break
      }

      // Occurs when a PaymentIntent fails the payment process.
      // This can happen due to insufficient funds, card declined,
      // authentication failures, or other payment method issues.
      // Use this webhook to:
      // - Update order status
      // - Notify customers of failed payments
      // - Trigger retry logic if applicable
      // - Log failed payment attempts
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent

        try {
          await updateOrderByPaymentIntentId(dc, {
            paymentIntentId: paymentIntent.id,
            financialStatus: 'failed',
            fulfillmentStatus: 'cancelled',
            processedAt: new Date().toISOString().slice(0, 19)
          })
        } catch (error) {
          console.error('Error processing payment metadata:', error)
        }

        break
      }

      // Occurs when a charge is successfully created and funds captured.
      // This represents the actual transfer of funds from the customer.
      // Contains detailed information about the payment, including
      // receipt details and customer information.
      // Use this webhook to:
      // - Send payment receipts
      // - Update accounting systems
      // - Record successful payment details
      // - Update customer payment history
      case 'charge.succeeded': {
        const charge = event.data.object as Stripe.Charge
        try {
          if (!charge.payment_intent) break // Skip if no payment_intent

          await updateOrderByPaymentIntentId(dc, {
            paymentIntentId: charge.payment_intent.toString(),
            chargeId: charge.id,
            financialStatus: 'paid',
            fulfillmentStatus: 'processing',
            receiptUrl: charge.receipt_url,
            processedAt: new Date().toISOString().slice(0, 19)
          })
        } catch (error) {
          console.error('Error processing charge:', error)
        }

        break
      }

      // Occurs when a charge's properties have been updated.
      // This can happen when:
      case 'charge.updated': {
        const charge = event.data.object as Stripe.Charge

        try {
          await updateOrderByPaymentIntentId(dc, {
            paymentIntentId: charge.payment_intent?.toString() ?? '',
            chargeId: charge.id,
            financialStatus: charge.status,
            processedAt: new Date().toISOString().slice(0, 19),
            receiptUrl: charge.receipt_url
          })
        } catch (error) {
          console.error('Error processing charge update:', error)
        }
        break
      }

      default:
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const config = {
  api: {
    bodyParser: false // Disable body parsing, need raw body for signature verification
  }
}
