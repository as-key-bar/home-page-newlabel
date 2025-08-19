import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { parse } from 'csv-parse/sync'
import { Song } from '../route'

const CSV_PATH = path.join(process.cwd(), '../data/songs.csv')

function escapeCSVField(field: string): string {
  if (!field) return ''
  if (field.includes(',') || field.includes('"') || field.includes('\n') || field.includes('\r')) {
    return `"${field.replace(/"/g, '""')}"`
  }
  return field
}

function songToCSVRow(song: Song): string {
  return [
    song.id,
    song.楽曲表示順,
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

// 表示順変更
export async function POST(request: NextRequest) {
  try {
    const { id, action } = await request.json()
    
    if (!id || !action) {
      return NextResponse.json(
        { error: 'IDとactionが必要です' },
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

    // 楽曲表示順でソート
    const sortedRecords = records.sort((a: Song, b: Song) => {
      const orderA = parseInt(a.楽曲表示順) || 0
      const orderB = parseInt(b.楽曲表示順) || 0
      return orderA - orderB
    })

    // 対象の楽曲のインデックスを見つける
    const targetIndex = sortedRecords.findIndex(r => r.id === id)
    if (targetIndex === -1) {
      return NextResponse.json(
        { error: '指定された楽曲が見つかりません' },
        { status: 404 }
      )
    }

    let newIndex = targetIndex
    
    switch (action) {
      case 'up':
        newIndex = Math.max(0, targetIndex - 1)
        break
      case 'down':
        newIndex = Math.min(sortedRecords.length - 1, targetIndex + 1)
        break
      case 'top':
        newIndex = 0
        break
      case 'bottom':
        newIndex = sortedRecords.length - 1
        break
      default:
        return NextResponse.json(
          { error: '無効なactionです' },
          { status: 400 }
        )
    }

    // 要素を移動
    if (newIndex !== targetIndex) {
      const [movedItem] = sortedRecords.splice(targetIndex, 1)
      sortedRecords.splice(newIndex, 0, movedItem)

      // 表示順を再設定
      sortedRecords.forEach((song, index) => {
        song.楽曲表示順 = (index + 1).toString()
      })
    }

    // CSVを再構築
    const header = 'id,楽曲表示順,title,releaseDate,genre,description,originalTracks,audioPath,coverImagePath,visible'
    const csvRows = sortedRecords.map(songToCSVRow)
    const newCsvContent = [header, ...csvRows].join('\n') + '\n'

    await fs.writeFile(CSV_PATH, newCsvContent, 'utf-8')

    return NextResponse.json({
      message: '表示順が正常に変更されました',
      songs: sortedRecords
    })
  } catch (error) {
    console.error('Error reordering songs:', error)
    return NextResponse.json(
      { error: '表示順の変更に失敗しました' },
      { status: 500 }
    )
  }
}