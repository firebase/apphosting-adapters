import { JSX } from 'react'

export default function Gemini(props: JSX.IntrinsicAttributes & React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M6 12C6.46954 8.9015 8.9015 6.46954 12 6C8.9015 5.53046 6.46954 3.0985 6 0C5.53046 3.0985 3.0985 5.53046 0 6C3.0985 6.46954 5.53046 8.9015 6 12Z"
        fill="currentColor"
      />
    </svg>
  )
}
