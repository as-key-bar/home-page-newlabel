import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// Gmail SMTP設定（TypeScript型安全版）
const createTransporter = () => {
  console.log('Creating transporter with configuration:')
  console.log('Host: smtp.gmail.com')
  console.log('Port: 587')
  console.log('User:', process.env.GMAIL_USER ? 'Set' : 'Missing')
  
  // TypeScript型エラー回避のための明示的な設定
  const transportConfig: any = {
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
    pool: false,
    maxConnections: 1,
    // Vercel環境での追加設定
    tls: {
      rejectUnauthorized: false
    }
  }
  
  return nodemailer.createTransport(transportConfig)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, subject, message } = body

    // バリデーション
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: '必須項目が入力されていません' },
        { status: 400 }
      )
    }

    // メールアドレスの簡単なバリデーション
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '有効なメールアドレスを入力してください' },
        { status: 400 }
      )
    }

    // 環境変数チェック
    console.log('Environment variables check:')
    console.log('GMAIL_USER:', process.env.GMAIL_USER ? '✓ Set' : '✗ Missing')
    console.log('GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? '✓ Set' : '✗ Missing')
    console.log('ADMIN_EMAIL:', process.env.ADMIN_EMAIL ? '✓ Set' : '✗ Missing')
    
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD || !process.env.ADMIN_EMAIL) {
      console.error('Gmail configuration missing')
      return NextResponse.json(
        { error: 'メール設定に問題があります。管理者にお問い合わせください。' },
        { status: 500 }
      )
    }

    // トランスポーター作成と接続テスト
    const transporter = createTransporter()
    const adminEmail = process.env.ADMIN_EMAIL
    const fromName = process.env.FROM_NAME || '.new label'
    
    // SMTP接続テスト（Vercel環境での問題診断用）
    console.log('Testing SMTP connection...')
    try {
      await transporter.verify()
      console.log('SMTP connection verified successfully')
    } catch (verifyError) {
      console.error('SMTP verification failed:', verifyError)
      // 接続テスト失敗でも処理を続行（より詳細なエラーを取得するため）
    }

    // 管理者向けメール
    const adminMailOptions = {
      from: `"${fromName}" <${process.env.GMAIL_USER}>`,
      to: adminEmail,
      subject: `[お問い合わせ] ${subject}`,
      html: `
        <h3>新しいお問い合わせが届きました</h3>
        <hr>
        <p><strong>お名前:</strong> ${name}</p>
        <p><strong>メールアドレス:</strong> ${email}</p>
        <p><strong>お問い合わせ種別:</strong> ${subject}</p>
        <p><strong>内容:</strong></p>
        <div style="background-color: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px;">
          ${message.replace(/\n/g, '<br>')}
        </div>
        <hr>
        <p style="font-size: 12px; color: #666;">
          送信日時: ${new Date().toLocaleString('ja-JP')}
        </p>
      `,
    }

    // 自動返信メール
    const autoReplyOptions = {
      from: `"${fromName}" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'お問い合わせありがとうございます',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2 style="color: #333;">${name} 様</h2>
          <p>この度は .new label にお問い合わせいただき、ありがとうございます。</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #495057;">お問い合わせ内容</h3>
            <p><strong>お問い合わせ種別:</strong> ${subject}</p>
            <p><strong>内容:</strong></p>
            <div style="background-color: white; padding: 15px; border-radius: 4px;">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>
          
          <p>内容を確認後、2-3営業日以内にご連絡いたします。</p>
          <p>しばらくお待ちください。</p>
          
          <hr style="margin: 30px 0;">
          <p style="font-size: 14px; color: #6c757d;">
            <strong>.new label</strong><br>
            ${process.env.WEBSITE_URL || 'https://newlabel.com'}
          </p>
        </div>
      `,
    }

    // メール送信（Vercel対応版）
    console.log('Sending admin email...')
    try {
      await transporter.sendMail(adminMailOptions)
      console.log('Admin email sent successfully')
    } catch (emailError) {
      console.error('Failed to send admin email:', emailError)
      throw new Error('管理者メールの送信に失敗しました')
    }
    
    console.log('Sending auto-reply email...')
    try {
      await transporter.sendMail(autoReplyOptions)
      console.log('Auto-reply email sent successfully')
    } catch (emailError) {
      console.error('Failed to send auto-reply email:', emailError)
      // 自動返信の失敗は致命的エラーにしない
      console.log('Auto-reply failed, but continuing...')
    }

    console.log('Contact form submission successful:', {
      name,
      email,
      subject,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json(
      { 
        success: true,
        message: 'お問い合わせを受け付けました。確認メールを送信いたしましたので、ご確認ください。'
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Contact form error:', error)
    
    // 詳細なエラー情報をログ出力
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
      
      // 特定のエラータイプの処理
      if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
        console.error('Network connection error - DNS or connection issue')
      } else if (error.message.includes('Invalid login')) {
        console.error('Authentication failed - check Gmail credentials')
      } else if (error.message.includes('ETIMEDOUT')) {
        console.error('Connection timeout - network or firewall issue')
      }
    }
    
    // 開発環境でのみ詳細エラーを返す
    const isDevelopment = process.env.NODE_ENV === 'development'
    const errorMessage = isDevelopment && error instanceof Error 
      ? `開発モード: ${error.message}` 
      : 'メール送信に失敗しました。しばらく後でお試しください。'
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}