'use client'

import React, { useEffect, useState } from 'react'
import { Song } from './api/songs/route'
import { Profile } from './api/profile/route'

export default function Home() {
  const [songs, setSongs] = useState<Song[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scrollY, setScrollY] = useState(0)
  const [windowHeight, setWindowHeight] = useState(0)
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null)

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

  // パララックススクロールとウィンドウサイズのイベントリスナー
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    const handleResize = () => {
      setWindowHeight(window.innerHeight)
    }

    // 初期化
    setWindowHeight(window.innerHeight)

    window.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // カスタムスムーススクロール関数（ゆっくりとした引っ張られるようなアニメーション）
  const smoothScrollTo = (targetY: number) => {
    const startY = window.scrollY
    const distance = targetY - startY
    const duration = 400 // 0.4秒間のアニメーション
    let startTime: number | null = null

    // easeOutCubic - ゆっくりと減速する動き
    const easeOutCubic = (t: number): number => {
      return 1 - Math.pow(1 - t, 3)
    }

    const animateScroll = (currentTime: number) => {
      if (startTime === null) startTime = currentTime
      const timeElapsed = currentTime - startTime
      const progress = Math.min(timeElapsed / duration, 1)
      
      const easedProgress = easeOutCubic(progress)
      const currentY = startY + (distance * easedProgress)
      
      window.scrollTo(0, currentY)
      
      if (progress < 1) {
        requestAnimationFrame(animateScroll)
      }
    }

    requestAnimationFrame(animateScroll)
  }

  // パララックスレイヤーの色合い計算関数
  const calculateLayerFilter = (index: number, scrollY: number, windowHeight: number): string => {
    const layerStartPosition = (index * windowHeight)
    const layerEndPosition = layerStartPosition + windowHeight/4
    // const halfScreenExitPosition = layerEndPosition + windowHeight * 0.5

    // スクロール開始前（暗くする）
    if (scrollY < layerStartPosition) {
      const darknessFactor = Math.max(0, (layerStartPosition - scrollY) / windowHeight)
      const brightness = Math.max(0.3, 1 - darknessFactor * 0.7) // 最低30%の明度
      return `brightness(${brightness})`
    }
    
    // スクロール開始中（通常の色合い）
    if (scrollY >= layerStartPosition && scrollY <= layerEndPosition) {
      return 'brightness(1)'
    }
    
    // ブラウザ外に半分消えてから白っぽくする（半透明な白いレイヤー効果）
    if (scrollY > layerEndPosition) {
      const fadeDistance = scrollY - layerEndPosition
      const maxFadeDistance = windowHeight * 0.5
      const whitenessProgress = Math.min(1, fadeDistance / maxFadeDistance)
      
      // 白いレイヤーのオーバーレイ効果をCSSフィルターで再現
      const whiteLayerOpacity = whitenessProgress * 1 // 最大60%の白いレイヤー
      const saturateValue = Math.max(0.4, 1 - whitenessProgress * 0.6) // 彩度を下げる
      
      return `brightness(1.2) saturate(${saturateValue}) contrast(0.9) sepia(0.1) blur(0.3px))`
    }

    return 'brightness(1)'
  }

  // 音楽再生機能
  const playAudio = (song: Song, index: number) => {
    // 既存の音楽を停止
    if (audioRef) {
      audioRef.pause()
      audioRef.currentTime = 0
    }

    // 同じ楽曲の場合は停止
    if (currentlyPlaying === song.title) {
      setCurrentlyPlaying(null)
      setAudioRef(null)
      return
    }

    // クリックしたレイヤーの位置まで自動スクロール（ゆっくりとしたアニメーション）
    const targetScrollPosition = (songs.length - index) * windowHeight
    smoothScrollTo(targetScrollPosition)

    // 新しい音楽を再生
    const audio = new Audio(song.audioPath)
    audio.play().catch(error => {
      console.error('音楽の再生に失敗しました:', error)
    })
    
    audio.onended = () => {
      setCurrentlyPlaying(null)
      setAudioRef(null)
    }
    
    setCurrentlyPlaying(song.title)
    setAudioRef(audio)
  }

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
        <React.Fragment key={`parallax-${song.title}-${index}`}>
          {/* 背景画像レイヤー */}
          <div 
            key={`background-${song.title}-${index}`}
            className="fixed inset-0 w-full h-full"
            style={{
              backgroundImage: `url(${song.coverImagePath})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              transform: index === 0 
                ? `translateY(${scrollY * 1}px)` 
                : `translateY(${Math.max(0, (scrollY - (index * windowHeight)) * 1)}px)`,
              zIndex: -(index + 1),
              filter: calculateLayerFilter(index, scrollY, windowHeight),
              transition: 'filter 0.3s ease-out'
            }}
          />
          
          {/* クリック可能な透明レイヤー */}
          <div
            key={`clickable-${song.title}`}
            className="fixed inset-0 w-full h-full cursor-pointer transition-all duration-300"
            style={{
              transform: index === 0 
                ? `translateY(${scrollY * 1}px)` 
                : `translateY(${Math.max(0, (scrollY - ((songs.length - index) * windowHeight)) * 1)}px)`,
              zIndex: 100 + index,
              // backgroundColor: `hsl(${index * 360 / songs.length}, 70%, 50%, 0.3)`,
              // border: `4px solid hsl(${index * 360 / songs.length}, 70%, 40%)`
            }}
            onClick={(e) => {
              console.log('パララックス背景がクリックされました:', song.title)
              e.preventDefault()
              playAudio(song, index)
            }}
            title={`${song.title} - クリックで再生`}
          >
          {/* 再生中インジケーター */}
          {currentlyPlaying === song.title && (
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg">
              <div className="flex space-x-1">
                <div className="w-1 h-6 bg-blue-500 rounded animate-pulse"></div>
                <div className="w-1 h-6 bg-blue-500 rounded animate-pulse delay-100"></div>
                <div className="w-1 h-6 bg-blue-500 rounded animate-pulse delay-200"></div>
              </div>
            </div>
          )}
          
          </div>
        </React.Fragment>
      ))}


      {/* ヘッダー */}
      <header className="relative z-20 bg-white shadow-sm">
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
          
          {/* スクロール用のスペーサー - パララックスレイヤー数に合わせて動的生成 */}
          {songs.slice(0, -1).map((_, index) => (
            <div key={`spacer-${index}`} className="h-[100vh]"></div>
          ))}
          <div key={`spacer-offset`} className="h-[100vh]"></div>
          
          {/* プロフィールセクション - パララックススクロール対応 */}
          <div 
            className="h-screen flex items-center justify-center py-4 relative"
            style={{
              transform: `translateY(${Math.max(0, (scrollY - (songs.length * windowHeight)) * 0.5)}px)`,
            }}
          >
            {profile && (
              <section className="bg-white/90 rounded-lg shadow-md p-3 w-full max-w-3xl mx-auto">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 text-center">
                Profile
              </h2>
              
              <div className="flex flex-col md:flex-row gap-4 items-start">
                {/* プロフィール画像 */}
                <div className="flex-shrink-0 mx-auto md:mx-0">
                  {profile.profileImage ? (
                    <img
                      src={profile.profileImage}
                      alt={profile.name}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-gray-500 dark:text-gray-400 text-sm">画像</span>
                    </div>
                  )}
                </div>
                
                {/* プロフィール情報 */}
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {profile.name}
                  </h3>
                  
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                    {profile.bio}
                  </p>
                  
                  <div className="mb-2">
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
                      得意ジャンル
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.genres.map((genre, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-full text-xs"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {profile.equipment && (
                    <div className="mb-2">
                      <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
                        使用機材・ソフト
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400 text-xs">
                        {profile.equipment}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
                      連絡先
                    </h4>
                    <div className="flex gap-4 flex-wrap">
                      {profile.contact.email && (
                        <a href={`mailto:${profile.contact.email}`} 
                           className="text-blue-600 dark:text-blue-400 hover:underline text-xs">
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
          

        </div>
      </main>
    </div>
  )
}