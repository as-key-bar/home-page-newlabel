'use client'

import { useEffect, useState } from 'react'
import { Song } from './api/songs/route'
import { Profile } from './api/profile/route'

export default function Home() {
  const [songs, setSongs] = useState<Song[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    Promise.all([
      fetch('/api/songs').then(res => res.json()),
      fetch('/api/profile').then(res => res.json())
    ])
      .then(([songsData, profileData]) => {
        if (Array.isArray(songsData)) {
          setSongs(songsData)
        } else {
          setError('楽曲データの読み込みに失敗しました')
        }
        
        if (profileData && !profileData.error) {
          setProfile(profileData)
        }
      })
      .catch(err => {
        setError('データの読み込みに失敗しました')
        console.error(err)
      })
      .finally(() => setLoading(false))
  }, [])

  // パララックススクロールのイベントリスナー
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* パララックス背景レイヤー - songs.csvから動的生成 */}
      {songs.map((song, index) => (
        <div 
          key={song.title}
          className="fixed inset-0 w-full h-full"
          style={{
            backgroundImage: `url(${song.coverImagePath})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            transform: index === 0 
              ? `translateY(${scrollY * 1}px)` 
              : `translateY(${Math.max(0, (scrollY - (index * 3000)) * 1)}px)`,
            zIndex: -(index + 1)
          }}
        />
      ))}


      {/* ヘッダー */}
      <header className="relative z-10 bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-start">
          <div className="flex-1 flex flex-col items-center">
            <div className="h-48 w-auto overflow-hidden flex items-center justify-center">
              <img 
                src="/images/newlabel_logo.png" 
                alt="NewLabel Logo" 
                className="h-96 w-auto object-cover"
                style={{
                  objectPosition: '50% 50%',
                  clipPath: 'inset(30% 0 40% 0)'
                }}
              />
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-center">
              音楽活動の作品をまとめたポートフォリオサイト
            </p>
          </div>
          <nav className="flex gap-4 mt-2">
            <a
              href="/license"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 px-8 py-4 text-xl font-medium transition-colors"
            >
              License
            </a>
            <a
              href="/contact"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 px-8 py-4 text-xl font-medium transition-colors"
            >
              Contact
            </a>
          </nav>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="relative z-10">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {songs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">
                楽曲データがありません
              </p>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">
                {songs.length} 楽曲が見つかりました
              </p>
            </div>
          )}
          
          {/* スクロール用のスペーサー */}
          <div className="h-screen"></div>
          <div className="h-screen"></div>
          <div className="h-screen"></div>
          <div className="h-screen"></div>
          <div className="h-screen"></div>
          <div className="h-screen"></div>
          <div className="h-screen"></div>
          <div className="h-screen"></div>
          
          {/* プロフィールセクション */}
          {profile && (
            <section className="mt-16 bg-white/90 rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6 text-center">
                Profile
              </h2>
              
              <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* プロフィール画像 */}
                <div className="flex-shrink-0 mx-auto md:mx-0">
                  {profile.profileImage ? (
                    <img
                      src={profile.profileImage}
                      alt={profile.name}
                      className="w-32 h-32 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-gray-500 dark:text-gray-400 text-sm">画像</span>
                    </div>
                  )}
                </div>
                
                {/* プロフィール情報 */}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    {profile.name}
                  </h3>
                  
                  <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                    {profile.bio}
                  </p>
                  
                  <div className="mb-4">
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                      得意ジャンル
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.genres.map((genre, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {profile.equipment && (
                    <div className="mb-4">
                      <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                        使用機材・ソフト
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {profile.equipment}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                      連絡先
                    </h4>
                    <div className="flex gap-4 flex-wrap">
                      {profile.contact.email && (
                        <a href={`mailto:${profile.contact.email}`} 
                           className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
                          Email
                        </a>
                      )}
                      {profile.contact.twitter && (
                        <a href={profile.contact.twitter} 
                           className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                           target="_blank" rel="noopener noreferrer">
                          Twitter
                        </a>
                      )}
                      {profile.contact.soundcloud && (
                        <a href={profile.contact.soundcloud} 
                           className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                           target="_blank" rel="noopener noreferrer">
                          SoundCloud
                        </a>
                      )}
                      {profile.contact.bandcamp && (
                        <a href={profile.contact.bandcamp} 
                           className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                           target="_blank" rel="noopener noreferrer">
                          Bandcamp
                        </a>
                      )}
                      {profile.contact.youtube && (
                        <a href={profile.contact.youtube} 
                           className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                           target="_blank" rel="noopener noreferrer">
                          YouTube
                        </a>
                      )}
                      {profile.contact.instagram && (
                        <a href={profile.contact.instagram} 
                           className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                           target="_blank" rel="noopener noreferrer">
                          Instagram
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}