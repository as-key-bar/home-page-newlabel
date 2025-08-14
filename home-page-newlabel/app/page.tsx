'use client'

import { useEffect, useState } from 'react'
import SongCard from '../components/SongCard'
import { Song } from './api/songs/route'
import { Profile } from './api/profile/route'

export default function Home() {
  const [songs, setSongs] = useState<Song[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Music Portfolio
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            音楽活動の作品をまとめたポートフォリオサイト
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {songs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              楽曲データがありません
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                楽曲一覧
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {songs.length} 楽曲
              </p>
            </div>
            
            {songs.map((song, index) => (
              <SongCard key={index} song={song} />
            ))}
          </div>
        )}
        
{/* プロフィールセクション */}
        {profile && (
          <section className="mt-16 bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
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
      </main>
    </div>
  )
}