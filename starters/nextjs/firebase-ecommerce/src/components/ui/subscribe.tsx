import { JSX } from 'react'
import Arrow from '../icons/arrow'
import Input from './input'

export default function Subscribe(
  props: JSX.IntrinsicAttributes & React.InputHTMLAttributes<HTMLInputElement>
) {
  return (
    <div className="relative">
      <Input placeholder="Join our newsletter" className="h-16" {...props} />

      <button
        aria-label="Subscribe"
        type="submit"
        className="group absolute top-3 right-3 text-gray-600 bg-gray-200 h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-300 transition-colors"
      >
        <Arrow className="size-5" />
      </button>
    </div>
  )
}
