import { NextRequest, NextResponse } from 'next/server'
import { getMoviesAdmin, reorderMovies } from '@/lib/firestore-admin'
import { requireAdmin } from '@/lib/admin-auth'
import { moveItemByAction, ReorderAction } from '@/lib/admin-utils'

const VALID_ACTIONS: ReorderAction[] = ['up', 'down', 'top', 'bottom']

// 動画の表示順変更
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

    const movies = await getMoviesAdmin()
    const result = moveItemByAction(movies, id, action)
    if (!result) {
      return NextResponse.json(
        { error: '指定された動画が見つかりません' },
        { status: 404 }
      )
    }

    if (!result.moved) {
      return NextResponse.json({ message: '順序に変更はありません' })
    }

    await reorderMovies(result.items.map((m) => m.id))

    return NextResponse.json({ message: '表示順が正常に更新されました' })
  } catch (error) {
    console.error('Error reordering movies:', error)
    return NextResponse.json(
      { error: '表示順の更新に失敗しました' },
      { status: 500 }
    )
  }
}
