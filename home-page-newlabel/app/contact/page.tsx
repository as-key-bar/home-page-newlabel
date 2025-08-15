'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Profile {
  name: string
  contact: {
    email?: string
    twitter?: string
    soundcloud?: string
    bandcamp?: string
    youtube?: string
    youtube_vocaloid?: string
    instagram?: string
  }
}

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState('')
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    fetch('/api/profile')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setProfile(data)
        }
      })
      .catch(err => console.error('Profile fetch error:', err))
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // フォーム送信のシミュレーション
    setTimeout(() => {
      setSubmitMessage('お問い合わせありがとうございます。内容を確認後、ご連絡いたします。')
      setFormData({ name: '', email: '', subject: '', message: '' })
      setIsSubmitting(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-start">
          <div className="flex-1 flex flex-col items-center">
            <div className="h-48 w-auto overflow-hidden flex items-center justify-center">
              <Link href="/" className="hover:opacity-80">
                <img 
                  src="/images/newlabel_logo.png" 
                  alt="NewLabel Logo" 
                  className="h-96 w-auto object-cover"
                  style={{
                    objectPosition: '50% 50%',
                    clipPath: 'inset(20% 0 20% 0)'
                  }}
                />
              </Link>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-center">
              お問い合わせ
            </p>
          </div>
          <nav className="flex gap-4 mt-2">
            <Link
              href="/"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 px-8 py-4 text-xl font-medium transition-colors"
            >
              Home
            </Link>
            <Link
              href="/license"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 px-8 py-4 text-xl font-medium transition-colors"
            >
              License
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            お問い合わせ
          </h2>
          
          <div className="mb-8">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              楽曲制作のご依頼、コラボレーション、リミックス制作など、
              お気軽にお問い合わせください。
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              ※返信まで2-3営業日お時間をいただく場合があります
            </p>
          </div>

          {submitMessage && (
            <div className="mb-6 p-4 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg">
              {submitMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                お名前 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                メールアドレス <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                お問い合わせ種別 <span className="text-red-500">*</span>
              </label>
              <select
                id="subject"
                name="subject"
                required
                value={formData.subject}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">選択してください</option>
                <option value="remix">リミックス制作依頼</option>
                <option value="original">オリジナル楽曲制作依頼</option>
                <option value="collaboration">コラボレーション</option>
                <option value="licensing">楽曲使用許可</option>
                <option value="other">その他</option>
              </select>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                メッセージ <span className="text-red-500">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={6}
                value={formData.message}
                onChange={handleChange}
                placeholder="ご依頼内容、予算、納期などの詳細をお聞かせください"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              {isSubmitting ? '送信中...' : 'お問い合わせを送信'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              その他の連絡方法
            </h3>
            <div className="space-y-2 text-sm">
              {profile?.contact?.email && (
                <p className="text-gray-600 dark:text-gray-400">
                  <strong>Email:</strong> 
                  <a href={`mailto:${profile.contact.email}`} className="text-blue-600 dark:text-blue-400 hover:underline ml-2">
                    {profile.contact.email}
                  </a>
                </p>
              )}
              {profile?.contact?.twitter && (
                <p className="text-gray-600 dark:text-gray-400">
                  <strong>Twitter:</strong> 
                  <a href={profile.contact.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline ml-2">
                    {profile.contact.twitter.replace('https://twitter.com/', '@')}
                  </a>
                </p>
              )}
              {profile?.contact?.soundcloud && (
                <p className="text-gray-600 dark:text-gray-400">
                  <strong>SoundCloud:</strong> 
                  <a href={profile.contact.soundcloud} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline ml-2">
                    SoundCloud
                  </a>
                </p>
              )}
              {profile?.contact?.bandcamp && (
                <p className="text-gray-600 dark:text-gray-400">
                  <strong>Bandcamp:</strong> 
                  <a href={profile.contact.bandcamp} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline ml-2">
                    Bandcamp
                  </a>
                </p>
              )}
              {profile?.contact?.youtube && (
                <p className="text-gray-600 dark:text-gray-400">
                  <strong>YouTube (Instrumental):</strong> 
                  <a href={profile.contact.youtube} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline ml-2">
                    Bazaar Records
                  </a>
                </p>
              )}
              {profile?.contact?.youtube_vocaloid && (
                <p className="text-gray-600 dark:text-gray-400">
                  <strong>YouTube (Vocaloid):</strong> 
                  <a href={profile.contact.youtube_vocaloid} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline ml-2">
                    NewLabel Official
                  </a>
                </p>
              )}
              {profile?.contact?.instagram && (
                <p className="text-gray-600 dark:text-gray-400">
                  <strong>Instagram:</strong> 
                  <a href={profile.contact.instagram} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline ml-2">
                    Instagram
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}