# .new label ホームページ

音楽レーベル「.new label」の公式サイトです。楽曲の試聴、プロフィール、ライセンス情報、問い合わせフォーム、管理画面（楽曲の追加・編集・並べ替え）を備えています。

リポジトリのルートがそのまま Next.js アプリです（入れ子のディレクトリはありません）。

## 技術スタック

- Next.js 15 (App Router) / React 19 / TypeScript 5.9
- Tailwind CSS 4
- Firebase: Auth (Google ログイン) / Firestore / Storage
- `firebase-admin`: 管理 API の認証検証と Firestore 書き込み
- nodemailer (Gmail SMTP): 問い合わせメール
- デプロイ: Vercel

## セットアップ

```bash
npm install
cp .env.example .env.local   # 値を埋める
npm run dev                  # http://localhost:3000
```

Node.js 20 以上（22 で動作確認）。環境変数の一覧は [`.env.example`](./.env.example) を参照してください。

## コマンド

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバー (Turbopack) |
| `npm run build` | 本番ビルド（`next/font` が Google Fonts を取得するため要ネットワーク） |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest |

## 認証と権限

- 管理者は Google ログインのメールが `ADMIN_EMAILS`（未設定時は既定値）に含まれ、かつメール認証済みのユーザーです。
- 書き込み系 API（`/api/songs` の POST/PUT/DELETE、`/api/songs/reorder`）は `Authorization: Bearer <Firebase ID トークン>` をサーバー側で検証します。
- 書き込みは Firebase Admin SDK 経由です。`FIREBASE_SERVICE_ACCOUNT_KEY` が必要です。
- Firestore ルールは「公開データの読み取りのみ許可、書き込みは全拒否」です。**変更後は `firebase deploy --only firestore:rules` が必要です。**
- Storage へのアップロードはクライアントから直接行い、`storage.rules` で管理者メールのみに制限しています。

## 既知の状況

- 問い合わせフォームは `app/contact/page.tsx` の `isTemporarilyDisabled = true` で一時停止中です。
- `data/`（CSV/JSON）は Firestore 移行前のデータで、`scripts/` の移行スクリプトが参照します（`npm` ではなくリポジトリのルートから `node scripts/...` で実行）。