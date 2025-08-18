import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const ALLOWED_AUDIO_TYPES = [
  'audio/wav', 'audio/wave', 'audio/x-wav',
  'audio/mp3', 'audio/mpeg',
  'audio/flac', 'audio/x-flac',
  'audio/aac', 'audio/mp4',
  'audio/ogg', 'audio/vorbis'
]
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'ファイルが選択されていません' },
        { status: 400 }
      )
    }
    
    // ファイルサイズチェック
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'ファイルサイズが大きすぎます（最大50MB）' },
        { status: 400 }
      )
    }
    
    // ファイル形式チェック
    if (!ALLOWED_AUDIO_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: '対応していない音声形式です（WAV, MP3, FLAC, AAC, OGGのみ）' },
        { status: 400 }
      )
    }
    
    // ファイル名を安全な形式に変換
    const timestamp = Date.now()
    const fileExtension = path.extname(file.name)
    const safeName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    
    // 保存先ディレクトリを確保
    const uploadDir = path.join(process.cwd(), 'public', 'audio')
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch (error) {
      // ディレクトリが既に存在する場合は無視
    }
    
    // ファイルを保存
    const filePath = path.join(uploadDir, safeName)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    await writeFile(filePath, buffer)
    
    // 公開パスを生成
    const publicPath = `/audio/${safeName}`
    
    return NextResponse.json({
      message: '音声ファイルが正常にアップロードされました',
      filePath: publicPath,
      fileName: safeName,
      originalName: file.name,
      size: file.size,
      type: file.type
    })
    
  } catch (error) {
    console.error('Audio upload error:', error)
    return NextResponse.json(
      { error: '音声ファイルのアップロードに失敗しました' },
      { status: 500 }
    )
  }
}