type Connection<T> = {
  edges: Array<Edge<T>>
}

type Edge<T> = {
  node: T
}

type Cart = Omit<ShopifyCart, 'lines'> & {
  lines: CartItem[]
}

type CartItem = {
  id: string | undefined
  quantity: number
  cost: {
    totalAmount: Money
  }
  merchandise: {
    id: string
    title: string
    selectedOptions: {
      name: string
      value: string
    }[]
    product: CartProduct
  }
}

type Collection = ShopifyCollection & {
  path: string
}

type Image = {
  url: string
  altText: string
  width: number
  height: number
}

type Money = {
  amount: string
  currencyCode: string
}

type ProductOption = {
  id: string
  name: string
  values: string[]
}

type ProductVariant = {
  id: string
  title: string
  availableForSale: boolean
  selectedOptions: {
    name: string
    value: string
  }[]
  price: Money
}

type ShopifyCart = {
  id: string | undefined
  checkoutUrl: string
  cost: {
    subtotalAmount: Money
    totalAmount: Money
    totalTaxAmount: Money
  }
  lines: Connection<CartItem>
  totalQuantity: number
}

type ShopifyCollection = {
  handle: string
  title: string
  description: string
  seo: SEO
  updatedAt: string
  image: Image
  products: Connection<ShopifyProduct>
}

type ShopifyProduct = {
  id: string
  handle: string
  availableForSale: boolean
  title: string
  description: string
  descriptionHtml: string
  options: ProductOption[]
  priceRange: {
    maxVariantPrice: Money
    minVariantPrice: Money
  }
  variants: Connection<ProductVariant>
  featuredImage: Image
  images: Connection<Image>
  seo: SEO
  tags: string[]
  updatedAt: string
}

type ShopifyCartOperation = {
  data: {
    cart: ShopifyCart
  }
  variables: {
    cartId: string
  }
}

type ShopifyCreateCartOperation = {
  data: {
    cartCreate: {
      cart: ShopifyCart
    }
  }
  variables: {
    input: {
      lines?: {
        merchandiseId: string
        quantity: number
      }[]
      buyerIdentity?: CartBuyerIdentity
    }
  }
}

type ShopifyAddToCartOperation = {
  data: {
    cartLinesAdd: {
      cart: ShopifyCart
    }
  }
  variables: {
    cartId: string
    lines: {
      merchandiseId: string
      quantity: number
    }[]
  }
}

type ShopifyRemoveFromCartOperation = {
  data: {
    cartLinesRemove: {
      cart: ShopifyCart
    }
  }
  variables: {
    cartId: string
    lineIds: string[]
  }
}

type ShopifyUpdateCartOperation = {
  data: {
    cartLinesUpdate: {
      cart: ShopifyCart
    }
  }
  variables: {
    cartId: string
    lines: {
      id: string
      merchandiseId: string
      quantity: number
    }[]
  }
}

type ShopifyCollectionOperation = {
  data: {
    collection: ShopifyCollection
  }
  variables: {
    handle: string
  }
}

type ShopifyCollectionProductsOperation = {
  data: {
    collection: {
      products: Connection<ShopifyProduct>
    }
  }
  variables: {
    handle: string
    reverse?: boolean
    sortKey?: string
  }
}

type ShopifyCollectionsOperation = {
  data: {
    collections: Connection<ShopifyCollection>
  }
}

type ShopifyProductOperation = {
  data: { product: ShopifyProduct }
  variables: {
    handle: string
  }
}

type ShopifyProductRecommendationsOperation = {
  data: {
    productRecommendations: ShopifyProduct[]
  }
  variables: {
    productId: string
  }
}

type ShopifyProductsOperation = {
  data: {
    products: Connection<ShopifyProduct>
  }
  variables: {
    query?: string
    reverse?: boolean
    sortKey?: string
  }
}

type Customer = {
  id: string
  firstName?: string
  lastName?: string
  email: string
  phone?: string
  acceptsMarketing?: boolean
  orders?: Order[]
}

type CustomerAccessToken = {
  accessToken: string
  expiresAt: string
}

type CustomerUserError = {
  code?: string
  field?: string[]
  message: string
}

// Operation types for customer creation
type ShopifyCustomerCreateOperation = {
  data: {
    customerCreate: {
      customer: Customer
      customerUserErrors: CustomerUserError[]
    }
  }
  variables: {
    input: {
      firstName?: string
      lastName?: string
      email: string
      phone?: string
      password: string
      acceptsMarketing?: boolean
    }
  }
}

// Operation types for customer activation
type ShopifyCustomerActivateOperation = {
  data: {
    customerActivate: {
      customer: Customer
      customerAccessToken: CustomerAccessToken
      customerUserErrors: CustomerUserError[]
    }
  }
  variables: {
    id: string
    input: {
      activationToken: string
      password: string
    }
  }
}

// Operation types for customer access token creation
type ShopifyCustomerAccessTokenCreateOperation = {
  data: {
    customerAccessTokenCreate: {
      customerAccessToken: CustomerAccessToken
      customerUserErrors: CustomerUserError[]
    }
  }
  variables: {
    input: {
      email: string
      password: string
    }
  }
}

type CartBuyerIdentity = {
  customerAccessToken?: string
  email?: string
  phone?: string
  countryCode?: string
}

type ShopifyCustomerOperation = {
  data: {
    customer: {
      id: string
      firstName: string
      lastName: string
      email: string
      acceptsMarketing: boolean
      orders: Connection<{
        id: string
        orderNumber: number
        shippingAddress: MailingAddress
        billingAddress: MailingAddress
        subtotalPrice: Money
        totalTax: Money
        totalShippingPrice: Money
        totalPrice: Money
        processedAt: string
        financialStatus: string
        fulfillmentStatus: string
        email: string
        lineItems: Connection<{
          title: string
          quantity: number
          variant: {
            id: string
            title: string
            price: Money
            image: Image
          }
        }>
      }>
    }
  }
  variables: {
    customerAccessToken: string
  }
}

type Order = {
  id: string
  orderNumber: number
  shippingAddress: MailingAddress
  billingAddress: MailingAddress
  subtotalPrice: Money
  totalTax: Money
  totalShippingPrice: Money
  totalPrice: Money
  processedAt: string
  financialStatus: string
  fulfillmentStatus: string
  email: string
  lineItems: {
    title: string
    quantity: number
    variant: {
      id: string
      title: string
      price: Money
      image: Image
    }
  }[]
  totalQuantity: number
}

type MailingAddress = {
  address1: string
  address2?: string
  city: string
  country: string
  firstName: string
  lastName: string
  phone?: string
  province?: string
  zip: string
}
