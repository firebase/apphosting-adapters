export default function CartLoadingSkeleton() {
  return (
    <section className="text-foreground bg-background pt-20 pb-10 lg:pt-48 lg:pb-20 min-h-[75vh] animate-pulse">
      <div className="relative container flex max-md:flex-col gap-20">
        <div className="flex flex-col gap-5 w-full">
          <div className="h-10 w-56 bg-gray-200 rounded" />
          <div className="w-full flex gap-5 animate-pulse">
            <div className="h-[189px] w-[141px] bg-gray-200 rounded-xl shrink-0" />
            <div className="flex flex-col justify-center w-full">
              <div className="h-4 bg-gray-200 rounded w-40 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-32" />
            </div>
          </div>
        </div>
        <div className="md:sticky md:top-36 w-full md:max-w-md flex flex-col gap-10 h-fit">
          <div className="h-10 w-48 bg-gray-200 rounded" />
          <ul className="border-y divide-y">
            <li className="flex justify-between py-4">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-200 rounded w-1/3" />
            </li>
            <li className="flex justify-between py-4">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-4 w-28 bg-gray-200 rounded" />
            </li>
            <li className="flex justify-between py-4">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-200 rounded w-1/3" />
            </li>
          </ul>
          <div className="flex flex-wrap justify-between text-2xl">
            <div className="h-6 bg-gray-200 rounded w-1/3" />
            <div className="h-6 bg-gray-200 rounded w-1/3" />
          </div>
          <div className="h-10 w-full bg-gray-200 rounded" />
        </div>
      </div>
    </section>
  )
}
