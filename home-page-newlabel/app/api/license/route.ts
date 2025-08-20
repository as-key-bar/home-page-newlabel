import { NextResponse } from 'next/server'
import { getLicense } from '@/lib/firestore'

export async function GET() {
  try {
    const license = await getLicense()
    
    if (!license) {
      return NextResponse.json({ error: 'License data not found' }, { status: 404 })
    }
    
    return NextResponse.json(license)
  } catch (error) {
    console.error('Error getting license data:', error)
    return NextResponse.json({ error: 'Failed to load license data' }, { status: 500 })
  }
}