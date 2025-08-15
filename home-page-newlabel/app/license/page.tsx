'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface LicenseSection {
  id: string
  title: string
  content: string
}

interface License {
  title: string
  lastUpdated: string
  sections: LicenseSection[]
  contact: {
    email?: string
    website?: string
    twitter?: string
  }
}

export default function License() {
  const [license, setLicense] = useState<License | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/license')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setLicense(data)
        } else {
          setError('利用規約の読み込みに失敗しました')
        }
      })
      .catch(err => {
        setError('利用規約の読み込みに失敗しました')
        console.error('License fetch error:', err)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error || !license) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-start">
          <div className="flex-1 flex flex-col items-center">
            <Link href="/" className="hover:opacity-80">
              <img 
                src="/images/newlabel_logo.png" 
                alt="NewLabel Logo" 
                className="h-96 w-auto object-cover"
                style={{
                  objectPosition: '50% 50%',
                  clipPath: 'inset(30% 0 40% 0)'
                }}
              />
            </Link>
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-center">
              {license.title}
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
              href="/contact"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 px-8 py-4 text-xl font-medium transition-colors"
            >
              Contact
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {license.title}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              最終更新日: {license.lastUpdated}
            </p>
          </div>

          <div className="space-y-8">
            {license.sections.map((section) => (
              <section key={section.id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  {section.title}
                </h2>
                <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                  {section.content}
                </div>
              </section>
            ))}
          </div>

          {license.contact && (
            <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                お問い合わせ
              </h2>
              <div className="space-y-2">
                {license.contact.email && (
                  <p className="text-gray-600 dark:text-gray-400">
                    <strong>Email:</strong> 
                    <a href={`mailto:${license.contact.email}`} className="text-blue-600 dark:text-blue-400 hover:underline ml-2">
                      {license.contact.email}
                    </a>
                  </p>
                )}
                {license.contact.twitter && (
                  <p className="text-gray-600 dark:text-gray-400">
                    <strong>Twitter:</strong> 
                    <a href={license.contact.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline ml-2">
                      {license.contact.twitter.replace('https://twitter.com/', '@')}
                    </a>
                  </p>
                )}
                {license.contact.website && (
                  <p className="text-gray-600 dark:text-gray-400">
                    <strong>Website:</strong> 
                    <a href={license.contact.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline ml-2">
                      {license.contact.website}
                    </a>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}