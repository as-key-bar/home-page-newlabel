import { NextResponse } from 'next/server'
import { getProfileAdmin } from '@/lib/firestore-admin'

export async function GET() {
  try {
    const profile = await getProfileAdmin()
    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error getting profile:', error)
    const { defaultProfile } = await import('@/lib/fallback-data')
    return NextResponse.json(defaultProfile)
  }
}