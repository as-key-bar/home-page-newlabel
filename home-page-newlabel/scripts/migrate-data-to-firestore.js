const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const fs = require('fs')
const path = require('path')
const { parse } = require('csv-parse/sync')

// Firebase Admin初期化
const projectId = 'home-page-newlabel'

// サービスアカウントキーのパスを指定
const serviceAccountPath = path.join(__dirname, '..', 'service-account-key.json')

let app
try {
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath)
    app = initializeApp({
      credential: cert(serviceAccount),
      projectId: projectId,
      databaseURL: `https://${projectId}-default-rtdb.firebaseio.com/`
    })
    console.log('✅ サービスアカウントキーで認証しました')
  } else {
    // デフォルト認証を試行
    app = initializeApp({
      projectId: projectId
    })
    console.log('⚠️ デフォルト認証を使用します')
  }
} catch (error) {
  console.error('❌ Firebase初期化エラー:', error.message)
  process.exit(1)
}

// Firestoreの設定を明示的に指定
const db = getFirestore(app, '(default)')

async function migrateSongs() {
  try {
    console.log('🎵 楽曲データをFirestoreに移行中...')
    
    // CSV読み込み
    const csvPath = path.join(process.cwd(), '..', '..', 'data', 'songs.csv')
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    const songs = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    })

    // songs コレクションに移行
    for (const song of songs) {
      const songData = {
        id: song.id,
        order: parseInt(song.楽曲表示順) || 0,
        title: song.title,
        releaseDate: song.releaseDate,
        genre: song.genre,
        description: song.description,
        originalTracks: song.originalTracks,
        audioPath: song.audioPath,
        coverImagePath: song.coverImagePath,
        visible: song.visible === 'true',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await db.collection('songs').doc(song.id).set(songData)
      console.log(`✅ 楽曲「${song.title}」を移行完了`)
    }

    console.log(`🎵 楽曲データ移行完了: ${songs.length}件`)
  } catch (error) {
    console.error('❌ 楽曲データ移行エラー:', error)
  }
}

async function migrateLicense() {
  try {
    console.log('📄 ライセンスデータをFirestoreに移行中...')
    
    // license.json読み込み
    const licensePath = path.join(process.cwd(), '..', '..', 'data', 'license.json')
    const licenseData = JSON.parse(fs.readFileSync(licensePath, 'utf-8'))

    // license ドキュメントに移行
    await db.collection('settings').doc('license').set({
      ...licenseData,
      updatedAt: new Date()
    })

    console.log('✅ ライセンスデータ移行完了')
  } catch (error) {
    console.error('❌ ライセンスデータ移行エラー:', error)
  }
}

async function migrateProfile() {
  try {
    console.log('👤 プロフィールデータをFirestoreに移行中...')
    
    // profile.json読み込み
    const profilePath = path.join(process.cwd(), '..', '..', 'data', 'profile.json')
    const profileData = JSON.parse(fs.readFileSync(profilePath, 'utf-8'))

    // profile ドキュメントに移行
    await db.collection('settings').doc('profile').set({
      ...profileData,
      updatedAt: new Date()
    })

    console.log('✅ プロフィールデータ移行完了')
  } catch (error) {
    console.error('❌ プロフィールデータ移行エラー:', error)
  }
}

async function checkExistingData() {
  try {
    console.log('🔍 既存データを確認中...')
    
    // 既存の楽曲データをチェック
    const songsSnapshot = await db.collection('songs').get()
    console.log(`📊 既存楽曲データ: ${songsSnapshot.size}件`)
    
    // 既存の設定データをチェック
    const settingsSnapshot = await db.collection('settings').get()
    console.log(`⚙️  既存設定データ: ${settingsSnapshot.size}件`)
    
    if (songsSnapshot.size > 0 || settingsSnapshot.size > 0) {
      console.log('⚠️  既存データが存在します。上書きしますか？')
      return true
    }
    
    return false
  } catch (error) {
    console.error('❌ データ確認エラー:', error)
    return false
  }
}

async function main() {
  try {
    console.log('🚀 データ移行を開始します...')
    console.log('Firebase Project:', projectId)
    
    // 既存データ確認
    await checkExistingData()
    
    // 移行実行
    await migrateSongs()
    await migrateLicense()
    await migrateProfile()
    
    console.log('🎉 全データの移行が完了しました！')
  } catch (error) {
    console.error('❌ 移行処理エラー:', error)
    process.exit(1)
  }
}

// スクリプト実行
main()