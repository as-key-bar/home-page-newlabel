import { NextResponse } from 'next/server'
import { getProfile } from '@/lib/firestore'

export async function GET() {
  try {
    const profile = await getProfile()
    
    if (!profile) {
      return NextResponse.json({ error: 'Profile data not found' }, { status: 404 })
    }
    
    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error getting profile:', error)
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 })
  }
}