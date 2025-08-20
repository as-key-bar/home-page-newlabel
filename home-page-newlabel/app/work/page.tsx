'use client'

import React from 'react'
import Link from 'next/link'
import SlideMenu from '../../components/SlideMenu'

interface WorkLink {
  title: string
  description: string
  url: string
  icon: React.ReactNode
}

export default function WorkPage() {
  const workLinks: WorkLink[] = [
    {
      title: 'YouTube (Touhou)',
      description: '東方アレンジ楽曲のミュージックビデオ',
      url: 'https://www.youtube.com/@bazaarrecords', // プレースホルダー - 実際のYouTube URLに変更してください
      icon: (
        <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      )
    },
    {
      title: 'YouTube (Vocaloid)',
      description: 'ボーカロイド楽曲のミュージックビデオ',
      url: 'https://www.youtube.com/@newlabelofficial', // プレースホルダー - 実際のYouTube URLに変更してください
      icon: (
        <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      )
    },
    {
      title: 'X/Twitter',
      description: '最新情報・制作進捗・日常の呟き',
      url: 'https://x.com/askey_Azukibar', // プレースホルダー - 実際のTwitter URLに変更してください
      icon: (
        <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      )
    },
    {
      title: 'Streaming',
      description: 'Spotify、Apple Music等での楽曲配信',
      url: 'https://lnk.to/4582736134755', // プレースホルダー - 実際のストリーミング URLに変更してください
      icon: (
        <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
        </svg>
      )
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SlideMenu />
      <header className="shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-start">
          <div className="flex-1 flex flex-col items-center">
            <Link href="/" className="hover:opacity-80">
              <img 
                src="/images/newlabel_logotrim.png" 
                alt="NewLabel Logo" 
                className="h-24 w-auto object-contain"
              />
            </Link>
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-center">
              活動報告
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Work
          </h1>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            私の音楽制作活動を紹介するページです。様々なプラットフォームでの作品をご覧いただけます。
          </p>
        </div> */}

        {/* リンクグリッド */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {workLinks.map((link, index) => (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 mr-4">
                  {link.icon}
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {link.title}
                </h2>
              </div>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                {link.description}
              </p>
              <div className="flex items-center text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                <span className="text-sm font-medium">詳しく見る</span>
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </a>
          ))}
        </div>

        {/* フッター */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mt-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            各プラットフォームで最新の楽曲情報をお届けしています
          </p>
        </div>
      </main>
    </div>
  )
}