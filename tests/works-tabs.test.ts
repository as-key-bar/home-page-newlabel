import { describe, it, expect } from 'vitest'
import { extractYoutubeId, getYoutubeEmbedUrl } from '../lib/youtube'
import { defaultMovies, defaultDesigns } from '../lib/fallback-data'
import { GET as moviesGet } from '../app/api/movies/route'
import { GET as designsGet } from '../app/api/designs/route'

describe('YouTube Utility (extractYoutubeId & getYoutubeEmbedUrl)', () => {
  it('correctly extracts 11-char video ID from various YouTube URLs', () => {
    // 通常の watch URL
    expect(extractYoutubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    // パラメータ付き watch URL
    expect(extractYoutubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=120s')).toBe('dQw4w9WgXcQ')
    // 短縮 youtu.be URL
    expect(extractYoutubeId('https://youtu.be/dQw4w9WgXcQ?si=abcdef12345')).toBe('dQw4w9WgXcQ')
    // embed URL
    expect(extractYoutubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    // shorts URL
    expect(extractYoutubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    // 直接ID
    expect(extractYoutubeId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('generates secure embed URL', () => {
    expect(getYoutubeEmbedUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0'
    )
  })

  it('returns null for invalid or empty input', () => {
    expect(extractYoutubeId('')).toBeNull()
    expect(extractYoutubeId(null)).toBeNull()
    expect(extractYoutubeId(undefined)).toBeNull()
    expect(extractYoutubeId('https://example.com')).toBeNull()
  })
})

describe('Fallback Data for Works Tabs (Movies & Designs)', () => {
  it('defaultMovies has valid items with youtubeUrl and description', () => {
    expect(defaultMovies).toBeDefined()
    expect(Array.isArray(defaultMovies)).toBe(true)
    expect(defaultMovies.length).toBeGreaterThan(0)

    for (const movie of defaultMovies) {
      expect(movie.id).toBeTruthy()
      expect(movie.title).toBeTruthy()
      expect(movie.youtubeUrl).toBeTruthy()
      expect(movie.description).toBeTruthy()
      expect(movie.visible).toBe(true)
    }
  })

  it('defaultDesigns has valid items with imagePath and description', () => {
    expect(defaultDesigns).toBeDefined()
    expect(Array.isArray(defaultDesigns)).toBe(true)
    expect(defaultDesigns.length).toBeGreaterThan(0)

    for (const design of defaultDesigns) {
      expect(design.id).toBeTruthy()
      expect(design.title).toBeTruthy()
      expect(design.imagePath).toBeTruthy()
      expect(design.description).toBeTruthy()
      expect(design.visible).toBe(true)
    }
  })
})

describe('Works Tabs API Routes', () => {
  it('/api/movies returns 200 OK and array of movie items', async () => {
    const res = await moviesGet()
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data).toBeDefined()
    expect(Array.isArray(data.movies)).toBe(true)
    expect(data.movies.length).toBeGreaterThanOrEqual(1)
  })

  it('/api/designs returns 200 OK and array of design items', async () => {
    const res = await designsGet()
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data).toBeDefined()
    expect(Array.isArray(data.designs)).toBe(true)
    expect(data.designs.length).toBeGreaterThanOrEqual(1)
  })
})

