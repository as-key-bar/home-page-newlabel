import { NextRequest, NextResponse } from 'next/server'
import { getDesignsAdmin, addDesign, updateDesign, deleteDesign } from '@/lib/firestore-admin'
import { requireAdmin } from '@/lib/admin-auth'

// 全デザイン実績取得（公開用・管理用兼用、フォールバック付き）
export async function GET() {
  try {
    const designs = await getDesignsAdmin()
    return NextResponse.json({ designs })
  } catch (error) {
    console.error('Error getting designs:', error)
    const { defaultDesigns } = await import('@/lib/fallback-data')
    return NextResponse.json({ designs: defaultDesigns })
  }
}

// 新規追加
export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request)
  if (denied) return denied

  try {
    const data = await request.json()
    const design = await addDesign(data)
    return NextResponse.json({
      message: 'デザイン実績が正常に追加されました',
      design
    })
  } catch (error) {
    console.error('Error adding design:', error)
    return NextResponse.json(
      { error: 'デザイン実績の追加に失敗しました' },
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

    await updateDesign(id, updates)
    return NextResponse.json({
      message: 'デザイン実績が正常に更新されました'
    })
  } catch (error) {
    console.error('Error updating design:', error)
    return NextResponse.json(
      { error: 'デザイン実績の更新に失敗しました' },
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

    await deleteDesign(id)
    return NextResponse.json({
      message: 'デザイン実績が正常に削除されました'
    })
  } catch (error) {
    console.error('Error deleting design:', error)
    return NextResponse.json(
      { error: 'デザイン実績の削除に失敗しました' },
      { status: 500 }
    )
  }
}

