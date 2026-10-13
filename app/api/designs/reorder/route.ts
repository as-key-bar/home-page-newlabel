import { NextRequest, NextResponse } from 'next/server'
import { getDesignsAdmin, reorderDesigns } from '@/lib/firestore-admin'
import { requireAdmin } from '@/lib/admin-auth'

// デザインの表示順変更
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

    const designs = await getDesignsAdmin()
    const targetIndex = designs.findIndex(d => d.id === id)
    if (targetIndex === -1) {
      return NextResponse.json(
        { error: '指定されたデザインが見つかりません' },
        { status: 404 }
      )
    }

    let newIndex = targetIndex
    switch (action) {
      case 'up':
        newIndex = Math.max(0, targetIndex - 1)
        break
      case 'down':
        newIndex = Math.min(designs.length - 1, targetIndex + 1)
        break
      case 'top':
        newIndex = 0
        break
      case 'bottom':
        newIndex = designs.length - 1
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

    const newDesigns = [...designs]
    const [moved] = newDesigns.splice(targetIndex, 1)
    newDesigns.splice(newIndex, 0, moved)

    await reorderDesigns(newDesigns.map(d => d.id))

    return NextResponse.json({ message: '表示順が正常に更新されました' })
  } catch (error) {
    console.error('Error reordering designs:', error)
    return NextResponse.json(
      { error: '表示順の更新に失敗しました' },
      { status: 500 }
    )
  }
}

