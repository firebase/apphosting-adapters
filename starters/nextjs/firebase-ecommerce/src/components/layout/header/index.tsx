import Header from './header'

const navigation = [
  { label: 'New', href: '/category/winter-essentials' },
  { label: 'Men', href: '/category/winter-essentials' },
  { label: 'Women', href: '/category/winter-essentials' },
  { label: 'Sale', href: '/category/winter-essentials' }
]

export default async function HeaderContainer() {
  return <Header navigation={navigation} />
}
