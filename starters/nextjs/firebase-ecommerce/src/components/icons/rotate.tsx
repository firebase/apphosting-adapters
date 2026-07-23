import { JSX } from 'react'

export default function Rotate(props: JSX.IntrinsicAttributes & React.SVGProps<SVGSVGElement>) {
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
        d="M0.833496 3.33301V8.33301H5.8335"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2.92516 12.5C3.46549 14.0337 4.48961 15.3502 5.84321 16.2512C7.19681 17.1522 8.80657 17.5889 10.4299 17.4954C12.0533 17.402 13.6023 16.7835 14.8436 15.7332C16.0849 14.6828 16.9512 13.2575 17.312 11.672C17.6728 10.0865 17.5086 8.42667 16.844 6.94262C16.1795 5.45857 15.0506 4.2307 13.6275 3.44401C12.2044 2.65732 10.5642 2.35442 8.95406 2.58097C7.34387 2.80751 5.85092 3.55122 4.70016 4.70004L0.833496 8.33337"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
