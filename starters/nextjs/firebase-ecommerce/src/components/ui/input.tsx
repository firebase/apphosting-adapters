import * as React from 'react'
import { cn } from '@/lib/utils'

export default React.forwardRef(function Input(
  { className, type, ...props }: React.InputHTMLAttributes<HTMLInputElement>,
  ref: React.Ref<HTMLInputElement>
) {
  return (
    <input
      type={type}
      className={cn(
        'flex h-[50px] text-[16px] w-full rounded-full border bg-transparent px-6 py-4 font-medium transition-colors placeholder:text-black/30 dark:placeholder:text-gray-500 hover:border-gray-400/50 focus-visible:border-foreground focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
