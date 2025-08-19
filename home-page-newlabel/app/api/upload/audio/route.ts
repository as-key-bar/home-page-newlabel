import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'このAPIエンドポイントは廃止されました。クライアントサイドから直接Firebase Storageにアップロードしてください。' },
    { status: 410 }
  )
}