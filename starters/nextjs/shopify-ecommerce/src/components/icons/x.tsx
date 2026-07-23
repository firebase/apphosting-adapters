export default function X(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M15 5L5 15" stroke="currentColor" strokeLinecap="square" />
      <path d="M5 5L15 15" stroke="currentColor" strokeLinecap="square" />
    </svg>
  )
}
