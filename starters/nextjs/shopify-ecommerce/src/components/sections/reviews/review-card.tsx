import Rating from '@/components/ui/rating'
import { GetProductReviewsData } from '@dataconnect/ecommerce-template'

export default function ReviewCard({
  rating,
  content,
  createdAt,
  userName
}: GetProductReviewsData['reviews'][number]) {
  return (
    <article className="grid min-w-[307px] lg:min-w-[467px] py-10 mx-2.5 border-t">
      <Rating rating={rating} />
      <p className="my-6 lg:text-lg">{content}</p>
      <span>{userName}</span>
      <span className="text-gray-500">
        {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(createdAt))}
      </span>
    </article>
  )
}
