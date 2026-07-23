import { cn } from '@/lib/utils'

type Feature = {
  icon?: React.ReactNode
  name: string
  description?: string
}

type Props = {
  list: Feature[]
  inline?: boolean
}

export default function Features({ list, inline }: Props) {
  if (!list.length) return null

  return (
    <section className="text-foreground bg-background">
      <ul
        style={{ gridTemplateColumns: `repeat(${list.length}, minmax(0, 1fr))` }}
        className="max-w-screen-2xl mx-auto flex flex-col lg:grid lg:gap-5 border-y max-lg:divide-y"
      >
        {list.map((feature) => (
          <li
            key={feature.name}
            className={cn(
              'flex items-center justify-center text-center p-6 lg:p-8 [&_svg]:size-5',
              inline ? 'gap-3' : 'flex-col [&_svg]:mb-1.5'
            )}
          >
            {feature.icon && feature.icon}
            <span>{feature.name}</span>
            {feature.description && <p className="text-gray-500">{feature.description}</p>}
          </li>
        ))}
      </ul>
    </section>
  )
}
