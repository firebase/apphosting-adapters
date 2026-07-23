export const getCustomerQuery = /* GraphQL */ `
  query getCustomer($customerAccessToken: String!) {
    customer(customerAccessToken: $customerAccessToken) {
      id
      firstName
      lastName
      email
      phone
      acceptsMarketing
      orders(first: 10) {
        edges {
          node {
            id
            orderNumber
            shippingAddress {
              address1
              address2
              city
              country
              countryCodeV2
              firstName
              lastName
              zip
            }
            billingAddress {
              address1
              address2
              city
              country
              countryCodeV2
              firstName
              lastName
              zip
            }
            subtotalPrice {
              amount
              currencyCode
            }
            totalTax {
              amount
              currencyCode
            }
            totalShippingPrice {
              amount
              currencyCode
            }
            totalPrice {
              amount
              currencyCode
            }
            processedAt
            financialStatus
            fulfillmentStatus
            email
            lineItems(first: 10) {
              edges {
                node {
                  title
                  quantity
                  variant {
                    id
                    title
                    price {
                      amount
                      currencyCode
                    }
                    image {
                      id
                      url
                      altText
                      width
                      height
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`
