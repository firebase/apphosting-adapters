'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import { FirebaseError } from 'firebase/app'
import { upsertCustomer } from '@firebasegen/default-connector'
import { dc } from '@/lib/data-connect'
import { setCookie } from 'cookies-next'
import { getAuthErrorMessage } from '@/lib/firebase/getAuthErrorMessages'
import { useCartStore } from '@/lib/stores/cart-store'
import { useShallow } from 'zustand/shallow'

export default function Authentication() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const { totalQuantity: cartTotalQuantity } = useCartStore(
    useShallow((state) => ({ totalQuantity: state.totalQuantity }))
  )

  useEffect(() => {
    setEmail('')
    setPassword('')
    setFirstName('')
    setLastName('')
    setError('')
  }, [isSignUp])

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password)
      setCookie('customerId', user.uid)
      upsertCustomer(dc, {
        firstName: user.displayName?.split(' ')[0] ?? '',
        lastName: user.displayName?.split(' ')[1] ?? '',
        email: user.email ?? '',
        phone: '',
        acceptsMarketing: false
      })

      if (cartTotalQuantity > 0) {
        router.push('/cart')
      } else {
        router.push('/')
      }
    } catch (error) {
      setError(
        error instanceof FirebaseError ? getAuthErrorMessage(error) : 'An unexpected error occurred'
      )
    }
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`
      })
      await upsertCustomer(dc, {
        firstName,
        lastName,
        email,
        phone: '',
        acceptsMarketing: false
      })
      if (cartTotalQuantity > 0) {
        router.push('/cart')
      } else {
        router.push('/')
      }
    } catch (error) {
      setError(
        error instanceof FirebaseError ? getAuthErrorMessage(error) : 'An unexpected error occurred'
      )
    }
  }

  return (
    <section className="pt-20 pb-10 md:py-48">
      <div className="container max-w-6xl grid md:grid-cols-2 max-md:divide-y md:divide-x">
        {isSignUp ? (
          <div className="space-y-10 max-md:pb-10 md:pr-10 lg:pr-20">
            <h1 className="text-4xl">Register</h1>

            <form onSubmit={handleEmailSignUp} autoComplete="on">
              <label htmlFor="signup-first-name" className="text-xs">
                First Name
              </label>
              <Input
                id="signup-first-name"
                name="first-name"
                autoComplete="first-name"
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="mt-2 mb-5"
              />
              <label htmlFor="signup-last-name" className="text-xs">
                Last Name
              </label>
              <Input
                id="signup-last-name"
                name="last-name"
                autoComplete="last-name"
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="mt-2 mb-5"
              />
              <label htmlFor="signin-email" className="text-xs">
                Email
              </label>
              <Input
                id="signup-email"
                name="signup-email"
                autoComplete="signup-email"
                type="email"
                placeholder="hello@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-2 mb-5"
              />
              <label htmlFor="signin-password" className="text-xs">
                Password
              </label>
              <Input
                id="signup-password"
                name="signup-password"
                autoComplete="signup-password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-2 mb-10"
              />

              <Button type="submit" className="w-full">
                Register
              </Button>
            </form>

            {error && <p className="text-error text-center">{error}</p>}
          </div>
        ) : (
          <div className="space-y-10 max-md:pb-10 md:pr-10 lg:pr-20">
            <h1 className="text-4xl">Log in</h1>

            <form onSubmit={handleEmailSignIn} autoComplete="on">
              <label htmlFor="signin-email" className="text-xs">
                Email
              </label>
              <Input
                id="signin-email"
                name="email"
                autoComplete="email"
                type="email"
                placeholder="hello@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-2 mb-5"
              />

              <label htmlFor="signin-password" className="text-xs">
                Password
              </label>
              <Input
                id="signin-password"
                name="password"
                autoComplete="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-2 mb-10"
              />

              <Button type="submit" className="w-full">
                Log in
              </Button>
            </form>

            <Button href="/auth/forgot-password" variant="link" className="text-sm !mt-5">
              Forgot Password?
            </Button>

            {error && <p className="text-error text-center">{error}</p>}
          </div>
        )}

        {isSignUp ? (
          <div className="space-y-10 max-md:pt-10 md:pl-10 lg:pl-20">
            <h2 className="text-4xl">Already have an account?</h2>
            <Button type="button" className="w-full" onClick={() => setIsSignUp(false)}>
              Log In
            </Button>
          </div>
        ) : (
          <div className="space-y-10 max-md:pt-10 md:pl-10 lg:pl-20">
            <h2 className="text-4xl">New customer?</h2>

            <div className="space-y-6 pb-3.5">
              <p>Create an account with us and you&apos;ll be able to:</p>
              <ul className="[&_li]:list-disc ml-5 pb-2">
                <li>Check out faster</li>
                <li>Save multiple shipping addresses</li>
                <li>Access your order history</li>
                <li>Track new orders</li>
                <li>Save items to your Wish List</li>
              </ul>
            </div>

            <Button type="button" className="w-full" onClick={() => setIsSignUp(true)}>
              Create account
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
