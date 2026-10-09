#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Firebase移行結果を読み込み
const migrationResultPath = path.join(__dirname, '../firebase-migration-results.json');

if (!fs.existsSync(migrationResultPath)) {
  console.error('❌ Firebase移行結果ファイルが見つかりません:', migrationResultPath);
  console.error('先にFirebase Storage移行を実行してください。');
  process.exit(1);
}

const migrationResults = JSON.parse(fs.readFileSync(migrationResultPath, 'utf8'));
console.log('📋 Firebase移行結果を読み込みました');
console.log(`   成功したファイル: ${migrationResults.successfulUploads}個`);

// URLマッピングを作成
const urlMapping = {};
migrationResults.files.forEach(file => {
  if (!file.error && file.downloadURL) {
    // ローカルパスからpublicを除いたパスをキーにする
    const localPath = file.localPath.replace(/.*\/public/, '');
    urlMapping[localPath] = file.downloadURL;
  }
});

console.log('\n🔗 作成されたURLマッピング:');
Object.entries(urlMapping).forEach(([localPath, firebaseUrl]) => {
  console.log(`${localPath} -> ${firebaseUrl.substring(0, 100)}...`);
});

// データベース更新関数
async function updateDatabaseUrls() {
  try {
    console.log('\n🔄 データベースのURL更新を開始します...');
    
    // 現在の楽曲データを取得
    const response = await fetch('http://localhost:3000/api/songs');
    if (!response.ok) {
      throw new Error(`API取得エラー: ${response.status}`);
    }
    
    const data = await response.json();
    const songs = data.songs || [];
    
    console.log(`📊 現在の楽曲数: ${songs.length}個`);
    
    if (songs.length === 0) {
      console.log('📭 更新対象の楽曲がありません');
      return;
    }
    
    // 各楽曲のURLを更新
    let updateCount = 0;
    
    for (const song of songs) {
      let updated = false;
      const originalSong = { ...song };
      
      // 音声ファイルパスを更新
      if (song.audioPath && urlMapping[song.audioPath]) {
        song.audioPath = urlMapping[song.audioPath];
        updated = true;
        console.log(`🎵 "${song.title}" の音声URLを更新`);
      }
      
      // カバー画像パスを更新
      if (song.coverImagePath && urlMapping[song.coverImagePath]) {
        song.coverImagePath = urlMapping[song.coverImagePath];
        updated = true;
        console.log(`🖼️  "${song.title}" の画像URLを更新`);
      }
      
      // 更新がある場合はAPIで保存
      if (updated) {
        try {
          const updateResponse = await fetch('http://localhost:3000/api/songs', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(song)
          });
          
          if (!updateResponse.ok) {
            const errorData = await updateResponse.json();
            throw new Error(`更新エラー: ${errorData.error || updateResponse.status}`);
          }
          
          updateCount++;
          console.log(`✅ "${song.title}" の更新完了`);
          
        } catch (error) {
          console.error(`❌ "${song.title}" の更新失敗:`, error.message);
        }
      } else {
        console.log(`⏭️  "${song.title}" は更新不要`);
      }
    }
    
    console.log(`\n🎉 データベース更新完了！`);
    console.log(`✅ 更新された楽曲: ${updateCount}個`);
    console.log(`📊 総楽曲数: ${songs.length}個`);
    
    // 更新後のデータを確認
    console.log('\n🔍 更新後のデータを確認中...');
    const verifyResponse = await fetch('http://localhost:3000/api/songs');
    if (verifyResponse.ok) {
      const verifyData = await verifyResponse.json();
      console.log('✅ データベース確認完了');
      
      // Firebase URLを使用している楽曲数をカウント
      const firebaseUrlCount = verifyData.songs.filter(song => 
        (song.audioPath && song.audioPath.includes('firebasestorage.googleapis.com')) ||
        (song.coverImagePath && song.coverImagePath.includes('firebasestorage.googleapis.com'))
      ).length;
      
      console.log(`🔥 Firebase Storage使用楽曲: ${firebaseUrlCount}個`);
    }
    
  } catch (error) {
    console.error('❌ データベース更新中にエラーが発生しました:', error.message);
    process.exit(1);
  }
}

// 実行
updateDatabaseUrls();