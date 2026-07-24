import { NextResponse } from 'next/server'

export async function POST() {
  if (process.env.NODE_ENV === 'production') return new NextResponse(null, { status: 404 })

  process.env.MISSION_CONTROL_FORCE_GITHUB_FAILURE = 'true'
  return new NextResponse(null, { status: 204 })
}

export async function DELETE() {
  if (process.env.NODE_ENV === 'production') return new NextResponse(null, { status: 404 })

  delete process.env.MISSION_CONTROL_FORCE_GITHUB_FAILURE
  return new NextResponse(null, { status: 204 })
}
