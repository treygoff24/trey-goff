import { NextResponse } from 'next/server'

export async function POST() {
  if (process.env.NODE_ENV === 'production') return new NextResponse(null, { status: 404 })

  process.env.MISSION_CONTROL_E2E_TIME_ZONE = 'Etc/UTC'
  return new NextResponse(null, { status: 204 })
}

export async function DELETE() {
  if (process.env.NODE_ENV === 'production') return new NextResponse(null, { status: 404 })

  delete process.env.MISSION_CONTROL_E2E_TIME_ZONE
  return new NextResponse(null, { status: 204 })
}
