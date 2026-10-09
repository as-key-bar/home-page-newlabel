import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// 例外を投げるモックは vi.fn だとテスト失敗として扱われるため、素の関数に委譲する
let verifyImpl: (token: string) => Promise<unknown> = async () => ({})
vi.mock('@/lib/firebase-admin', () => ({
  getAdminAuth: () => ({ verifyIdToken: (token: string) => verifyImpl(token) }),
}))

import { requireAdmin, extractBearerToken, isAdminEmail } from '@/lib/admin-auth'

const req = (authorization?: string) =>
  new NextRequest('http://localhost/api/songs', {
    method: 'POST',
    headers: authorization ? { authorization } : {},
  })

describe('extractBearerToken', () => {
  it('Bearer トークンを取り出す', () => {
    expect(extractBearerToken('Bearer abc')).toBe('abc')
    expect(extractBearerToken('bearer abc')).toBe('abc')
  })
  it('不正な形式は null', () => {
    expect(extractBearerToken(null)).toBeNull()
    expect(extractBearerToken('Basic abc')).toBeNull()
  })
})

describe('isAdminEmail', () => {
  it('許可メールかつ認証済みのみ true', () => {
    expect(isAdminEmail('askeybar.official@gmail.com', true)).toBe(true)
    expect(isAdminEmail('askeybar.official@gmail.com', false)).toBe(false)
    expect(isAdminEmail('other@example.com', true)).toBe(false)
    expect(isAdminEmail(undefined, true)).toBe(false)
  })
})

describe('requireAdmin', () => {
  beforeEach(() => {
    verifyImpl = async () => ({})
  })

  it('トークンなしは 401', async () => {
    const res = await requireAdmin(req())
    expect(res?.status).toBe(401)
  })

  it('検証失敗は 401', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    verifyImpl = async () => {
      throw new Error('bad')
    }
    const res = await requireAdmin(req('Bearer x'))
    expect(res?.status).toBe(401)
  })

  it('管理者以外は 403', async () => {
    verifyImpl = async () => ({ email: 'other@example.com', email_verified: true })
    const res = await requireAdmin(req('Bearer x'))
    expect(res?.status).toBe(403)
  })

  it('管理者は null (許可)', async () => {
    verifyImpl = async () => ({ email: 'askeybar.official@gmail.com', email_verified: true })
    const res = await requireAdmin(req('Bearer x'))
    expect(res).toBeNull()
  })
})

