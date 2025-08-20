import { NextRequest, NextResponse } from 'next/server'
import { reorderSongs, getSongs } from '@/lib/firestore'


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

    // 現在のデータを取得
    const songs = await getSongs()
    
    // 対象の楽曲のインデックスを見つける
    const targetIndex = songs.findIndex(s => s.id === id)
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
        newIndex = Math.min(songs.length - 1, targetIndex + 1)
        break
      case 'top':
        newIndex = 0
        break
      case 'bottom':
        newIndex = songs.length - 1
        break
      default:
        return NextResponse.json(
          { error: '無効なactionです' },
          { status: 400 }
        )
    }

    // 要素を移動
    if (newIndex !== targetIndex) {
      const [movedItem] = songs.splice(targetIndex, 1)
      songs.splice(newIndex, 0, movedItem)

      // 新しい順序でFirestoreを更新
      const songIds = songs.map(song => song.id)
      await reorderSongs(songIds)
    }

    return NextResponse.json({
      message: '表示順が正常に変更されました',
      songs
    })
  } catch (error) {
    console.error('Error reordering songs:', error)
    return NextResponse.json(
      { error: '表示順の変更に失敗しました' },
      { status: 500 }
    )
  }
}