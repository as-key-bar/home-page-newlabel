import { NextRequest, NextResponse } from 'next/server'
import { getSongs, addSong, updateSong, deleteSong, Song } from '@/lib/firestore'


// 全曲取得
export async function GET() {
  try {
    const songs = await getSongs()
    return NextResponse.json({ songs })
  } catch (error) {
    console.error('Error getting songs:', error)
    return NextResponse.json(
      { error: '楽曲データの取得に失敗しました' },
      { status: 500 }
    )
  }
}

// 新規追加
export async function POST(request: NextRequest) {
  try {
    const newSongData = await request.json()
    const song = await addSong(newSongData)
    
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
    const { id, ...updates } = await request.json()
    
    if (!id) {
      return NextResponse.json(
        { error: 'IDが指定されていません' },
        { status: 400 }
      )
    }
    
    await updateSong(id, updates)
    
    return NextResponse.json({ 
      message: '楽曲が正常に更新されました'
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
    
    await deleteSong(id)
    
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