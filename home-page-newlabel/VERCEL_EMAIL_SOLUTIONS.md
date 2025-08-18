# Vercelでのメール配信 - 完全解決ガイド

## 現在の状況
- 環境変数は正しく設定済み ✅
- nodemailerでSMTP接続に問題発生 ❌

## 解決策（優先順位順）

### 1. 改善されたnodemailer版（推奨）
現在のroute.tsが最適化済み版
- サーバーレス環境対応のタイムアウト設定
- 詳細なエラーログ機能
- SMTP接続テスト機能

### 2. SendGrid版（最も確実）
```bash
# 依存関係インストール
npm install @sendgrid/mail

# SendGrid版に切り替え
mv app/api/contact/route-sendgrid.ts.example app/api/contact/route.ts
```

**必要な環境変数:**
```
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
ADMIN_EMAIL=askeybar.official@gmail.com
```

### 3. ログベース版（確実な受信）
```bash
# ログベース版に切り替え
mv app/api/contact/route-fetch.ts app/api/contact/route.ts
```

この版では：
- メール内容をVercel Function Logsに完全出力
- Webhook通知サポート
- 外部サービス連携準備済み

## 診断手順

### ステップ1: 現在のエラー確認
1. Vercelダッシュボード → Functions → `/api/contact`
2. 最新のログを確認
3. エラーメッセージを特定

### ステップ2: 問題に応じた対応

#### エラータイプ別対処法

**ENOTFOUND / ECONNREFUSED:**
```
→ DNS解決またはネットワーク接続の問題
→ SendGrid版への切り替えを推奨
```

**Invalid login / Authentication failed:**
```
→ Gmail認証の問題
→ App Passwordの再生成が必要
```

**ETIMEDOUT:**
```
→ タイムアウトエラー
→ 改善されたnodemailer版で解決される可能性
```

**Function timeout:**
```
→ Vercelの実行時間制限
→ ログベース版への切り替えを推奨
```

## 最速解決方法

### 即座に動作させる場合:
```bash
# ログベース版を使用
cp app/api/contact/route-fetch.ts app/api/contact/route.ts
git add .
git commit -m "フォールバック: ログベースコンタクト機能"
git push
```

これにより：
- Vercel Function Logsにお問い合わせ内容が完全記録
- 管理者がログから手動でメール返信可能
- 100%確実に動作

### 完全自動化したい場合:
```bash
# SendGrid設定
1. SendGridアカウント作成
2. API Key生成
3. Vercel環境変数に追加
4. SendGrid版APIに切り替え
```

## 推奨順序

1. **まず:** 現在の改善版nodemailerを試す
2. **問題続く場合:** SendGrid版に切り替え
3. **緊急時:** ログベース版で確実な受信

## 補足: 外部サービス連携

### Slack通知
```javascript
await fetch(process.env.SLACK_WEBHOOK_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: `新規お問い合わせ: ${name} (${email}) - ${subject}`
  })
})
```

### Discord通知
```javascript
await fetch(process.env.DISCORD_WEBHOOK_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: `**新規お問い合わせ**\n名前: ${name}\nメール: ${email}\n件名: ${subject}\n内容: ${message}`
  })
})
```

現在の設定で問題が続く場合は、SendGrid版への切り替えを強く推奨します。