import {
  addToCartMutation,
  createCartMutation,
  editCartItemsMutation,
  removeFromCartMutation
} from './mutations/cart'
import {
  customerCreateMutation,
  customerActivateMutation,
  customerAccessTokenCreateMutation
} from './mutations/customers'
import { getCartQuery } from './queries/cart'
import {
  getCollectionProductsQuery,
  getCollectionQuery,
  getCollectionsQuery
} from './queries/collection'
import { getProductQuery } from './queries/product'
import { getCustomerQuery } from './queries/customer'
import { cookies } from 'next/headers'

const domain = process.env.SHOPIFY_STORE_DOMAIN || ''
const endpoint = `https://${domain}/api/${process.env.SHOPIFY_STOREFRONT_API_VERSION}/graphql.json`
const key = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!

type ExtractVariables<T> = T extends { variables: object } ? T['variables'] : never

export async function shopifyFetch<T>({
  cache = 'force-cache',
  headers,
  query,
  tags,
  variables
}: {
  cache?: RequestCache
  headers?: HeadersInit
  query: string
  tags?: string[]
  variables?: ExtractVariables<T>
}): Promise<{ status: number; body: T } | never> {
  try {
    const result = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': key,
        ...headers
      },
      body: JSON.stringify({
        ...(query && { query }),
        ...(variables && { variables })
      }),
      cache,
      ...(tags && { next: { tags } })
    })

    const body = await result.json()

    if (body.errors) {
      throw body.errors[0]
    }

    return {
      status: result.status,
      body
    }
  } catch (e) {
    throw {
      error: e,
      query
    }
  }
}

export async function createCart(customerAccessToken?: string): Promise<Cart> {
  const res = await shopifyFetch<ShopifyCreateCartOperation>({
    query: createCartMutation,
    variables: {
      input: {
        buyerIdentity: customerAccessToken
          ? {
              customerAccessToken
            }
          : undefined
      }
    },
    cache: 'no-store'
  })

  const cookieStore = await cookies()
  const cartId = res.body.data.cartCreate.cart.id
  if (cartId) {
    cookieStore.set('cartId', cartId)
  }

  return {
    ...res.body.data.cartCreate.cart,
    lines: res.body.data.cartCreate.cart.lines.edges.map((edge) => edge.node)
  }
}

export async function addToCart(
  cartId: string,
  lines: { merchandiseId: string; quantity: number }[]
): Promise<Cart> {
  const res = await shopifyFetch<ShopifyAddToCartOperation>({
    query: addToCartMutation,
    variables: {
      cartId,
      lines
    },
    cache: 'no-store'
  })
  return {
    ...res.body.data.cartLinesAdd.cart,
    lines: res.body.data.cartLinesAdd.cart.lines.edges.map((edge) => edge.node)
  }
}

export async function removeFromCart(cartId: string, lineIds: string[]): Promise<Cart> {
  const res = await shopifyFetch<ShopifyRemoveFromCartOperation>({
    query: removeFromCartMutation,
    variables: {
      cartId,
      lineIds
    },
    cache: 'no-store'
  })

  return {
    ...res.body.data.cartLinesRemove.cart,
    lines: res.body.data.cartLinesRemove.cart.lines.edges.map((edge) => edge.node)
  }
}

export async function updateCart(
  cartId: string,
  lines: { id: string; merchandiseId: string; quantity: number }[]
): Promise<Cart> {
  const res = await shopifyFetch<ShopifyUpdateCartOperation>({
    query: editCartItemsMutation,
    variables: {
      cartId,
      lines
    },
    cache: 'no-store'
  })

  return {
    ...res.body.data.cartLinesUpdate.cart,
    lines: res.body.data.cartLinesUpdate.cart.lines.edges.map((edge) => edge.node)
  }
}

export async function getCart(cartId: string | undefined): Promise<Cart | undefined> {
  if (!cartId) {
    return undefined
  }

  const res = await shopifyFetch<ShopifyCartOperation>({
    query: getCartQuery,
    variables: { cartId },
    tags: ['cart'],
    cache: 'no-store'
  })

  const cart = res.body.data.cart
  if (!cart) {
    return undefined
  }

  if (!cart.cost?.totalTaxAmount) {
    cart.cost.totalTaxAmount = {
      amount: '0.0',
      currencyCode: cart.cost.totalAmount.currencyCode
    }
  }

  return {
    ...cart,
    lines: cart.lines.edges.map((edge) => edge.node)
  }
}

export async function getCollection(handle: string): Promise<ShopifyCollection | undefined> {
  const res = await shopifyFetch<ShopifyCollectionOperation>({
    query: getCollectionQuery,
    tags: ['collections'],
    variables: {
      handle
    }
  })

  return res.body.data.collection
}

export async function getCollectionProducts({
  collection,
  reverse,
  sortKey
}: {
  collection: string
  reverse?: boolean
  sortKey?: string
}): Promise<ShopifyProduct[]> {
  const res = await shopifyFetch<ShopifyCollectionProductsOperation>({
    query: getCollectionProductsQuery,
    tags: ['collections', 'products'],
    variables: {
      handle: collection,
      reverse,
      sortKey: sortKey === 'CREATED_AT' ? 'CREATED' : sortKey
    }
  })

  if (!res.body.data.collection) {
    console.info(`No collection found for \`${collection}\``)
    return []
  }

  return res.body.data.collection.products.edges.map((edge) => edge.node)
}

export async function getCollections(): Promise<Collection[]> {
  const res = await shopifyFetch<ShopifyCollectionsOperation>({
    query: getCollectionsQuery,
    tags: ['collections']
  })

  const collections = [
    {
      handle: '',
      title: 'All',
      description: 'All products',
      seo: {
        title: 'All',
        description: 'All products'
      },
      path: '/search',
      image: {
        id: '',
        url: '',
        altText: '',
        width: 0,
        height: 0
      },
      updatedAt: '',
      products: {
        edges: []
      }
    },
    ...res.body.data.collections.edges
      .map((edge) => edge.node)
      .filter(Boolean)
      .map((collection) => ({
        ...collection,
        path: `/search/${collection.handle}`
      }))
  ]

  return collections
}

export async function getProduct(
  handle: string
): Promise<(Omit<ShopifyProduct, 'images'> & { images: Image[] }) | undefined> {
  const res = await shopifyFetch<ShopifyProductOperation>({
    query: getProductQuery,
    tags: [`product-${handle}`],
    variables: {
      handle
    },
    cache: 'default'
  })

  const product = res.body.data.product
  if (!product) {
    return undefined
  }

  return {
    ...product,
    images: product.images.edges.map((edge) => {
      const image = edge.node
      const filename = image.url.match(/.*\/(.*)\..*/)?.[1]
      return {
        ...image,
        altText: image.altText || `${product.title} - ${filename}`
      }
    })
  }
}

export async function createCustomer({
  email,
  password,
  firstName,
  lastName,
  phone,
  acceptsMarketing = false
}: {
  email: string
  password: string
  firstName?: string
  lastName?: string
  phone?: string
  acceptsMarketing?: boolean
}): Promise<Customer> {
  const res = await shopifyFetch<ShopifyCustomerCreateOperation>({
    query: customerCreateMutation,
    variables: {
      input: {
        email,
        password,
        firstName,
        lastName,
        phone,
        acceptsMarketing
      }
    },
    cache: 'no-store'
  })

  if (res.body.data?.customerCreate?.customerUserErrors?.length) {
    throw new Error(res.body.data.customerCreate.customerUserErrors[0].message)
  }

  return res.body.data.customerCreate.customer
}

export async function activateCustomer(
  id: string,
  activationToken: string,
  password: string
): Promise<{ customer: Customer; accessToken: CustomerAccessToken }> {
  const res = await shopifyFetch<ShopifyCustomerActivateOperation>({
    query: customerActivateMutation,
    variables: {
      id,
      input: {
        activationToken,
        password
      }
    },
    cache: 'no-store'
  })

  if (res.body.data?.customerActivate?.customerUserErrors?.length) {
    throw new Error(res.body.data.customerActivate.customerUserErrors[0].message)
  }

  return {
    customer: res.body.data.customerActivate.customer,
    accessToken: res.body.data.customerActivate.customerAccessToken
  }
}

export async function createCustomerAccessToken(
  email: string,
  password: string
): Promise<CustomerAccessToken> {
  const res = await shopifyFetch<ShopifyCustomerAccessTokenCreateOperation>({
    query: customerAccessTokenCreateMutation,
    variables: {
      input: {
        email,
        password
      }
    },
    cache: 'no-store'
  })

  if (res.body.data?.customerAccessTokenCreate?.customerUserErrors?.length) {
    throw new Error(res.body.data.customerAccessTokenCreate.customerUserErrors[0].message)
  }

  return res.body.data.customerAccessTokenCreate.customerAccessToken
}

export async function getCustomer(
  customerAccessToken?: string,
  cache: RequestCache = 'default'
): Promise<Customer | undefined> {
  if (!customerAccessToken) {
    return undefined
  }

  try {
    const res = await shopifyFetch<ShopifyCustomerOperation>({
      query: getCustomerQuery,
      variables: {
        customerAccessToken
      },
      cache
    })

    const customer = res.body.data.customer
    if (!customer) {
      return undefined
    }

    return {
      ...customer,
      orders: customer.orders.edges.map((edge) => {
        const order = edge.node
        return {
          id: order.id,
          orderNumber: order.orderNumber,
          totalPrice: order.totalPrice,
          processedAt: order.processedAt,
          financialStatus: order.financialStatus,
          fulfillmentStatus: order.fulfillmentStatus,
          email: order.email,
          lineItems: order.lineItems.edges.map((edge) => {
            const item = edge.node
            return {
              title: item.title,
              quantity: item.quantity,
              variant: {
                id: item.variant.id,
                title: item.variant.title,
                price: item.variant.price,
                image: item.variant.image
              }
            }
          }),
          totalQuantity: order.lineItems.edges.reduce((acc, edge) => acc + edge.node.quantity, 0),
          shippingAddress: order.shippingAddress,
          billingAddress: order.billingAddress,
          subtotalPrice: order.subtotalPrice,
          totalTax: order.totalTax,
          totalShippingPrice: order.totalShippingPrice
        }
      })
    }
  } catch (error) {
    console.error('Error fetching customer:', error)
    return undefined
  }
}
