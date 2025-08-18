import { NextRequest, NextResponse } from 'next/server'

// 軽量なメール送信機能（nodemailer不使用）
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

    // お問い合わせデータの構造化
    const contactData = {
      timestamp: new Date().toISOString(),
      timestampJST: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
      name,
      email,
      subject,
      message,
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || 
          request.headers.get('x-real-ip') || 
          'unknown',
      referer: request.headers.get('referer') || 'direct'
    }

    // 詳細ログ出力（Vercel Function Logsで確認可能）
    console.log('='.repeat(50))
    console.log('🔔 NEW CONTACT FORM SUBMISSION')
    console.log('='.repeat(50))
    console.log(`📅 Date: ${contactData.timestampJST}`)
    console.log(`👤 Name: ${contactData.name}`)
    console.log(`📧 Email: ${contactData.email}`)
    console.log(`📝 Subject: ${contactData.subject}`)
    console.log(`💬 Message:`)
    console.log(contactData.message)
    console.log(`🌐 IP: ${contactData.ip}`)
    console.log(`🔗 Referer: ${contactData.referer}`)
    console.log(`💻 User-Agent: ${contactData.userAgent}`)
    console.log('='.repeat(50))

    // 複数の通知方法を試行
    const notifications = []

    // 1. Webhook通知（設定されている場合）
    if (process.env.WEBHOOK_URL) {
      try {
        console.log('📤 Sending webhook notification...')
        const webhookResponse = await fetch(process.env.WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'NewLabel-Contact-Form/1.0'
          },
          body: JSON.stringify({
            ...contactData,
            notification_type: 'contact_form',
            source: 'newlabel_website'
          }),
          signal: AbortSignal.timeout(10000) // 10秒タイムアウト
        })
        
        if (webhookResponse.ok) {
          console.log('✅ Webhook notification sent successfully')
          notifications.push('webhook')
        } else {
          console.error('❌ Webhook notification failed:', await webhookResponse.text())
        }
      } catch (webhookError) {
        console.error('❌ Webhook error:', webhookError)
      }
    }

    // 2. Slack通知（設定されている場合）
    if (process.env.SLACK_WEBHOOK_URL) {
      try {
        console.log('📤 Sending Slack notification...')
        const slackResponse = await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: `🔔 新しいお問い合わせが届きました`,
            blocks: [
              {
                type: "header",
                text: {
                  type: "plain_text",
                  text: "🔔 新しいお問い合わせ"
                }
              },
              {
                type: "section",
                fields: [
                  { type: "mrkdwn", text: `*お名前:*\n${name}` },
                  { type: "mrkdwn", text: `*メール:*\n${email}` },
                  { type: "mrkdwn", text: `*種別:*\n${subject}` },
                  { type: "mrkdwn", text: `*日時:*\n${contactData.timestampJST}` }
                ]
              },
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `*内容:*\n${message}`
                }
              }
            ]
          }),
          signal: AbortSignal.timeout(10000)
        })
        
        if (slackResponse.ok) {
          console.log('✅ Slack notification sent successfully')
          notifications.push('slack')
        } else {
          console.error('❌ Slack notification failed')
        }
      } catch (slackError) {
        console.error('❌ Slack error:', slackError)
      }
    }

    // 3. Discord通知（設定されている場合）
    if (process.env.DISCORD_WEBHOOK_URL) {
      try {
        console.log('📤 Sending Discord notification...')
        const discordResponse = await fetch(process.env.DISCORD_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            embeds: [{
              title: "🔔 新しいお問い合わせ",
              color: 0x00FF00,
              fields: [
                { name: "👤 お名前", value: name, inline: true },
                { name: "📧 メール", value: email, inline: true },
                { name: "📝 種別", value: subject, inline: true },
                { name: "💬 内容", value: message.length > 1000 ? message.substring(0, 1000) + "..." : message },
                { name: "📅 日時", value: contactData.timestampJST, inline: true }
              ],
              timestamp: contactData.timestamp
            }]
          }),
          signal: AbortSignal.timeout(10000)
        })
        
        if (discordResponse.ok) {
          console.log('✅ Discord notification sent successfully')
          notifications.push('discord')
        } else {
          console.error('❌ Discord notification failed')
        }
      } catch (discordError) {
        console.error('❌ Discord error:', discordError)
      }
    }

    // 4. EmailJS/Formspree等の外部メールサービス（設定されている場合）
    if (process.env.EMAILJS_SERVICE_ID && process.env.EMAILJS_TEMPLATE_ID && process.env.EMAILJS_PUBLIC_KEY) {
      try {
        console.log('📤 Sending EmailJS notification...')
        const emailjsResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            service_id: process.env.EMAILJS_SERVICE_ID,
            template_id: process.env.EMAILJS_TEMPLATE_ID,
            public_key: process.env.EMAILJS_PUBLIC_KEY,
            template_params: {
              to_email: process.env.ADMIN_EMAIL,
              from_name: name,
              from_email: email,
              subject: subject,
              message: message,
              timestamp: contactData.timestampJST
            }
          }),
          signal: AbortSignal.timeout(10000)
        })
        
        if (emailjsResponse.ok) {
          console.log('✅ EmailJS notification sent successfully')
          notifications.push('emailjs')
        } else {
          console.error('❌ EmailJS notification failed')
        }
      } catch (emailjsError) {
        console.error('❌ EmailJS error:', emailjsError)
      }
    }

    console.log(`📊 Notifications sent: ${notifications.join(', ') || 'none'}`)
    console.log('✅ Contact form processing completed')

    return NextResponse.json(
      { 
        success: true,
        message: 'お問い合わせを受け付けました。内容を確認後、2-3営業日以内にご連絡いたします。',
        notifications: notifications
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('❌ Contact form error:', error)
    
    // 詳細なエラー情報をログ出力
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    return NextResponse.json(
      { error: 'お問い合わせの処理中にエラーが発生しました。しばらく後でお試しください。' },
      { status: 500 }
    )
  }
}