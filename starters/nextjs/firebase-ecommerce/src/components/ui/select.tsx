import { useSearchParams, useRouter } from 'next/navigation'
import Button from './button'
import Chevron from '../icons/chevron'

type Props = {
  label: string
  defaultValue?: {
    label: string
    value: string
  }
  options?: {
    label: string
    value: string
  }[]
  onChange?: (value: string) => void
  className?: string
}

export default function Select({ label, defaultValue, options = [], onChange, className }: Props) {
  const searchParams = useSearchParams()
  const { push } = useRouter()
  const sortParam = searchParams.get('sort')

  const currentOption = sortParam
    ? options.find((opt) => opt.value === sortParam) || defaultValue
    : defaultValue

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value
    const newParams = new URLSearchParams(searchParams.toString())

    if (newValue === defaultValue?.value) {
      newParams.delete('sort')
    } else {
      newParams.set('sort', newValue)
    }

    push(`?${newParams.toString()}`, { scroll: false })
    onChange?.(newValue)
  }

  return (
    <div className={`group relative ${className}`}>
      <Button variant="outline">
        {currentOption?.label || label}
        <Chevron className="size-5" />
      </Button>
      <select
        onChange={handleSelectChange}
        value={currentOption?.value as string}
        className="absolute inset-0 opacity-0 cursor-pointer"
      >
        <optgroup label={label}>
          {defaultValue && <option value={defaultValue.value}>{defaultValue.label}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </optgroup>
      </select>
    </div>
  )
}
