import { JSX } from 'react'

export default function Truck(props: JSX.IntrinsicAttributes & React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 21 21"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g clipPath="url(#clip0_94_41228)">
        <path
          d="M13.8335 3H1.3335V13.8333H13.8335V3Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M13.8335 7.16699H17.1668L19.6668 9.66699V13.8337H13.8335V7.16699Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5.08333 17.9997C6.23393 17.9997 7.16667 17.0669 7.16667 15.9163C7.16667 14.7657 6.23393 13.833 5.08333 13.833C3.93274 13.833 3 14.7657 3 15.9163C3 17.0669 3.93274 17.9997 5.08333 17.9997Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M15.9168 17.9997C17.0674 17.9997 18.0002 17.0669 18.0002 15.9163C18.0002 14.7657 17.0674 13.833 15.9168 13.833C14.7662 13.833 13.8335 14.7657 13.8335 15.9163C13.8335 17.0669 14.7662 17.9997 15.9168 17.9997Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_94_41228">
          <rect width="20" height="20" fill="white" transform="translate(0.5 0.5)" />
        </clipPath>
      </defs>
    </svg>
  )
}
