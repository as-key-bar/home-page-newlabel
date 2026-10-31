import { NextRequest, NextResponse } from 'next/server'
import { getSongsAdmin, reorderSongs } from '@/lib/firestore-admin'
import { requireAdmin } from '@/lib/admin-auth'
import { moveItemByAction, ReorderAction } from '@/lib/admin-utils'

const VALID_ACTIONS: ReorderAction[] = ['up', 'down', 'top', 'bottom']

// 表示順変更
export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request)
  if (denied) return denied

  try {
    const { id, action } = await request.json()

    if (!id || !action) {
      return NextResponse.json(
        { error: 'IDとactionが必要です' },
        { status: 400 }
      )
    }

    if (!VALID_ACTIONS.includes(action)) {
      return NextResponse.json(
        { error: '無効なactionです' },
        { status: 400 }
      )
    }

    const songs = await getSongsAdmin()
    const result = moveItemByAction(songs, id, action)
    if (!result) {
      return NextResponse.json(
        { error: '指定された楽曲が見つかりません' },
        { status: 404 }
      )
    }

    if (result.moved) {
      await reorderSongs(result.items.map((song) => song.id))
    }

    return NextResponse.json({
      message: '表示順が正常に変更されました',
      songs: result.items
    })
  } catch (error) {
    console.error('Error reordering songs:', error)
    return NextResponse.json(
      { error: '表示順の変更に失敗しました' },
      { status: 500 }
    )
  }
}
