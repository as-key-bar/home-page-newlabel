import { getApps, initializeApp, cert, applicationDefault, App } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

/**
 * サーバー専用の Firebase Admin SDK 初期化。
 *
 * 認証情報は次の優先順で解決する:
 *  1. FIREBASE_SERVICE_ACCOUNT_KEY (サービスアカウント JSON 文字列)
 *  2. GOOGLE_APPLICATION_CREDENTIALS 等の Application Default Credentials
 *
 * ID トークン検証のみなら projectId だけで動作するが、
 * Firestore への書き込みには上記いずれかの認証情報が必要。
 */
function getAdminApp(): App {
  const existing = getApps()[0]
  if (existing) return existing

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY

  if (rawKey) {
    return initializeApp({ credential: cert(JSON.parse(rawKey)), projectId })
  }
  return initializeApp({ credential: applicationDefault(), projectId })
}

export function getAdminAuth() {
  return getAuth(getAdminApp())
}

export function getAdminDb() {
  return getFirestore(getAdminApp())
}

