import { cn } from '@/lib/utils'

type Props = {
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export default function HamburgerButton({ isOpen, setIsOpen }: Props) {
  return (
    <button
      type="button"
      aria-label="Toggle mobile navigation menu"
      onClick={() => setIsOpen((prev) => !prev)}
      className="lg:hidden dark z-50 relative size-7 flex flex-col items-center justify-center"
    >
      <div
        className={cn(
          'w-4 bg-background h-px rounded-full transition-all duration-300 ease-in-out',
          isOpen ? 'translate-y-px rotate-45' : 'translate-y-1.5'
        )}
      />
      <div
        className={cn(
          'bg-background h-px rounded-full transition-all duration-300 ease-in-out',
          isOpen ? 'w-0 opacity-0' : 'w-4 opacity-100'
        )}
      />
      <div
        className={cn(
          'w-4 bg-background h-px rounded-full transition-all duration-300 ease-in-out',
          isOpen ? '-translate-y-px -rotate-45' : '-translate-y-1.5'
        )}
      />
    </button>
  )
}
