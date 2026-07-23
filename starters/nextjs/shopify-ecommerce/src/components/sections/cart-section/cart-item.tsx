import Stepper from '../../ui/stepper'
import Trash from '../../icons/trash'
import Button from '../../ui/button'
import { handleRemoveFromCart } from '@/lib/actions/product'

type Props = {
  product: CartItem
  cartId?: string
}

export default function CartItem({ product, cartId }: Props) {
  return (
    <article className="w-full flex gap-5">
      {product.merchandise.product.featuredImage?.url ? (
        <img
          src={product.merchandise.product.featuredImage?.url}
          alt={product.merchandise.product.title}
          height="189"
          width="141"
          className="h-[189px] w-[141px] object-cover rounded-xl shrink-0 bg-gray-200"
        />
      ) : (
        <div className="h-[189px] w-[141px] bg-gray-200 rounded-xl shrink-0" />
      )}

      <div className="max-sm:text-sm flex max-sm:flex-col md:flex-col xl:flex-row sm:gap-5 sm:items-center md:items-start xl:items-center justify-center w-full">
        <div className="sm:mr-auto">
          <h3 className="sm:font-medium">{product.merchandise.product.title}</h3>
          <p className="text-gray-500">
            {product.merchandise.selectedOptions.map((option) => option.value).join('/')}
          </p>
        </div>
        <span className="sm:font-medium max-sm:mt-1 max-sm:mb-5">
          {(Number(product.cost.totalAmount.amount) / product.quantity).toFixed(2)}{' '}
          {product.cost.totalAmount.currencyCode}
        </span>
        <div className="flex gap-2 items-center">
          <Stepper
            cartId={cartId}
            lines={{
              id: product.id as string,
              merchandiseId: product.merchandise.id,
              quantity: product.quantity
            }}
          />

          <Button
            aria-label="Remove from cart"
            variant="secondary"
            className="size-11 p-0"
            onClick={async () => {
              await handleRemoveFromCart({
                cartId: cartId || '',
                lineId: product.id || ''
              })
            }}
          >
            <Trash className="size-5" />
          </Button>
        </div>
      </div>
    </article>
  )
}
