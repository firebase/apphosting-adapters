import Stepper from '../../ui/stepper'
import Trash from '../../icons/trash'
import Button from '../../ui/button'
import { Product, useCartStore } from '@/lib/stores/cart-store'
import { useShallow } from 'zustand/shallow'

type Props = {
  product: Product
}

export default function CartItem({ product }: Props) {
  const { removeProduct } = useCartStore(
    useShallow((state) => ({ removeProduct: state.removeProduct }))
  )

  return (
    <article className="w-full flex gap-5">
      {product.image?.url ? (
        <img
          src={product.image?.url as string}
          alt={product.name}
          height={product.image?.height || 189}
          width={product.image?.width || 141}
          className="h-[189px] w-[141px] object-cover rounded-xl shrink-0 bg-gray-200"
        />
      ) : (
        <div className="h-[189px] w-[141px] bg-gray-200 rounded-xl shrink-0" />
      )}

      <div className="max-sm:text-sm flex max-sm:flex-col md:flex-col xl:flex-row sm:gap-5 sm:items-center md:items-start xl:items-center justify-center w-full">
        <div className="sm:mr-auto">
          <h3 className="sm:font-medium">{product.name}</h3>
          <p className="text-gray-500">
            {product.selectedOption.map((option) => option.value).join('/')}
          </p>
        </div>
        <span className="sm:font-medium max-sm:mt-1 max-sm:mb-5">
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(product.price / product.quantity)}
        </span>
        <div className="flex gap-2 items-center">
          <Stepper
            item={{
              productId: product.productId,
              quantity: product.quantity,
              selectedOption: product.selectedOption
            }}
          />

          <Button
            variant="secondary"
            className="size-11 p-0"
            onClick={() => {
              removeProduct({
                productId: product.productId,
                selectedOption: product.selectedOption
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
