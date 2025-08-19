#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

async function updateCSVUrls() {
  try {
    // Firebase upload結果を読み込み
    const resultFile = path.join(__dirname, '../firebase-upload-results.json');
    if (!fs.existsSync(resultFile)) {
      console.error('❌ firebase-upload-results.json が見つかりません。先にアップロードスクリプトを実行してください。');
      process.exit(1);
    }
    
    const uploadResults = JSON.parse(fs.readFileSync(resultFile, 'utf8'));
    console.log(`📋 ${uploadResults.totalFiles} ファイルのURL情報を読み込みました`);
    
    // songs.csvを読み込み
    const csvFile = path.join(__dirname, '../data/songs.csv');
    if (!fs.existsSync(csvFile)) {
      console.error('❌ data/songs.csv が見つかりません。');
      process.exit(1);
    }
    
    let csvContent = fs.readFileSync(csvFile, 'utf8');
    console.log('📄 songs.csv を読み込みました');
    
    // URL置換の統計
    let replacementCount = 0;
    
    // ローカルパスをFirebase URLに置換
    Object.entries(uploadResults.files).forEach(([localPath, firebaseUrl]) => {
      const regex = new RegExp(localPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const beforeCount = (csvContent.match(regex) || []).length;
      
      if (beforeCount > 0) {
        csvContent = csvContent.replace(regex, firebaseUrl);
        replacementCount += beforeCount;
        console.log(`🔄 置換: ${localPath} -> Firebase URL (${beforeCount}箇所)`);
      }
    });
    
    // バックアップを作成
    const backupFile = `${csvFile}.backup.${Date.now()}`;
    fs.writeFileSync(backupFile, fs.readFileSync(csvFile, 'utf8'));
    console.log(`💾 バックアップ作成: ${backupFile}`);
    
    // 更新されたCSVを保存
    fs.writeFileSync(csvFile, csvContent);
    
    console.log(`\n✅ 完了！`);
    console.log(`📊 置換統計:`);
    console.log(`   - 処理ファイル数: ${uploadResults.totalFiles}`);
    console.log(`   - 置換箇所数: ${replacementCount}`);
    console.log(`   - 更新ファイル: ${csvFile}`);
    console.log(`   - バックアップ: ${backupFile}`);
    
    if (replacementCount === 0) {
      console.log('\n⚠️  置換が実行されませんでした。songs.csvの形式を確認してください。');
    }
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

updateCSVUrls();