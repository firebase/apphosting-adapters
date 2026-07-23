import { JSX } from 'react'

export default function Search(props: JSX.IntrinsicAttributes & React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M17.5 17.5L14.5833 14.5833M16.6667 9.16667C16.6667 13.2686 13.2686 16.6667 9.16667 16.6667C5.06474 16.6667 1.66667 13.2686 1.66667 9.16667C1.66667 5.06474 5.06474 1.66667 9.16667 1.66667C13.2686 1.66667 16.6667 5.06474 16.6667 9.16667Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
