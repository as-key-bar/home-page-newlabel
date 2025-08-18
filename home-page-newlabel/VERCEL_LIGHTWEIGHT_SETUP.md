# 軽量なメール通知システム - Vercel対応版

## 概要
nodemailerを削除し、fetch APIのみを使用した軽量なメール通知システムを実装。
Vercelの250MB制限を回避し、複数の通知チャンネルをサポート。

## 特徴
✅ **軽量**: nodemailerなし、外部依存関係最小限  
✅ **複数通知**: Webhook、Slack、Discord、EmailJSをサポート  
✅ **詳細ログ**: Vercel Function Logsで完全な内容確認可能  
✅ **堅牢**: タイムアウト設定、エラーハンドリング完備  

## 通知方法の設定

### 1. 基本設定（必須）
```bash
ADMIN_EMAIL=askeybar.official@gmail.com
```

### 2. Webhook通知（推奨）
```bash
WEBHOOK_URL=https://your-webhook-endpoint.com/contact
```

### 3. Slack通知
1. Slack Webhookを作成
2. 環境変数を設定：
```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
```

### 4. Discord通知
1. Discordサーバーでwebhookを作成
2. 環境変数を設定：
```bash
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR/DISCORD/WEBHOOK
```

### 5. EmailJS通知（メール送信）
1. EmailJSアカウント作成
2. Gmail連携設定
3. 環境変数を設定：
```bash
EMAILJS_SERVICE_ID=your_service_id
EMAILJS_TEMPLATE_ID=your_template_id  
EMAILJS_PUBLIC_KEY=your_public_key
```

## 現在の動作

### 最小設定（ADMIN_EMAILのみ）
- ✅ お問い合わせ受信確認
- ✅ 詳細ログ出力（Function Logsで確認）
- ✅ ユーザーへの受付完了メッセージ

### 推奨設定（Slack/Discord追加）
- ✅ 即座にチャット通知
- ✅ リッチな通知フォーマット
- ✅ チーム全体への共有

### 完全設定（EmailJS追加）
- ✅ 自動メール送信
- ✅ 管理者と送信者への確認メール
- ✅ 従来のメール通知体験

## Function Logsでの確認方法

1. Vercelダッシュボード → プロジェクト
2. Functions → `/api/contact`
3. リアルタイムログで以下を確認：

```
==================================================
🔔 NEW CONTACT FORM SUBMISSION
==================================================
📅 Date: 2025/01/18 22:30:15
👤 Name: 田中太郎
📧 Email: tanaka@example.com
📝 Subject: リミックス制作依頼
💬 Message: ボカロ楽曲のリミックスをお願いしたいです...
🌐 IP: 203.104.xxx.xxx
🔗 Referer: https://your-domain.vercel.app/contact
💻 User-Agent: Mozilla/5.0...
==================================================
📤 Sending Slack notification...
✅ Slack notification sent successfully
📊 Notifications sent: slack
✅ Contact form processing completed
```

## 緊急時の手動対応

Function Logsに記録された内容を元に：
1. 管理者が直接メール返信
2. お問い合わせ内容の管理・追跡
3. 返信状況の記録

## トラブルシューティング

### 通知が届かない場合
1. Vercel Function Logsでエラー確認
2. 環境変数の設定確認
3. Webhook URLの動作確認

### ログが表示されない場合
1. Vercelの Functions タブを確認
2. 最新のデプロイメントを選択
3. リアルタイムログを有効化

## サイズ比較

| 構成 | 依存関係 | 推定サイズ |
|------|----------|------------|
| nodemailer版 | nodemailer + 82パッケージ | ~150MB |
| 軽量版 | fetch API のみ | ~10MB |

この軽量版により、Vercelの250MB制限を大幅にクリアし、安定したデプロイが可能になります。