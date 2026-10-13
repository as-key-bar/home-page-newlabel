import { NextRequest, NextResponse } from 'next/server'
import { getMoviesAdmin, reorderMovies } from '@/lib/firestore-admin'
import { requireAdmin } from '@/lib/admin-auth'

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

    const movies = await getMoviesAdmin()
    const targetIndex = movies.findIndex(m => m.id === id)
    if (targetIndex === -1) {
      return NextResponse.json(
        { error: '指定された動画が見つかりません' },
        { status: 404 }
      )
    }

    let newIndex = targetIndex
    switch (action) {
      case 'up':
        newIndex = Math.max(0, targetIndex - 1)
        break
      case 'down':
        newIndex = Math.min(movies.length - 1, targetIndex + 1)
        break
      case 'top':
        newIndex = 0
        break
      case 'bottom':
        newIndex = movies.length - 1
        break
      default:
        return NextResponse.json(
          { error: '無効なactionです' },
          { status: 400 }
        )
    }

    if (newIndex === targetIndex) {
      return NextResponse.json({ message: '順序に変更はありません' })
    }

    const newMovies = [...movies]
    const [moved] = newMovies.splice(targetIndex, 1)
    newMovies.splice(newIndex, 0, moved)

    await reorderMovies(newMovies.map(m => m.id))

    return NextResponse.json({ message: '表示順が正常に更新されました' })
  } catch (error) {
    console.error('Error reordering movies:', error)
    return NextResponse.json(
      { error: '表示順の更新に失敗しました' },
      { status: 500 }
    )
  }
}

