import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'

type Review = {
  content: string
}

export async function POST(request: Request) {
  try {
    const { reviews, count } = await request.json()

    if (!reviews?.length) {
      return NextResponse.json({ summary: '' })
    }

    const reviewsText = reviews.map((review: Review) => review.content).join('\n')

    const prompt =
      'Generate a summary from the user reviews, keep it short and concise: \n\n' +
      reviewsText +
      '\n\n' +
      '\n\n' +
      'Make sure to include the following keywords: fit, build quality, value, looks, washability.' +
      '\n\n' +
      '***Keep the summary under 350 characters.***'

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY ?? '')
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const { response } = await model.generateContent([prompt])
    const summary = response?.text() ?? ''

    return NextResponse.json(
      { summary, count },
      {
        headers: {
          'Cache-Control': `public, s-maxage=86400, stale-while-revalidate=${count}`
        }
      }
    )
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to generate review summary' }, { status: 500 })
  }
}
