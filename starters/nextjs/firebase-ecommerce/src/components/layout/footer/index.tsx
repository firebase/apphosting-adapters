import Link from 'next/link'
import { ReactNode } from 'react'
import Subscribe from '@/components/ui/subscribe'

type Link = {
  href: string
  label: string
}

type Section = {
  title?: string
  links: Link[]
}

type SocialMediaLink = {
  label: string
  href: string
  icon: ReactNode
}

type ContactInformation = {
  email?: string
  phone?: string
}

type Props = {
  sections: Section[]
  contactInformation?: ContactInformation
  paymentIcons?: ReactNode[]
  socialMediaLinks?: SocialMediaLink[]
  className?: string
}

export default function Footer({
  sections,
  contactInformation,
  paymentIcons,
  socialMediaLinks,
  className = ''
}: Props) {
  return (
    <footer className={`dark text-foreground bg-background py-10 lg:p-20 ${className}`}>
      <div className="container">
        <div className="max-w-screen-2xl mx-auto grid md:grid-cols-2 gap-5 pb-12 lg:pb-20 border-b border-gray-600">
          <div className="space-y-2">
            <h2 className="text-2xl lg:text-4xl">Sign up for our newsletter</h2>
            <p className="text-gray-500">
              Lorem ipsum dolor sit amet consectetur adipiscing sed do eiusmod tempor.
            </p>
          </div>
          <Subscribe />
        </div>

        <div className="max-w-screen-2xl mx-auto flex max-lg:flex-col justify-between gap-12 pt-12 lg:pt-20">
          <div className="flex flex-col justify-between">
            {contactInformation?.email != null || contactInformation?.phone != null ? (
              <div className="text-[20px] font-medium @lg:text-2xl">
                <h3 className="text-gray-600">Contact Us</h3>
                <div className="flex flex-col">
                  {contactInformation.email != null && contactInformation.email !== '' && (
                    <Link
                      href={`mailto:${contactInformation.email}`}
                      className="hover:text-gray-400 transition-colors w-fit"
                    >
                      {contactInformation.email}
                    </Link>
                  )}
                  {contactInformation.phone != null && contactInformation.phone !== '' && (
                    <Link
                      href={`tel:${contactInformation.phone}`}
                      className="hover:text-gray-400 transition-colors w-fit"
                    >
                      {contactInformation.phone}
                    </Link>
                  )}
                </div>
              </div>
            ) : null}

            {socialMediaLinks != null && (
              <div className="mt-auto flex items-center gap-4 pt-12">
                {socialMediaLinks.map(({ label, href, icon }, i) => {
                  return (
                    <Link
                      key={i}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="flex items-center justify-center fill-gray-500 p-1 transition-colors duration-300 hover:fill-foreground [&_svg]:size-6"
                    >
                      {icon}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-10 lg:gap-y-10 xl:justify-end xl:max-w-3xl">
            {sections.length &&
              sections.map(({ title, links }, i) => {
                return (
                  <div
                    key={i}
                    className="flex-1 basis-full lg:pl-10 text-[15px] last:pr-0 sm:basis-1/4 lg:basis-auto"
                  >
                    {title != null && <h4 className="mb-8 block font-medium">{title}</h4>}
                    <ul>
                      {links.map((link, idx) => {
                        return (
                          <li key={idx}>
                            <Link
                              className="block py-2.5 text-gray-500 font-medium hover:text-foreground transition-colors"
                              href={link.href}
                            >
                              {link.label}
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )
              })}
          </div>
        </div>

        <div className="max-w-screen-2xl mx-auto pt-12 lg:pt-20 flex flex-wrap-reverse justify-between gap-y-12">
          <span className="block text-gray-500">
            &copy; {new Date().getFullYear()} Google Inc. – Powered by Firebase
          </span>

          {paymentIcons != null && <div className="sm:ml-auto flex gap-2">{paymentIcons}</div>}
        </div>
      </div>
    </footer>
  )
}
