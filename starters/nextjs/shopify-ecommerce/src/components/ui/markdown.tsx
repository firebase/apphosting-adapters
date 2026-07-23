import Link from 'next/link'
import React, { memo } from 'react'
import ReactMarkdown, { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

const NonMemoizedMarkdown = ({ children }: { children: string }) => {
  const components = {
    ol: ({ children, ...props }: React.HTMLAttributes<HTMLOListElement>) => {
      return (
        <ol className="list-decimal list-outside ml-4" {...props}>
          {children}
        </ol>
      )
    },
    li: ({ children, ...props }: React.HTMLAttributes<HTMLLIElement>) => {
      return (
        <li className="py-1" {...props}>
          {children}
        </li>
      )
    },
    ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => {
      return (
        <ul className="list-decimal list-outside ml-4" {...props}>
          {children}
        </ul>
      )
    },
    strong: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => {
      return (
        <span className="font-semibold" {...props}>
          {children}
        </span>
      )
    },
    a: ({
      children,
      href,
      ...props
    }: React.HTMLAttributes<HTMLAnchorElement> & { href: string }) => {
      return (
        <Link
          href={href ?? '#'}
          className="text-blue-500 hover:underline"
          target="_blank"
          rel="noreferrer"
          {...props}
        >
          {children}
        </Link>
      )
    }
  }

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components as Components}>
      {children}
    </ReactMarkdown>
  )
}

export const Markdown = memo(
  NonMemoizedMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children
)
