import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { parse } from 'csv-parse/sync'

const CSV_PATH = path.join(process.cwd(), '../data/songs.csv')

export interface Song {
  id: string
  title: string
  releaseDate: string
  genre: string
  description: string
  originalTracks: string
  audioPath: string
  coverImagePath: string
  visible: string
}

// CSV形式に変換するヘルパー関数
function escapeCSVField(field: string): string {
  // 空文字の場合はそのまま返す
  if (!field) return ''
  
  // カンマ、改行、ダブルクォートが含まれる場合はクォートで囲む
  if (field.includes(',') || field.includes('"') || field.includes('\n') || field.includes('\r')) {
    return `"${field.replace(/"/g, '""')}"`
  }
  return field
}

function songToCSVRow(song: Song): string {
  return [
    song.id,
    escapeCSVField(song.title),
    escapeCSVField(song.releaseDate),
    escapeCSVField(song.genre),
    escapeCSVField(song.description),
    escapeCSVField(song.originalTracks),
    escapeCSVField(song.audioPath),
    escapeCSVField(song.coverImagePath),
    song.visible
  ].join(',')
}

// 全曲取得
export async function GET() {
  try {
    const csvContent = await fs.readFile(CSV_PATH, 'utf-8')
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    })
    
    return NextResponse.json({ songs: records })
  } catch (error) {
    console.error('Error reading CSV file:', error)
    return NextResponse.json(
      { error: 'CSVファイルの読み込みに失敗しました' },
      { status: 500 }
    )
  }
}

// 新規追加
export async function POST(request: NextRequest) {
  try {
    const newSong: Omit<Song, 'id'> = await request.json()
    
    // 現在のデータを読み込み
    const csvContent = await fs.readFile(CSV_PATH, 'utf-8')
    const records: Song[] = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    })
    
    // 新しいIDを生成（最大ID + 1）
    const maxId = Math.max(...records.map(r => parseInt(r.id) || 0), 0)
    const song: Song = {
      id: (maxId + 1).toString(),
      ...newSong
    }
    
    // 新しい行を追加
    records.push(song)
    
    // CSVを再構築
    const header = 'id,title,releaseDate,genre,description,originalTracks,audioPath,coverImagePath,visible'
    const csvRows = records.map(songToCSVRow)
    const newCsvContent = [header, ...csvRows].join('\n') + '\n'
    
    await fs.writeFile(CSV_PATH, newCsvContent, 'utf-8')
    
    return NextResponse.json({ 
      message: '楽曲が正常に追加されました',
      song 
    })
  } catch (error) {
    console.error('Error adding song:', error)
    return NextResponse.json(
      { error: '楽曲の追加に失敗しました' },
      { status: 500 }
    )
  }
}

// 更新
export async function PUT(request: NextRequest) {
  try {
    const updatedSong: Song = await request.json()
    
    // 現在のデータを読み込み
    const csvContent = await fs.readFile(CSV_PATH, 'utf-8')
    const records: Song[] = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    })
    
    // 対象の楽曲を見つけて更新
    const index = records.findIndex(r => r.id === updatedSong.id)
    if (index === -1) {
      return NextResponse.json(
        { error: '指定された楽曲が見つかりません' },
        { status: 404 }
      )
    }
    
    records[index] = updatedSong
    
    // CSVを再構築
    const header = 'id,title,releaseDate,genre,description,originalTracks,audioPath,coverImagePath,visible'
    const csvRows = records.map(songToCSVRow)
    const newCsvContent = [header, ...csvRows].join('\n') + '\n'
    
    await fs.writeFile(CSV_PATH, newCsvContent, 'utf-8')
    
    return NextResponse.json({ 
      message: '楽曲が正常に更新されました',
      song: updatedSong 
    })
  } catch (error) {
    console.error('Error updating song:', error)
    return NextResponse.json(
      { error: '楽曲の更新に失敗しました' },
      { status: 500 }
    )
  }
}

// 削除
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'IDが指定されていません' },
        { status: 400 }
      )
    }
    
    // 現在のデータを読み込み
    const csvContent = await fs.readFile(CSV_PATH, 'utf-8')
    const records: Song[] = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    })
    
    // 対象の楽曲を見つけて削除
    const initialLength = records.length
    const filteredRecords = records.filter(r => r.id !== id)
    
    if (filteredRecords.length === initialLength) {
      return NextResponse.json(
        { error: '指定された楽曲が見つかりません' },
        { status: 404 }
      )
    }
    
    // CSVを再構築
    const header = 'id,title,releaseDate,genre,description,originalTracks,audioPath,coverImagePath,visible'
    const csvRows = filteredRecords.map(songToCSVRow)
    const newCsvContent = [header, ...csvRows].join('\n') + '\n'
    
    await fs.writeFile(CSV_PATH, newCsvContent, 'utf-8')
    
    return NextResponse.json({ 
      message: '楽曲が正常に削除されました'
    })
  } catch (error) {
    console.error('Error deleting song:', error)
    return NextResponse.json(
      { error: '楽曲の削除に失敗しました' },
      { status: 500 }
    )
  }
}