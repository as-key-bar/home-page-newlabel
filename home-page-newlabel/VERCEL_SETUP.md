# Vercelでのメール機能設定方法

## 1. Vercel環境変数の設定

Vercelダッシュボード → プロジェクト → Settings → Environment Variablesで以下を設定：

### 必須環境変数
```
GMAIL_USER=askeybar.official@gmail.com
GMAIL_APP_PASSWORD=orlpcpaluhfeiaib
ADMIN_EMAIL=askeybar.official@gmail.com
FROM_NAME=.new label
WEBSITE_URL=https://your-vercel-domain.vercel.app
```

### 設定手順
1. Vercelダッシュボードでプロジェクトを開く
2. Settings タブをクリック
3. Environment Variables を選択
4. 上記の環境変数を1つずつ追加
5. 各環境変数で「Production」「Preview」「Development」全てにチェック

## 2. Gmail App Passwordの確認

既存のApp Password: `orlpcpaluhfeiaib`

### App Passwordが機能しない場合の再生成手順
1. Googleアカウント設定 → セキュリティ
2. 2段階認証が有効になっていることを確認
3. アプリパスワード → メール → デバイスを選択
4. 生成されたパスワードをVercelの環境変数に設定

## 3. デプロイ後の確認

### ログの確認方法
1. Vercelダッシュボード → プロジェクト → Functions
2. API関数のログを確認
3. コンソールに出力される環境変数チェック結果を確認

### テスト方法
1. デプロイ後、コンタクトフォームからテスト送信
2. エラーが発生した場合、VercelのFunction Logsでエラー詳細を確認
3. Gmail受信トレイで管理者メールを確認

## 4. トラブルシューティング

### よくある問題と解決方法

#### 問題1: 「Gmail configuration missing」エラー
**解決方法**: Vercelの環境変数が正しく設定されていない
→ Environment Variablesで全ての必須変数が設定されているか確認

#### 問題2: SMTP接続エラー
**解決方法**: Gmailの認証に失敗している
→ App Passwordを再生成してVercelに再設定

#### 問題3: メールが送信されない
**解決方法**: 
- Gmailのセキュリティ設定確認
- 「安全性の低いアプリのアクセス」が無効になっているか確認
- App Passwordが正しく設定されているか確認

#### 問題4: 自動返信メールのみ失敗
**解決方法**: 
- 送信者のメールアドレスが有効か確認
- SPF/DKIM設定の確認（独自ドメイン使用時）

## 5. 代替案：SendGridの使用

Gmail SMTPで問題が続く場合は、SendGridへの移行を推奨：

### SendGrid設定手順
1. SendGridアカウント作成
2. API Keyを生成
3. 環境変数を追加：
```
SENDGRID_API_KEY=your-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```
4. route.tsをSendGrid用に修正

## 6. セキュリティ注意事項

- App Passwordは外部に漏洩しないよう注意
- 環境変数は「Production」「Preview」「Development」全てで設定
- 定期的にApp Passwordを再生成することを推奨