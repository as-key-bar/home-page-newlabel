import { NextRequest, NextResponse } from 'next/server'
import { getMoviesAdmin, addMovie, updateMovie, deleteMovie } from '@/lib/firestore-admin'
import { requireAdmin } from '@/lib/admin-auth'

// 全動画実績取得（公開用・管理用兼用、フォールバック付き）
export async function GET() {
  try {
    const movies = await getMoviesAdmin()
    return NextResponse.json({ movies })
  } catch (error) {
    console.error('Error getting movies:', error)
    const { defaultMovies } = await import('@/lib/fallback-data')
    return NextResponse.json({ movies: defaultMovies })
  }
}

// 新規追加
export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request)
  if (denied) return denied

  try {
    const data = await request.json()
    const movie = await addMovie(data)
    return NextResponse.json({
      message: '動画実績が正常に追加されました',
      movie
    })
  } catch (error) {
    console.error('Error adding movie:', error)
    return NextResponse.json(
      { error: '動画実績の追加に失敗しました' },
      { status: 500 }
    )
  }
}

// 更新
export async function PUT(request: NextRequest) {
  const denied = await requireAdmin(request)
  if (denied) return denied

  try {
    const { id, ...updates } = await request.json()
    if (!id) {
      return NextResponse.json(
        { error: 'IDが指定されていません' },
        { status: 400 }
      )
    }

    await updateMovie(id, updates)
    return NextResponse.json({
      message: '動画実績が正常に更新されました'
    })
  } catch (error) {
    console.error('Error updating movie:', error)
    return NextResponse.json(
      { error: '動画実績の更新に失敗しました' },
      { status: 500 }
    )
  }
}

// 削除
export async function DELETE(request: NextRequest) {
  const denied = await requireAdmin(request)
  if (denied) return denied

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json(
        { error: 'IDが指定されていません' },
        { status: 400 }
      )
    }

    await deleteMovie(id)
    return NextResponse.json({
      message: '動画実績が正常に削除されました'
    })
  } catch (error) {
    console.error('Error deleting movie:', error)
    return NextResponse.json(
      { error: '動画実績の削除に失敗しました' },
      { status: 500 }
    )
  }
}

