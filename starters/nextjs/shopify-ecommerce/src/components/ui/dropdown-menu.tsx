import { Menu, MenuButton, MenuItems, Transition } from '@headlessui/react'
import { Fragment } from 'react'

type Props = {
  icon: React.ReactNode
  children: React.ReactNode
}

export default function DropdownMenu({ icon, children }: Props) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <MenuButton
          as="button"
          aria-label="Dropdown menu"
          className="p-1 lg:p-1.5 rounded-full lg:bg-gray-100 lg:hover:bg-gray-200 transition-colors"
        >
          {icon}
        </MenuButton>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <MenuItems className="absolute right-0 mt-2 min-w-48 origin-top-right rounded-3xl bg-white border border-gray-300 focus:outline-none p-2">
          {children}
        </MenuItems>
      </Transition>
    </Menu>
  )
}
