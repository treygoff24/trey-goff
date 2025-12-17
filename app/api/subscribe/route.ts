import { NextRequest, NextResponse } from 'next/server'

const BUTTONDOWN_API_KEY = process.env.BUTTONDOWN_API_KEY

interface ButtondownError {
  detail?: string
  email?: string[]
}

export async function POST(request: NextRequest) {
  // Validate API key exists
  if (!BUTTONDOWN_API_KEY) {
    console.error('BUTTONDOWN_API_KEY not configured')
    return NextResponse.json(
      { error: 'Newsletter service not configured' },
      { status: 500 }
    )
  }

  try {
    const body = await request.json()
    const { email } = body

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Call Buttondown API
    const response = await fetch(
      'https://api.buttondown.email/v1/subscribers',
      {
        method: 'POST',
        headers: {
          Authorization: `Token ${BUTTONDOWN_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          tags: ['website'],
        }),
      }
    )

    // Handle Buttondown response
    if (response.status === 201) {
      return NextResponse.json(
        { message: 'Success! Check your inbox to confirm.' },
        { status: 201 }
      )
    }

    if (response.status === 400) {
      const errorData: ButtondownError = await response.json()

      // Check for already subscribed
      if (errorData.email?.some((e) => e.includes('already subscribed'))) {
        return NextResponse.json(
          { error: 'You are already subscribed!' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: errorData.detail || 'Invalid email' },
        { status: 400 }
      )
    }

    // Rate limiting
    if (response.status === 429) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Generic error
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  } catch (error) {
    console.error('Subscribe error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
