# home-page-newlabel
# My Music Site

## 概要
このプロジェクトは、音楽活動の情報を整理して発信する個人サイトです。  
楽曲情報を CSV で管理し、Next.js の API Routes を経由してフロントに表示する構成です。

- 依頼受付や他クリエイターへのアピール用
- 既存ファンや海外ユーザー向けに情報提供
- 今後の拡張として管理ツールやデザイン調整も可能

---

## 技術スタック

- **フレームワーク**: Next.js 14 + TypeScript
- **CSVパース**: csv-parse
- **フロント**: React
- **デザイン**: Tailwind CSS（任意で追加可能）
- **開発環境**: GitHub Codespace / VSCode
- **デプロイ**: GitHub Pages（`gh-pages` ブランチ）

---

## ディレクトリ構成（現時点）

my-music-site/
├─ data/
│ └─ songs.csv # 楽曲情報 CSV
├─ pages/
│ ├─ index.tsx # トップページ
│ └─ api/
│ └─ songs.ts # CSV → JSON API
├─ package.json
├─ tsconfig.json
└─ README.md

---

## CSVフォーマット

CSV は以下の列を想定:

| title      | artist   | release     | link                   |
|------------|---------|------------|-----------------------|
| 曲名       | アーティスト名 | YYYY-MM-DD | 試聴ページ URL         |

例:

```csv
title,artist,release,link
Sunrise,Your Name,2025-08-01,https://example.com/sunrise
Moonlight,Your Name,2025-07-15,https://example.com/moonlight



開発手順
1. プロジェクト作成（初回のみ）

npx create-next-app@latest my-music-site --ts
cd my-music-site
npm install csv-parse


2. ディレクトリ作成

mkdir data
mkdir pages/api
touch data/songs.csv


3. 開発サーバー起動

npm run dev
ブラウザで http://localhost:3000 を開く

http://localhost:3000/api/songs で CSV が JSON に変換されて返ることを確認

4. ビルド（本番用）

npm run build
npm run export  # GitHub Pages 用静的出力
運用イメージ
楽曲情報更新

CSV を編集 → フロントに即反映（API フェッチ方式）

デザイン変更

Tailwind CSS / CSS Modules / styled-components 等で対応

拡張

管理画面や外部API連携を追加可能

参考リンク
Next.js Documentation

csv-parse

GitHub Pages


---