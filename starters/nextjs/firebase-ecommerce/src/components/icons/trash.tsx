import { JSX } from 'react'

export default function Trash(props: JSX.IntrinsicAttributes & React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="20"
      height="21"
      viewBox="0 0 20 21"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M2.5 5.25391H4.16667H17.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.8327 5.25423V16.9209C15.8327 17.3629 15.6571 17.7868 15.3445 18.0994C15.032 18.412 14.608 18.5876 14.166 18.5876H5.83268C5.39065 18.5876 4.96673 18.412 4.65417 18.0994C4.34161 17.7868 4.16602 17.3629 4.16602 16.9209V5.25423M6.66602 5.25423V3.58757C6.66602 3.14554 6.84161 2.72161 7.15417 2.40905C7.46673 2.09649 7.89065 1.9209 8.33268 1.9209H11.666C12.108 1.9209 12.532 2.09649 12.8445 2.40905C13.1571 2.72161 13.3327 3.14554 13.3327 3.58757V5.25423"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.33398 9.4209V14.4209"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.666 9.4209V14.4209"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
