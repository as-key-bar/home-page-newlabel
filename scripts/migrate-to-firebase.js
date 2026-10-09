#!/usr/bin/env node

const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const fs = require('fs');
const path = require('path');

// Firebase設定
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
};

// Firebase初期化
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

// アップロード関数
async function uploadFile(localPath, remotePath) {
  try {
    console.log(`📤 アップロード中: ${path.basename(localPath)} -> ${remotePath}`);
    
    const fileBuffer = fs.readFileSync(localPath);
    const storageRef = ref(storage, remotePath);
    
    const snapshot = await uploadBytes(storageRef, fileBuffer, {
      contentType: getContentType(localPath)
    });
    
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log(`✅ アップロード完了: ${downloadURL}`);
    return {
      localPath,
      remotePath,
      downloadURL,
      size: fileBuffer.length
    };
  } catch (error) {
    console.error(`❌ アップロード失敗: ${localPath}`, error.message);
    throw error;
  }
}

// ファイル拡張子からContent-Typeを取得
function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// ディレクトリを再帰的にスキャン
function scanFiles(dir, baseRemotePath = '') {
  const files = [];
  
  if (!fs.existsSync(dir)) {
    console.log(`⚠️  ディレクトリが存在しません: ${dir}`);
    return files;
  }
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const localPath = path.join(dir, item);
    const stat = fs.statSync(localPath);
    
    if (stat.isDirectory()) {
      // 再帰的にサブディレクトリを処理
      files.push(...scanFiles(localPath, path.join(baseRemotePath, item)));
    } else {
      // ファイルの場合
      const ext = path.extname(item).toLowerCase();
      const isMediaFile = ['.wav', '.mp3', '.jpg', '.jpeg', '.png', '.gif'].includes(ext);
      
      if (isMediaFile) {
        const remotePath = path.join(baseRemotePath, item).replace(/\\/g, '/');
        files.push({
          localPath,
          remotePath,
          size: stat.size
        });
      }
    }
  }
  
  return files;
}

// 進捗表示
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// メイン実行
async function main() {
  try {
    console.log('🚀 Firebase Storage移行を開始します...\n');
    
    const publicDir = path.join(__dirname, '../public');
    const audioDir = path.join(publicDir, 'audio');
    const imagesDir = path.join(publicDir, 'images');
    
    // ファイルをスキャン
    console.log('📁 ファイルをスキャン中...');
    const audioFiles = scanFiles(audioDir, 'audio');
    const imageFiles = scanFiles(imagesDir, 'images');
    const allFiles = [...audioFiles, ...imageFiles];
    
    if (allFiles.length === 0) {
      console.log('📭 移行対象のファイルが見つかりませんでした');
      return;
    }
    
    // 統計情報
    const totalSize = allFiles.reduce((sum, file) => sum + file.size, 0);
    console.log(`\n📊 移行対象: ${allFiles.length}ファイル (合計: ${formatBytes(totalSize)})`);
    console.log('   音声ファイル:', audioFiles.length, '個');
    console.log('   画像ファイル:', imageFiles.length, '個\n');
    
    // アップロード実行
    const results = [];
    let uploadedSize = 0;
    
    for (let i = 0; i < allFiles.length; i++) {
      const file = allFiles[i];
      console.log(`[${i + 1}/${allFiles.length}] (${formatBytes(file.size)})`);
      
      try {
        const result = await uploadFile(file.localPath, file.remotePath);
        results.push(result);
        uploadedSize += file.size;
        
        const progress = Math.round((uploadedSize / totalSize) * 100);
        console.log(`📈 進捗: ${progress}% (${formatBytes(uploadedSize)}/${formatBytes(totalSize)})\n`);
        
      } catch (error) {
        console.log(`⏭️  スキップして続行...\n`);
        results.push({
          localPath: file.localPath,
          remotePath: file.remotePath,
          error: error.message
        });
      }
    }
    
    // 結果をJSONファイルに保存
    const resultFile = path.join(__dirname, '../firebase-migration-results.json');
    const resultData = {
      migrationDate: new Date().toISOString(),
      totalFiles: allFiles.length,
      successfulUploads: results.filter(r => !r.error).length,
      failedUploads: results.filter(r => r.error).length,
      totalSize: totalSize,
      files: results
    };
    
    fs.writeFileSync(resultFile, JSON.stringify(resultData, null, 2));
    
    // 完了メッセージ
    console.log(`🎉 移行完了！`);
    console.log(`✅ 成功: ${resultData.successfulUploads}ファイル`);
    console.log(`❌ 失敗: ${resultData.failedUploads}ファイル`);
    console.log(`📋 詳細結果: ${resultFile}`);
    
    // URLマッピングを出力
    if (resultData.successfulUploads > 0) {
      console.log('\n📝 移行されたファイルのURLマッピング:');
      results.filter(r => !r.error).forEach(result => {
        const relativePath = result.localPath.replace(publicDir, '');
        console.log(`${relativePath} -> ${result.downloadURL}`);
      });
    }
    
  } catch (error) {
    console.error('❌ 移行中にエラーが発生しました:', error);
    process.exit(1);
  }
}

// 環境変数チェック
if (!firebaseConfig.apiKey) {
  console.error('❌ Firebase環境変数が設定されていません。以下を設定してください:');
  console.error('NEXT_PUBLIC_FIREBASE_API_KEY');
  console.error('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
  console.error('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  console.error('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
  process.exit(1);
}

main();