export const getCartQuery = /* GraphQL */ `
  query getCart($cartId: ID!) {
    cart(id: $cartId) {
      id
      checkoutUrl
      cost {
        subtotalAmount {
          amount
          currencyCode
        }
        totalAmount {
          amount
          currencyCode
        }
        totalTaxAmount {
          amount
          currencyCode
        }
      }
      lines(first: 100) {
        edges {
          node {
            id
            quantity
            cost {
              totalAmount {
                amount
                currencyCode
              }
            }
            merchandise {
              ... on ProductVariant {
                id
                title
                selectedOptions {
                  name
                  value
                }
                product {
                  id
                  handle
                  availableForSale
                  title
                  description
                  descriptionHtml
                  options {
                    id
                    name
                    values
                  }
                  priceRange {
                    maxVariantPrice {
                      amount
                      currencyCode
                    }
                    minVariantPrice {
                      amount
                      currencyCode
                    }
                  }
                  variants(first: 250) {
                    edges {
                      node {
                        id
                        title
                        availableForSale
                        selectedOptions {
                          name
                          value
                        }
                        price {
                          amount
                          currencyCode
                        }
                      }
                    }
                  }
                  featuredImage {
                    url
                    altText
                    width
                    height
                  }
                  images(first: 20) {
                    edges {
                      node {
                        url
                        altText
                        width
                        height
                      }
                    }
                  }
                  seo {
                    description
                    title
                  }
                  tags
                  updatedAt
                }
              }
            }
          }
        }
      }
      totalQuantity
    }
  }
`
