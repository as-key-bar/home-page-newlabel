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
 * Firebase Auth REST API (`accounts:lookup`) を使った ID トークン検証フォールバック。
 * ローカルマシン時計のズレ (2026年など) で JWT の exp/iat 検証が失敗した場合や、
 * Admin SDK の初期化情報が不足している環境でも Firebase 本番サーバーに直接検証を委譲する。
 */
async function verifyTokenViaIdentityToolkit(token: string): Promise<{ email?: string; email_verified?: boolean } | null> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  if (!apiKey) return null

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token })
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    const user = data?.users?.[0]
    if (!user) return null
    return {
      email: user.email,
      email_verified: Boolean(user.emailVerified)
    }
  } catch (err) {
    console.warn('IdentityToolkit token lookup fallback failed:', err)
    return null
  }
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
    console.warn('Admin SDK verifyIdToken failed, attempting IdentityToolkit fallback:', error)
    const fallbackDecoded = await verifyTokenViaIdentityToolkit(token)
    if (fallbackDecoded) {
      if (!isAdminEmail(fallbackDecoded.email, fallbackDecoded.email_verified)) {
        return NextResponse.json({ error: '権限がありません' }, { status: 403 })
      }
      return null
    }

    console.error('ID token verification failed:', error)
    const detail = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: `認証に失敗しました (${detail})` },
      { status: 401 }
    )
  }
}

