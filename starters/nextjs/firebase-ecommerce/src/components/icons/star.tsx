import { JSX } from 'react'

export default function Star(props: JSX.IntrinsicAttributes & React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="21"
      height="20"
      viewBox="0 0 21 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M10.6654 1.66699L13.2404 6.88366L18.9987 7.72533L14.832 11.7837L15.8154 17.517L10.6654 14.8087L5.51536 17.517L6.4987 11.7837L2.33203 7.72533L8.09036 6.88366L10.6654 1.66699Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
