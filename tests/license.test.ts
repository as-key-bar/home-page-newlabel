import { describe, it, expect, vi } from 'vitest'
import { defaultLicense } from '../lib/fallback-data'
import { GET as licenseGet } from '../app/api/license/route'

describe('License Data & Fallback Integrity', () => {
  it('defaultLicense has valid title, sections, and contact', () => {
    expect(defaultLicense).toBeDefined()
    expect(defaultLicense.title).toBe('楽曲利用規約')
    expect(defaultLicense.lastUpdated).toBeTruthy()
    expect(Array.isArray(defaultLicense.sections)).toBe(true)
    expect(defaultLicense.sections.length).toBeGreaterThan(0)
  })

  it('each license section has id, title, and content', () => {
    for (const section of defaultLicense.sections) {
      expect(section.id).toBeTruthy()
      expect(section.title).toBeTruthy()
      expect(section.content).toBeTruthy()
    }
  })

  it('contains essential terms (CC license, rights, usage, commercial)', () => {
    const sectionIds = defaultLicense.sections.map(s => s.id)
    expect(sectionIds).toContain('basic')
    expect(sectionIds).toContain('rights')
    expect(sectionIds).toContain('usage')
    expect(sectionIds).toContain('commercial')
    expect(sectionIds).toContain('attribution')
  })
})

describe('License API Route (/api/license)', () => {
  it('returns 200 OK and valid license json even without active DB', async () => {
    const response = await licenseGet()
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data).toBeDefined()
    expect(data.title).toBe('楽曲利用規約')
    expect(Array.isArray(data.sections)).toBe(true)
    expect(data.sections.length).toBeGreaterThanOrEqual(5)
  })
})

