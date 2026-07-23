'use server'

import {
  createCustomer,
  createCustomerAccessToken,
  activateCustomer,
  createCart
} from '@/lib/shopify'
import { cookies } from 'next/headers'

type Error = {
  message: string
}

export const handleCustomerCreate = async ({
  email,
  password,
  firstName,
  lastName,
  phone,
  acceptsMarketing
}: {
  email: string
  password: string
  firstName?: string
  lastName?: string
  phone?: string
  acceptsMarketing?: boolean
}): Promise<Customer | Error> => {
  try {
    const customer = await createCustomer({
      email,
      password,
      firstName,
      lastName,
      phone,
      acceptsMarketing
    })

    return customer
  } catch (error) {
    console.error('Error creating customer:', error)
    return { message: error instanceof Error ? error.message : 'Error creating customer' }
  }
}

export const handleCustomerActivate = async ({
  id,
  activationToken,
  password
}: {
  id: string
  activationToken: string
  password: string
}): Promise<{ customer: Customer; accessToken: CustomerAccessToken } | Error> => {
  try {
    const cookieStore = await cookies()
    const result = await activateCustomer(id, activationToken, password)

    // Store the access token in a cookie
    cookieStore.set('__session', result.accessToken.accessToken, {
      expires: new Date(result.accessToken.expiresAt)
    })

    return result
  } catch (error) {
    console.error('Error activating customer:', error)
    return { message: error instanceof Error ? error.message : 'Error activating customer' }
  }
}

export const handleCustomerLogin = async ({
  email,
  password
}: {
  email: string
  password: string
}): Promise<CustomerAccessToken | Error> => {
  try {
    const cookieStore = await cookies()
    const accessToken = await createCustomerAccessToken(email, password)

    // Store the access token in a cookie
    cookieStore.set('__session', accessToken.accessToken, {
      expires: new Date(accessToken.expiresAt)
    })

    createCart(accessToken.accessToken)

    return accessToken
  } catch (error) {
    console.error(error)
    return { message: error instanceof Error ? error.message : 'Error logging in' }
  }
}

export const handleCustomerLogout = async () => {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('__session')
  } catch (error) {
    console.error('Error logging out customer:', error)
    throw error
  }
}
