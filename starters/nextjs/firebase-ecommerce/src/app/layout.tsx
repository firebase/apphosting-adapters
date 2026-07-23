import type { Metadata } from 'next'
import './globals.css'
import HeaderContainer from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import { Facebook, Instagram, X, Youtube } from '@/components/layout/footer/social-icons'
import {
  Amex,
  ApplePay,
  Bitcoin,
  GooglePay,
  Mastercard,
  Paypal,
  Visa
} from '@/components/layout/footer/payment-icons'
import AnnouncementBar from '@/components/ui/announcement-bar'

export const metadata: Metadata = {
  title: 'Firebase Ecommerce Template',
  description: 'Firebase Ecommerce Template'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <AnnouncementBar>
          Get <strong>15%</strong> off and free shipping <strong>&quot;welcome&quot;</strong>
        </AnnouncementBar>
        <HeaderContainer />
        <main className="min-h-[75vh]">{children}</main>
        <Footer
          contactInformation={{
            email: 'info@mywebsite.com',
            phone: '+1 (408) 123-4567'
          }}
          socialMediaLinks={[
            {
              label: 'Facebook',
              href: 'https://facebook.com/',
              icon: <Facebook />
            },
            {
              label: 'X',
              href: 'https://x.com/',
              icon: <X />
            },
            {
              label: 'Instagram',
              href: 'https://instagram.com/',
              icon: <Instagram />
            },
            {
              label: 'Youtube',
              href: 'https://youtube.com/',
              icon: <Youtube />
            }
          ]}
          sections={[
            {
              title: 'Categories',
              links: [
                { label: 'Categories', href: '/' },
                { label: 'Categories', href: '/' },
                { label: 'Categories', href: '/' },
                { label: 'Categories', href: '/' }
              ]
            },
            {
              title: 'Company',
              links: [
                { label: 'About', href: '/' },
                { label: 'Stories', href: '/' },
                { label: 'Careers', href: '/' },
                { label: 'Stores', href: '/' }
              ]
            },
            {
              title: 'Help & Support',
              links: [
                { label: 'FAQs', href: '/' },
                { label: 'Contact Us', href: '/' },
                { label: 'Returns', href: '/' },
                { label: 'Shipping', href: '/' }
              ]
            },
            {
              title: 'Follow Us',
              links: [
                { label: 'X', href: '/' },
                { label: 'Instagram', href: '/' },
                { label: 'Facebook', href: '/' },
                { label: 'LinkedIn', href: '/' }
              ]
            }
          ]}
          paymentIcons={[
            <Visa key="visa" />,
            <Amex key="amex" />,
            <Mastercard key="mastercard" />,
            <Paypal key="paypal" />,
            <GooglePay key="google-pay" />,
            <ApplePay key="apple-pay" />,
            <Bitcoin key="bitcoin" />
          ]}
        />
      </body>
    </html>
  )
}
