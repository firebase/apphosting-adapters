import Button from '@/components/ui/button'

export default function NotFound() {
  return (
    <section className="flex flex-col gap-8 items-center justify-center h-[75vh]">
      <h1 className="text-3xl">Page not found</h1>
      <Button href="/">Back home</Button>
    </section>
  )
}
