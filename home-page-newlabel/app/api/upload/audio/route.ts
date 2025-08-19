import { NextRequest, NextResponse } from 'next/server'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { initializeApp } from 'firebase/app'

const ALLOWED_AUDIO_TYPES = [
  'audio/wav', 'audio/wave', 'audio/x-wav',
  'audio/mp3', 'audio/mpeg',
  'audio/flac', 'audio/x-flac',
  'audio/aac', 'audio/mp4',
  'audio/ogg', 'audio/vorbis'
]
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

// Firebase設定
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
}

const app = initializeApp(firebaseConfig)
const storage = getStorage(app)

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
    const fileExtension = file.name.split('.').pop() || ''
    const safeName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    
    // Firebase Storageにアップロード
    const storageRef = ref(storage, `audio/${safeName}`)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    const snapshot = await uploadBytes(storageRef, buffer, {
      contentType: file.type
    })
    
    // ダウンロードURLを取得
    const downloadURL = await getDownloadURL(snapshot.ref)
    
    return NextResponse.json({
      message: '音声ファイルが正常にアップロードされました',
      filePath: downloadURL,
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