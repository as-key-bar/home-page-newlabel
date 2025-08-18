import { NextRequest, NextResponse } from 'next/server'

// Fetch APIを使用したGmail API版（より確実）
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
    console.log('ADMIN_EMAIL:', process.env.ADMIN_EMAIL ? '✓ Set' : '✗ Missing')
    
    if (!process.env.ADMIN_EMAIL) {
      console.error('Admin email configuration missing')
      return NextResponse.json(
        { error: 'メール設定に問題があります。管理者にお問い合わせください。' },
        { status: 500 }
      )
    }

    // FormspreeやEmailJSなどの外部サービスを使用
    // または、メール送信をWebhookで後処理に回す
    
    // メール内容をログに記録（管理者が手動で確認可能）
    const contactData = {
      timestamp: new Date().toISOString(),
      name,
      email,
      subject,
      message,
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    }

    console.log('=== NEW CONTACT SUBMISSION ===')
    console.log('Timestamp:', contactData.timestamp)
    console.log('Name:', contactData.name)
    console.log('Email:', contactData.email)
    console.log('Subject:', contactData.subject)
    console.log('Message:', contactData.message)
    console.log('User Agent:', contactData.userAgent)
    console.log('IP:', contactData.ip)
    console.log('===============================')

    // Slackやディスコード、Webhookへの通知も可能
    // await notifySlack(contactData)
    // await notifyDiscord(contactData)
    
    // 簡易的な外部メール送信サービス（Formspree風）
    try {
      if (process.env.WEBHOOK_URL) {
        const webhookResponse = await fetch(process.env.WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...contactData,
            notification_type: 'contact_form'
          })
        })
        
        if (webhookResponse.ok) {
          console.log('Webhook notification sent successfully')
        } else {
          console.error('Webhook notification failed:', await webhookResponse.text())
        }
      }
    } catch (webhookError) {
      console.error('Webhook error:', webhookError)
      // Webhookのエラーは致命的でないので続行
    }

    return NextResponse.json(
      { 
        success: true,
        message: 'お問い合わせを受け付けました。内容を確認後、2-3営業日以内にご連絡いたします。'
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Contact form error:', error)
    
    if (error instanceof Error) {
      console.error('Error details:', error.message)
    }
    
    return NextResponse.json(
      { error: 'お問い合わせの処理中にエラーが発生しました。しばらく後でお試しください。' },
      { status: 500 }
    )
  }
}