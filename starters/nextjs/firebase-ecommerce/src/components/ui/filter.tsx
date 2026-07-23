import { useSearchParams, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import Sliders from '../icons/sliders'
import Button from './button'
import Accordion from './accordion'
import X from '../icons/x'
import Sheet from './sheet'
import { useState } from 'react'

type Filter = {
  label: string
  options: {
    label: string
    value: string
    count?: number
  }[]
}

type Props = {
  filters: Filter[]
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export default function Filter({ filters, open, setOpen }: Props) {
  const searchParams = useSearchParams()
  const { push } = useRouter()
  const [pendingFilters, setPendingFilters] = useState<Record<string, string[]>>({})

  if (!filters) return null

  const getSelectedOptions = () => {
    const selectedOptions: Record<string, string[]> = {}
    for (const [key, value] of searchParams.entries()) {
      const values = value.split(',')
      selectedOptions[key.toLowerCase()] = values
    }
    return selectedOptions
  }

  const toggleOption = (label: string, value: string) => {
    const currentValues =
      pendingFilters[label.toLowerCase()] || searchParams.get(label.toLowerCase())?.split(',') || []

    let newValues: string[]
    if (currentValues.includes(value)) {
      newValues = currentValues.filter((v) => v !== value)
    } else {
      newValues = [...currentValues, value]
    }

    setPendingFilters((prev) => ({
      ...prev,
      [label.toLowerCase()]: newValues
    }))
  }

  const applyFilters = () => {
    const newParams = new URLSearchParams(searchParams.toString())

    for (const key of Array.from(newParams.keys())) {
      if (filters.some((f) => f.label.toLowerCase() === key.toLowerCase())) {
        newParams.delete(key)
      }
    }

    Object.entries(pendingFilters).forEach(([key, values]) => {
      if (values.length > 0) {
        newParams.set(key.toLowerCase(), values.join(','))
      }
    })

    push(`?${newParams.toString()}`, { scroll: false })
    setOpen(false)
    setPendingFilters({})
  }

  const resetFilters = () => {
    setPendingFilters({})
    const newParams = new URLSearchParams()
    push(`?${newParams.toString()}`, { scroll: false })
  }

  const selectedOptions = getSelectedOptions()
  const totalSelected =
    Object.values(pendingFilters).reduce((total, arr) => total + arr.length, 0) ||
    Object.values(selectedOptions).reduce((total, arr) => total + arr.length, 0)

  return (
    <>
      <Button onClick={() => setOpen(!open)} className="z-10 max-lg:w-[51px]">
        <span className="max-lg:hidden">Filter</span> <Sliders className="size-5" />
      </Button>

      <Sheet open={open} setOpen={setOpen}>
        <div className="flex flex-wrap justify-between items-center">
          <h2 className="text-xl lg:text-2xl">
            Filters{' '}
            {totalSelected > 0 && <span className="text-gray-400">{totalSelected} applied</span>}
          </h2>

          <Button
            aria-label="Close filters"
            onClick={() => setOpen(false)}
            variant="outline"
            className="lg:hidden size-10 p-3"
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="relative space-y-6 overflow-y-auto max-h-[70vh]">
          {filters.map(({ label, options }) => (
            <Accordion key={label} label={label} open>
              <div className="flex flex-wrap gap-2">
                {options.map((option) => {
                  const selected =
                    pendingFilters[label.toLowerCase()]?.includes(option.value) ||
                    selectedOptions[label.toLowerCase()]?.includes(option.value)
                  return (
                    <Button
                      key={option.label}
                      variant="tertiary"
                      size="sm"
                      onClick={() => toggleOption(label, option.value)}
                      className={cn('min-h-10 min-w-10', {
                        'text-white bg-foreground hover:bg-foreground': selected
                      })}
                    >
                      {option.label}{' '}
                      {option.count ? <span className="text-gray-500">{option.count}</span> : null}
                    </Button>
                  )
                })}
              </div>
            </Accordion>
          ))}

          <div className="fixed left-0 bottom-0 flex gap-5 w-full lg:max-w-xl lg:mx-auto bg-background px-3 lg:px-20 py-10">
            <Button onClick={applyFilters} disabled={totalSelected === 0} className="w-full">
              Update results
            </Button>
            <Button
              onClick={resetFilters}
              variant="link"
              disabled={totalSelected === 0}
              className="px-5"
            >
              Reset
            </Button>
          </div>
        </div>
      </Sheet>
    </>
  )
}
