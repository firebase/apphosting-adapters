import { NextResponse } from 'next/server'
import stripe from '@/lib/stripe'
import { Product } from '@/lib/stores/cart-store'

export async function POST(request: Request) {
  try {
    const { amount, products, customer, shippingInfo } = await request.json()

    // Create product items for metadata
    const productItems = products.map((product: Product) => ({
      productId: product.productId,
      name: product.name,
      quantity: product.quantity,
      price: product.price,
      variant: product.selectedOption.map((opt) => `${opt.name}: ${opt.value}`).join(', ')
    }))

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true
      },
      metadata: {
        order_items: JSON.stringify(productItems),
        customer_email: customer?.email || 'guest',
        customer_id: customer?.id || 'guest',
        customer_name: customer?.name || 'guest',
        total_items: products.length,
        products: products.map((p: Product) => p.name).join(', '),
        customer_phone: customer?.phone || 'N/A',
        shipping_info: JSON.stringify(shippingInfo)
      }
    })

    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error creating payment intent' }, { status: 500 })
  }
}
