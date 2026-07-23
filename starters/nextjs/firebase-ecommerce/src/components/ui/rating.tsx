import { clsx } from 'clsx'
import { useState } from 'react'

type Props = {
  showRating?: boolean
  rating: number
  className?: string
  interactive?: boolean
  onChange?: (rating: number) => void
}

type StarType = {
  type: 'empty' | 'half' | 'full'
}

const Star = ({
  type,
  onClick,
  onHover
}: StarType & { onClick?: () => void; onHover?: () => void }) => {
  const paths = {
    empty: (
      <path
        d="M9.99984 1.66669L12.5748 6.88335L18.3332 7.72502L14.1665 11.7834L15.1498 17.5167L9.99984 14.8084L4.84984 17.5167L5.83317 11.7834L1.6665 7.72502L7.42484 6.88335L9.99984 1.66669Z"
        stroke="currentColor"
        strokeOpacity="0.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
    half: (
      <>
        <path
          d="M9.99984 1.66669L12.5748 6.88335L18.3332 7.72502L14.1665 11.7834L15.1498 17.5167L9.99984 14.8084L4.84984 17.5167L5.83317 11.7834L1.6665 7.72502L7.42484 6.88335L9.99984 1.66669Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10.0003 1.6665V14.8082L4.85033 17.5165L5.83366 11.7832L1.66699 7.72484L7.42533 6.88317L10.0003 1.6665Z"
          fill="currentColor"
        />
      </>
    ),
    full: (
      <path
        d="M9.99984 1.66669L12.5748 6.88335L18.3332 7.72502L14.1665 11.7834L15.1498 17.5167L9.99984 14.8084L4.84984 17.5167L5.83317 11.7834L1.6665 7.72502L7.42484 6.88335L9.99984 1.66669Z"
        fill="currentColor"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )
  }

  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      className={clsx('inline-block text-foreground', (onClick || onHover) && 'cursor-pointer')}
      onClick={onClick}
      onMouseEnter={onHover}
    >
      {paths[type]}
    </svg>
  )
}

export default function Rating({
  showRating = true,
  rating,
  className,
  interactive = false,
  onChange
}: Readonly<Props>) {
  const [selectedRating, setSelectedRating] = useState(rating)
  const [hoveredRating, setHoveredRating] = useState(0)
  const adjustedRating = Math.min(hoveredRating || selectedRating, 5)

  const handleStarClick = (index: number) => {
    if (interactive) {
      setSelectedRating(index + 1)
      onChange?.(index + 1)
    }
  }

  const handleStarHover = (index: number) => {
    if (interactive) {
      setHoveredRating(index + 1)
    }
  }

  const handleMouseLeave = () => {
    if (interactive) {
      setHoveredRating(0)
    }
  }

  const stars: StarType['type'][] = Array.from({ length: 5 }, (_, index) => {
    if (index < Math.floor(adjustedRating)) return 'full'
    if (index < Math.ceil(adjustedRating)) return 'half'
    return 'empty'
  })

  return (
    <div className={clsx('flex items-center', className)} onMouseLeave={handleMouseLeave}>
      {stars.map((type, index) => (
        <Star
          key={index}
          type={type}
          onClick={interactive ? () => handleStarClick(index) : undefined}
          onHover={interactive ? () => handleStarHover(index) : undefined}
        />
      ))}

      {showRating && (
        <span className="ml-1.5 flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full border border-gray-200 px-1 text-xs font-medium text-gray-400">
          {adjustedRating % 1 !== 0 ? adjustedRating.toFixed(1) : adjustedRating}
        </span>
      )}
    </div>
  )
}
