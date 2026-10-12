import { NextResponse } from 'next/server'
import { getLicenseAdmin } from '@/lib/firestore-admin'

export async function GET() {
  try {
    const license = await getLicenseAdmin()
    return NextResponse.json(license)
  } catch (error) {
    console.error('Error getting license data:', error)
    // エラー時でも静的フォールバックを返してページ表示を壊さない
    const { defaultLicense } = await import('@/lib/fallback-data')
    return NextResponse.json(defaultLicense)
  }
}