import { describe, it, expect } from 'vitest'
import { defaultLicense } from '../lib/fallback-data'
import { GET as licenseGet } from '../app/api/license/route'
import { moveItemByAction } from '../lib/admin-utils'

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

describe('moveItemByAction utility', () => {
  const sampleItems = [
    { id: '1', name: 'First' },
    { id: '2', name: 'Second' },
    { id: '3', name: 'Third' }
  ]

  it('moves item up, down, top, and bottom accurately', () => {
    const upRes = moveItemByAction(sampleItems, '2', 'up')
    expect(upRes?.moved).toBe(true)
    expect(upRes?.items.map((x) => x.id)).toEqual(['2', '1', '3'])

    const downRes = moveItemByAction(sampleItems, '2', 'down')
    expect(downRes?.moved).toBe(true)
    expect(downRes?.items.map((x) => x.id)).toEqual(['1', '3', '2'])

    const topRes = moveItemByAction(sampleItems, '3', 'top')
    expect(topRes?.moved).toBe(true)
    expect(topRes?.items.map((x) => x.id)).toEqual(['3', '1', '2'])

    const bottomRes = moveItemByAction(sampleItems, '1', 'bottom')
    expect(bottomRes?.moved).toBe(true)
    expect(bottomRes?.items.map((x) => x.id)).toEqual(['2', '3', '1'])
  })

  it('returns moved: false when already at boundary and null when id not found', () => {
    const boundaryRes = moveItemByAction(sampleItems, '1', 'up')
    expect(boundaryRes?.moved).toBe(false)
    expect(boundaryRes?.items.map((x) => x.id)).toEqual(['1', '2', '3'])

    const missingRes = moveItemByAction(sampleItems, '999', 'up')
    expect(missingRes).toBeNull()
  })
})

