'use client'

import { useState } from 'react'
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import Button from '@/components/ui/button'

export default function CheckoutForm() {
  const stripe = useStripe()
  const elements = useElements()
  const [errorMessage, setErrorMessage] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/orders?success=true`
      }
    })

    if (error) {
      setErrorMessage(error.message ?? 'An unexpected error occurred.')
    }

    setIsProcessing(false)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6">
      <PaymentElement />
      <Button disabled={!stripe || isProcessing} className="w-full" type="submit">
        {isProcessing ? 'Processing...' : 'Pay now'}
      </Button>
      {errorMessage && <div className="text-red-500 text-sm">{errorMessage}</div>}
    </form>
  )
}
