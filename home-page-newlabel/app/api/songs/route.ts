import { NextResponse } from 'next/server'
import { parse } from 'csv-parse/sync'
import { readFileSync } from 'fs'
import { join } from 'path'

export interface Song {
  title: string
  artist: string
  album: string
  releaseDate: string
  genre: string
  duration: string
  streamingUrl: string
  downloadUrl: string
  description: string
  tags: string
  originalTracks: string
}

export async function GET() {
  try {
    const csvPath = join(process.cwd(), '..', 'data', 'songs.csv')
    const csvContent = readFileSync(csvPath, 'utf-8')
    
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
    }) as Song[]
    
    return NextResponse.json(records)
  } catch (error) {
    console.error('Error reading CSV:', error)
    return NextResponse.json({ error: 'Failed to load songs' }, { status: 500 })
  }
}