const { initializeApp, cert } = require('firebase-admin/app')
const fs = require('fs')
const path = require('path')

async function verifyProjectId() {
  console.log('🔍 プロジェクトID確認診断\n')
  
  // 1. スクリプト内のプロジェクトID
  const scriptProjectId = 'home-page-newlabel'
  console.log(`1. スクリプト内のプロジェクトID: ${scriptProjectId}`)
  
  // 2. サービスアカウントキーのプロジェクトID
  const serviceAccountPath = path.join(__dirname, '..', 'service-account-key.json')
  console.log(`2. サービスアカウントキーパス: ${serviceAccountPath}`)
  
  if (fs.existsSync(serviceAccountPath)) {
    try {
      const serviceAccount = require(serviceAccountPath)
      console.log(`   サービスアカウントのプロジェクトID: ${serviceAccount.project_id}`)
      console.log(`   サービスアカウントのクライアントメール: ${serviceAccount.client_email}`)
      console.log(`   サービスアカウントのタイプ: ${serviceAccount.type}`)
      
      // 3. プロジェクトIDの一致確認
      if (scriptProjectId === serviceAccount.project_id) {
        console.log('✅ プロジェクトIDが一致しています')
      } else {
        console.log('❌ プロジェクトIDが一致していません')
        console.log(`   スクリプト: ${scriptProjectId}`)
        console.log(`   サービスアカウント: ${serviceAccount.project_id}`)
      }
      
      // 4. Firebase Admin初期化テスト
      console.log('\n3. Firebase Admin初期化テスト:')
      try {
        const app = initializeApp({
          credential: cert(serviceAccount),
          projectId: serviceAccount.project_id // サービスアカウントキーのプロジェクトIDを使用
        })
        console.log('✅ Firebase Admin初期化成功')
        console.log(`   使用プロジェクトID: ${serviceAccount.project_id}`)
        
        // 5. Firestore接続テスト
        const { getFirestore } = require('firebase-admin/firestore')
        
        // データベース名を明示的に指定（デフォルトは '(default)'）
        const databaseId = '(default)'
        const db = getFirestore(app, databaseId)
        console.log('✅ Firestore接続成功')
        console.log(`   使用データベースID: ${databaseId}`)
        
        // 6. 最小限の操作テスト
        console.log('\n4. Firestore操作テスト:')
        try {
          // listCollections()は最も安全な操作
          const collections = await db.listCollections()
          console.log('✅ コレクション一覧取得成功')
          console.log(`   既存コレクション数: ${collections.length}`)
          if (collections.length > 0) {
            console.log('   コレクション名:')
            collections.forEach((col, index) => {
              console.log(`     ${index + 1}. ${col.id}`)
            })
          }
        } catch (error) {
          console.log('❌ Firestore操作エラー:')
          console.log(`   エラーコード: ${error.code}`)
          console.log(`   エラーメッセージ: ${error.message}`)
          
          if (error.code === 5) {
            console.log('\n⚠️  エラーコード5 (NOT_FOUND)の可能性のある原因:')
            console.log('   - Firestoreデータベースが作成されていない')
            console.log('   - プロジェクトが存在しない、または削除されている')
            console.log('   - サービスアカウントに適切な権限がない')
            console.log('   - データベースが別のリージョンに作成されている')
          }
        }
        
      } catch (error) {
        console.log('❌ Firebase Admin初期化エラー:')
        console.log(`   ${error.message}`)
      }
      
    } catch (error) {
      console.log('❌ サービスアカウントキー読み込みエラー:')
      console.log(`   ${error.message}`)
    }
  } else {
    console.log('❌ サービスアカウントキーが見つかりません')
  }
}

verifyProjectId().catch(console.error)