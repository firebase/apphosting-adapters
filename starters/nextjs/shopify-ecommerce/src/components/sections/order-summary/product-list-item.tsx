type Props = {
  title: string
  quantity: number
  variant: {
    title: string
    price: Money
    image: Image
  }
}

export default function ProductListItem({ title, variant, quantity }: Props) {
  return (
    <article className="w-full flex gap-4 lg:gap-10 items-center text-sm">
      <img
        src={variant.image.url}
        alt={title}
        height="100"
        width="100"
        className="w-16 h-16 object-cover shrink-0 rounded-lg"
      />
      <div>
        <h2 className="font-medium">{title}</h2>
        <p className="text-gray-400">{variant.title}</p>
      </div>
      <div className="flex gap-4 lg:gap-10 ml-auto">
        <div>
          <span className="text-gray-400">QTY</span> {quantity}
        </div>
        <span className="font-medium">
          {variant.price.amount} {variant.price.currencyCode}
        </span>
      </div>
    </article>
  )
}
