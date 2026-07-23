'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import { handleCustomerCreate, handleCustomerLogin } from '@/lib/actions/auth'

export default function Authentication() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)

  const [error, setError] = useState('')
  const router = useRouter()

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await handleCustomerLogin({ email, password })

    if ('message' in result) {
      setError(result.message)
      return
    }

    router.push('/')
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const customerResult = await handleCustomerCreate({
      email,
      password,
      firstName,
      lastName,
      acceptsMarketing: false
    })

    if ('message' in customerResult) {
      setError(customerResult.message)
      return
    }

    // After successful creation, sign in the user
    const loginResult = await handleCustomerLogin({ email, password })

    if ('message' in loginResult) {
      setError(loginResult.message)
      return
    }

    router.push('/')
  }

  return (
    <section className="pt-20 pb-10 md:py-48">
      <div className="container max-w-6xl grid md:grid-cols-2 max-md:divide-y md:divide-x">
        {isSignUp ? (
          <div className="space-y-10 max-md:pb-10 md:pr-10 lg:pr-20">
            <h1 className="text-4xl">Register</h1>

            <form onSubmit={handleEmailSignUp}>
              <label htmlFor="signin-first-name" className="text-xs">
                First Name
              </label>
              <Input
                id="signin-first-name"
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="mt-2 mb-5"
              />
              <label htmlFor="signin-last-name" className="text-xs">
                Last Name
              </label>
              <Input
                id="signin-last-name"
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
                id="signin-email"
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

            <form onSubmit={handleEmailSignIn}>
              <label htmlFor="signin-email" className="text-xs">
                Email
              </label>
              <Input
                id="signin-email"
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
              Log in
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
