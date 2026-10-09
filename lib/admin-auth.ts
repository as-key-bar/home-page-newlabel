import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth } from './firebase-admin'

/** 管理者として許可するメールアドレス（カンマ区切りで ADMIN_EMAILS から上書き可能） */
export function getAdminEmails(): string[] {
  const fromEnv = process.env.ADMIN_EMAILS
  if (fromEnv) {
    return fromEnv.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  }
  return ['askeybar.official@gmail.com']
}

export function extractBearerToken(header: string | null): string | null {
  if (!header) return null
  const match = /^Bearer\s+(.+)$/i.exec(header)
  return match ? match[1].trim() : null
}

export function isAdminEmail(email: string | undefined | null, emailVerified: boolean | undefined): boolean {
  if (!email || !emailVerified) return false
  return getAdminEmails().includes(email.toLowerCase())
}

/**
 * 管理者として認証済みであれば null、そうでなければエラーレスポンスを返す。
 * 使い方: const denied = await requireAdmin(request); if (denied) return denied
 */
export async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  const token = extractBearerToken(request.headers.get('authorization'))
  if (!token) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  try {
    const decoded = await getAdminAuth().verifyIdToken(token)
    if (!isAdminEmail(decoded.email, decoded.email_verified)) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }
    return null
  } catch (error) {
    console.error('ID token verification failed:', error)
    return NextResponse.json({ error: '認証に失敗しました' }, { status: 401 })
  }
}

