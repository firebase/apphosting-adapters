import { cookies } from 'next/headers'
import Authentication from './authentication'
import { redirect } from 'next/navigation'

export default async function AuthPage() {
  const cookieStore = await cookies()
  const customerAccessToken = cookieStore.get('__session')?.value

  if (customerAccessToken) {
    return redirect('/orders')
  }

  return <Authentication />
}
