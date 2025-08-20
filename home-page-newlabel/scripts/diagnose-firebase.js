const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const fs = require('fs')
const path = require('path')

// 診断用スクリプト
async function diagnoseFirebase() {
  console.log('🔍 Firebase接続診断を開始...\n')
  
  // 1. サービスアカウントキーの確認
  const serviceAccountPath = path.join(__dirname, '..', 'service-account-key.json')
  console.log('1. サービスアカウントキー確認:')
  console.log(`   パス: ${serviceAccountPath}`)
  console.log(`   存在: ${fs.existsSync(serviceAccountPath)}`)
  
  if (fs.existsSync(serviceAccountPath)) {
    try {
      const serviceAccount = require(serviceAccountPath)
      console.log(`   プロジェクトID: ${serviceAccount.project_id}`)
      console.log(`   クライアントメール: ${serviceAccount.client_email}`)
      console.log(`   キーID: ${serviceAccount.private_key_id}`)
    } catch (error) {
      console.log(`   ❌ キー読み込みエラー: ${error.message}`)
      return
    }
  } else {
    console.log('   ❌ サービスアカウントキーが見つかりません')
    return
  }
  
  console.log('\n2. Firebase Admin初期化:')
  try {
    const serviceAccount = require(serviceAccountPath)
    const app = initializeApp({
      credential: cert(serviceAccount),
      projectId: 'home-page-newlabel'
    })
    console.log('   ✅ 初期化成功')
    
    // 3. Firestore接続テスト
    console.log('\n3. Firestore接続テスト:')
    const db = getFirestore(app)
    
    // 4. 単純な読み取りテスト
    console.log('\n4. 単純な読み取りテスト:')
    try {
      // 存在しないコレクションへの安全なアクセス
      const testRef = db.collection('test-connection')
      const snapshot = await testRef.limit(1).get()
      console.log('   ✅ 読み取りテスト成功')
      console.log(`   コレクションサイズ: ${snapshot.size}`)
    } catch (error) {
      console.log(`   ❌ 読み取りテストエラー: ${error.message}`)
      console.log(`   エラーコード: ${error.code}`)
      console.log(`   詳細: ${JSON.stringify(error.details || {})}`)
    }
    
    // 5. 書き込みテスト
    console.log('\n5. 書き込みテスト:')
    try {
      const testRef = db.collection('test-connection').doc('test-doc')
      await testRef.set({
        timestamp: new Date(),
        message: 'Firebase接続テスト'
      })
      console.log('   ✅ 書き込みテスト成功')
      
      // テストドキュメントを削除
      await testRef.delete()
      console.log('   ✅ テストドキュメント削除完了')
    } catch (error) {
      console.log(`   ❌ 書き込みテストエラー: ${error.message}`)
      console.log(`   エラーコード: ${error.code}`)
    }
    
  } catch (error) {
    console.log(`   ❌ 初期化エラー: ${error.message}`)
  }
}

diagnoseFirebase().catch(console.error)