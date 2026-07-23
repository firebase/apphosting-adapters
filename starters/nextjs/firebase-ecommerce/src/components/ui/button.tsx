import * as React from 'react'
import Link from 'next/link'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

type ButtonBaseProps = VariantProps<typeof buttonVariants> & {
  children: React.ReactNode
  className?: string
}

type Button = ButtonBaseProps & React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: never }
type ButtonLink = ButtonBaseProps & React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }

type ButtonProps = Button | ButtonLink

export const buttonVariants = cva('group button', {
  variants: {
    variant: {
      primary: 'dark bg-background hover:bg-gray-600 rounded-full',
      secondary: 'bg-background hover:bg-gray-100 rounded-full',
      tertiary: 'font-normal bg-gray-200 hover:bg-gray-300 rounded-full',
      square: 'text-xs bg-gray-200 hover:bg-gray-300 p-4 rounded-lg',
      outline: 'border border-gray-300 hover:bg-gray-100/50 hover:border-gray-400/20 rounded-full',
      link: 'hover:text-gray-500 w-fit !p-0'
    },
    size: {
      sm: 'px-3 py-2',
      lg: 'px-5 py-4 h-[51px] min-w-[51px]'
    }
  },
  defaultVariants: {
    variant: 'primary',
    size: 'lg'
  }
})

export default React.forwardRef(function Button(
  props: ButtonProps,
  ref: React.Ref<HTMLButtonElement | HTMLAnchorElement>
) {
  const { children, className, variant, size, href, ...rest } = props

  if (href && !(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)?.disabled) {
    return (
      <Link
        href={href}
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref as React.Ref<HTMLAnchorElement>}
        {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {children}
      </Link>
    )
  }

  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref as React.Ref<HTMLButtonElement>}
      {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </button>
  )
})
