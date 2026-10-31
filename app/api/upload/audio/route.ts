import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { error: 'このAPIエンドポイントは廃止されました。クライアントサイドから直接Firebase Storageにアップロードしてください。' },
    { status: 410 }
  )
}
