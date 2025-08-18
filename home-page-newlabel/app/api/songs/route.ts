import { NextResponse } from 'next/server'
import { parse } from 'csv-parse/sync'
import { readFileSync } from 'fs'
import { join } from 'path'

export interface Song {
  id: number
  title: string
  releaseDate: string
  genre: string
  description: string
  originalTracks: string
  audioPath: string
  coverImagePath: string
  visible: boolean
}

export async function GET() {
  try {
    const csvPath = join(process.cwd(), '..', 'data', 'songs.csv')
    const csvContent = readFileSync(csvPath, 'utf-8')
    
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
    })
    
    // CSVから読み込んだデータの型変換
    const songs: Song[] = records.map((record: any) => ({
      id: parseInt(record.id),
      title: record.title,
      releaseDate: record.releaseDate,
      genre: record.genre,
      description: record.description,
      originalTracks: record.originalTracks,
      audioPath: record.audioPath,
      coverImagePath: record.coverImagePath,
      visible: record.visible === 'true' || record.visible === true
    }))
    
    return NextResponse.json(songs)
  } catch (error) {
    console.error('Error reading CSV:', error)
    return NextResponse.json({ error: 'Failed to load songs' }, { status: 500 })
  }
}