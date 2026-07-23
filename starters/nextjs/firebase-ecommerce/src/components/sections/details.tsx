type Details = {
  id?: string
  title: string
  body: string
}

export default function Details({ title, body }: Details) {
  return (
    <section className="text-foreground bg-background py-10 lg:p-20">
      <div className="relative container flex max-lg:flex-col gap-4 lg:gap-32 max-w-6xl">
        {title ? <h2 className="text-gray-400 text-xs lg:mr-auto">{title}</h2> : null}
        {body ? <p className="text-xl lg:text-3xl max-w-4xl">{body}</p> : null}
      </div>
    </section>
  )
}
