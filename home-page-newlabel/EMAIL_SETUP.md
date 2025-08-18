# メール送信機能の設定方法

現在のコンタクトフォームは基本的なAPI接続が完了していますが、実際のメール送信には以下のいずれかの方法を選択してください。

## 方法1: Nodemailerを使用（Gmail SMTP）

### 1. 依存関係をインストール
```bash
npm install nodemailer @types/nodemailer
```

### 2. 環境変数を設定（.env.local）
```env
ADMIN_EMAIL=askeybar.official@gmail.com
GMAIL_USER=askeybar.official@gmail.com
GMAIL_APP_PASSWORD=orlpcpaluhfeiaib
```

### 3. app/api/contact/route.tsを更新
```typescript
import nodemailer from 'nodemailer'

// メール送信処理を追加
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

// 管理者向けメール
await transporter.sendMail({
  from: process.env.GMAIL_USER,
  to: process.env.ADMIN_EMAIL,
  subject: `[お問い合わせ] ${subject}`,
  html: `
    <h3>新しいお問い合わせ</h3>
    <p><strong>お名前:</strong> ${name}</p>
    <p><strong>メールアドレス:</strong> ${email}</p>
    <p><strong>件名:</strong> ${subject}</p>
    <p><strong>内容:</strong></p>
    <p>${message.replace(/\n/g, '<br>')}</p>
  `,
})

// 自動返信メール
await transporter.sendMail({
  from: process.env.GMAIL_USER,
  to: email,
  subject: 'お問い合わせありがとうございます',
  html: `
    <p>${name} 様</p>
    <p>お問い合わせありがとうございます。</p>
    <p>内容を確認後、2-3営業日以内にご連絡いたします。</p>
    <br>
    <p>.new label</p>
  `,
})
```

## 方法2: SendGridを使用（推奨）

### 1. SendGridアカウント作成とAPI キー取得

### 2. 依存関係をインストール
```bash
npm install @sendgrid/mail
```

### 3. 環境変数を設定
```env
SENDGRID_API_KEY=your-api-key
ADMIN_EMAIL=your-admin@domain.com
FROM_EMAIL=noreply@yourdomain.com
```

## 方法3: 外部サービス（Formspree等）

最も簡単な方法として、Formspreeなどのサービスを使用することも可能です。

## 現在の状態

- ✅ フォームバリデーション実装済み
- ✅ API エンドポイント作成済み
- ✅ エラーハンドリング実装済み
- ⏳ 実際のメール送信機能（上記のいずれかを選択）

現在はコンソールにログが出力されるため、開発ツールのコンソールで送信内容を確認できます。