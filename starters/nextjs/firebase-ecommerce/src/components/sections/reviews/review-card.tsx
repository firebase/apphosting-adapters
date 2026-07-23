import Rating from '@/components/ui/rating'

type Review = {
  id: string
  rating: number
  content: string
  date: string
  customer: {
    id: string
    firstName: string
    lastName: string
  }
}

export default function ReviewCard({ rating, content, date, customer }: Review) {
  return (
    <article className="grid min-w-[307px] lg:min-w-[467px] py-10 mx-2.5 border-t">
      <Rating rating={rating} />
      <p className="my-6 lg:text-lg">{content}</p>
      <span>
        {customer.firstName} {customer.lastName}
      </span>
      <span className="text-gray-500">
        {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(date))}
      </span>
    </article>
  )
}
