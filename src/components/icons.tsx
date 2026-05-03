import type { LucideProps } from "lucide-react";

export const Icons = {
  logo: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.37 3.63a2.12 2.12 0 1 1 3 3L12 16l-4 1 1-4Z" />
      <path d="m15 6 3 3" />
      <path d="M9 7h1" />
      <path d="M9 11h7" />
      <path d="M9 15h4" />
    </svg>
  ),
};
