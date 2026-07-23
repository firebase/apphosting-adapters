type Order = {
  id: string
  totalPrice: {
    amount: number
    currencyCode: string
  }
  totalQuantity: number
  processedAt: string
  lineItems: {
    title: string
    price: number
    variant: {
      image: {
        url: string
        altText?: string | null
        width?: number
        height?: number
      }
    }
  }[]
  orderNumber: string
}
