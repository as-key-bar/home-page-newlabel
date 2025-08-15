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
  const [animatingTo, setAnimatingTo] = useState<string | null>(null)
  const [backgroundSizes, setBackgroundSizes] = useState<Map<string, number>>(new Map())
  const [playingDarkenedSongs, setPlayingDarkenedSongs] = useState<Set<string>>(new Set())
  const [showingSongInfo, setShowingSongInfo] = useState<string | null>(null)

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

  // 滑らかな背景サイズアニメーション関数
  const animateBackgroundSize = (songTitle: string, targetSize: number, duration: number = 1200) => {
    const startTime = Date.now()
    const currentSize = backgroundSizes.get(songTitle) || 135
    const sizeDifference = targetSize - currentSize
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // easeOutCubic - スクロールアニメーションと同じカーブ
      const easedProgress = 1 - Math.pow(1 - progress, 3)
      const currentAnimatedSize = currentSize + (sizeDifference * easedProgress)
      
      setBackgroundSizes(prev => new Map(prev).set(songTitle, currentAnimatedSize))
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    requestAnimationFrame(animate)
  }

  // スペースキーによる再生停止のキーボードイベントリスナー
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // スペースキーが押されて、再生中の楽曲がある場合のみ停止
      if (event.code === 'Space' && currentlyPlaying && audioRef) {
        event.preventDefault() // ページスクロールを防止
        
        // 音楽停止
        audioRef.pause()
        audioRef.currentTime = 0
        
        // 拡大アニメーションと明るさ復帰
        animateBackgroundSize(currentlyPlaying, 135, 800)
        // 暗くなった状態から明るさを復帰
        setPlayingDarkenedSongs(prev => {
          const newSet = new Set(prev)
          newSet.delete(currentlyPlaying)
          return newSet
        })
        // 楽曲情報表示を隠す
        setShowingSongInfo(null)
        
        // 状態リセット
        setTimeout(() => {
          setCurrentlyPlaying(null)
          setAudioRef(null)
        }, 100)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [currentlyPlaying, audioRef, backgroundSizes])

  // レスポンシブ対応のスペーサー高さ計算関数
  const getResponsiveSpacerHeight = () => {
    if (windowHeight === 0) return windowHeight
    const windowWidth = window.innerWidth
    // モバイル: 70vh, タブレット: 75vh, デスクトップ: 100vh
    if (windowWidth <= 768) return windowHeight * 0.7  // モバイル
    if (windowWidth <= 1024) return windowHeight * 0.70 // タブレット（80vh→70vhに短縮）
    return windowHeight  // デスクトップ
  }

  // プロフィールセクションの開始位置計算関数
  const getProfileStartPosition = () => {
    const spacerHeight = getResponsiveSpacerHeight()
    const totalSpacers = songs.length // オフセットスペーサーも含む
    return totalSpacers * spacerHeight
  }

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

  // パララックスレイヤーの色合い計算関数（再生状態も考慮）
  const calculateLayerFilter = (index: number, scrollY: number, windowHeight: number, song?: Song): string => {
    const spacerHeight = getResponsiveSpacerHeight()
    const layerStartPosition = (index * spacerHeight)
    const layerEndPosition = layerStartPosition + spacerHeight/4
    
    // 再生中で0.5秒後に暗くなった楽曲かどうかチェック
    const isPlayingDarkened = song && playingDarkenedSongs.has(song.title)
    
    // スクロール開始前（暗くする）
    if (scrollY < layerStartPosition) {
      const darknessFactor = Math.max(0, (layerStartPosition - scrollY) / spacerHeight)
      const brightness = Math.max(0.3, 1 - darknessFactor * 0.7) // 最低30%の明度
      // 再生中の場合はさらに暗く
      const playingDarkness = isPlayingDarkened ? 0.7 : 1
      return `brightness(${brightness * playingDarkness})`
    }
    
    // スクロール開始中（通常の色合いまたは再生中の暗さ）
    if (scrollY >= layerStartPosition && scrollY <= layerEndPosition) {
      const playingDarkness = isPlayingDarkened ? 0.7 : 1
      return `brightness(${playingDarkness})`
    }
    
    // ブラウザ外に半分消えてから白っぽくする（半透明な白いレイヤー効果）
    if (scrollY > layerEndPosition) {
      const fadeDistance = scrollY - layerEndPosition
      const maxFadeDistance = spacerHeight * 0.5
      const whitenessProgress = Math.min(1, fadeDistance / maxFadeDistance)
      
      // 白いレイヤーのオーバーレイ効果をCSSフィルターで再現
      const whiteLayerOpacity = whitenessProgress * 1 // 最大60%の白いレイヤー
      const saturateValue = Math.max(0.4, 1 - whitenessProgress * 0.6) // 彩度を下げる
      // 再生中の場合はベースの明度を下げる
      const baseBrightness = isPlayingDarkened ? 0.84 : 1.2 // 1.2 * 0.7 = 0.84
      
      return `brightness(${baseBrightness}) saturate(${saturateValue}) contrast(0.9) sepia(0.1) blur(0.3px))`
    }

    const playingDarkness = isPlayingDarkened ? 0.7 : 1
    return `brightness(${playingDarkness})`
  }

  // 背景サイズ計算関数（アニメーション状態を反映）
  const calculateBackgroundSize = (song: Song): string => {
    const animatedSize = backgroundSizes.get(song.title) || 135
    return `${animatedSize}%`
  }

  // 音楽再生機能（滑らかな背景アニメーション対応）
  const playAudio = (song: Song, index: number) => {
    // 既存の音楽を停止（縮小アニメーション開始）
    if (audioRef) {
      audioRef.pause()
      audioRef.currentTime = 0
      
      // 既存楽曲の拡大アニメーションと明るさ復帰 (135%に戻す)
      if (currentlyPlaying) {
        animateBackgroundSize(currentlyPlaying, 135, 800) // 少し早めの拡大
        // 暗くなった状態から明るさを復帰
        setPlayingDarkenedSongs(prev => {
          const newSet = new Set(prev)
          newSet.delete(currentlyPlaying)
          return newSet
        })
        // 楽曲情報表示を隠す
        setShowingSongInfo(null)
      }
      
      setTimeout(() => {
        setCurrentlyPlaying(null)
        setAudioRef(null)
      }, 100)
    }

    // 同じ楽曲の場合は停止
    if (currentlyPlaying === song.title) {
      // 拡大アニメーションと明るさ復帰 (135%に戻す)
      animateBackgroundSize(song.title, 135, 800)
      // 暗くなった状態から明るさを復帰
      setPlayingDarkenedSongs(prev => {
        const newSet = new Set(prev)
        newSet.delete(song.title)
        return newSet
      })
      // 楽曲情報表示を隠す
      setShowingSongInfo(null)
      
      setTimeout(() => {
        setCurrentlyPlaying(null)
        setAudioRef(null)
      }, 100)
      return
    }

    // クリックしたレイヤーの位置まで自動スクロール
    const spacerHeight = getResponsiveSpacerHeight()
    const targetScrollPosition = (index) * spacerHeight
    smoothScrollTo(targetScrollPosition)

    // 縮小アニメーション開始 (135% → 100%への滑らかな縮小)
    animateBackgroundSize(song.title, 100, 1200)

    // 音楽再生準備
    const audio = new Audio(song.audioPath)
    
    // アニメーション開始と同時に音楽再生
    setTimeout(() => {
      audio.play().catch(error => {
        console.error('音楽の再生に失敗しました:', error)
        // エラー時は拡大
        animateBackgroundSize(song.title, 135, 400)
      })
      setCurrentlyPlaying(song.title)
      setAudioRef(audio)
      
      // 1秒後に画像を暗くする
      setTimeout(() => {
        setPlayingDarkenedSongs(prev => {
          const newSet = new Set(prev)
          newSet.add(song.title)
          return newSet
        })
      }, 1000)
      
      // 1.5秒後に楽曲情報を表示する
      setTimeout(() => {
        setShowingSongInfo(song.title)
      }, 1500) 
    }, 300) // 拡大アニメーション開始後少し遅らせて音楽再生
    
    audio.onended = () => {
      // 楽曲終了時の拡大アニメーションと明るさ復帰
      animateBackgroundSize(song.title, 135, 800)
      // 暗くなった状態から明るさを復帰
      setPlayingDarkenedSongs(prev => {
        const newSet = new Set(prev)
        newSet.delete(song.title)
        return newSet
      })
      // 楽曲情報表示を隠す
      setShowingSongInfo(null)
      setTimeout(() => {
        setCurrentlyPlaying(null)
        setAudioRef(null)
      }, 100)
    }
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
              backgroundSize: calculateBackgroundSize(song),
              backgroundPosition: index === 0 
                ? `center ${50 + (scrollY * 0.08)}%`
                : `center ${50 + (Math.max(0, scrollY - (index * getResponsiveSpacerHeight())) * 0.05)}%`,
              backgroundRepeat: 'no-repeat',
              transform: index === 0 
                ? `translateY(${scrollY * 1}px)` 
                : `translateY(${Math.max(0, (scrollY - (index * getResponsiveSpacerHeight())) * 1)}px)`,
              zIndex: -(index + 1),
              filter: `${calculateLayerFilter(index, scrollY, windowHeight, song)} drop-shadow(0 10px 25px rgba(0, 0, 0, 1)) drop-shadow(0 4px 8px rgba(0, 0, 0, 1))`,
              transition: 'filter 0.3s ease-out, transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }}
          >
            {/* 楽曲情報表示 (1.5秒後) - 背景画像レイヤー内に配置 */}
            {showingSongInfo === song.title && (
              <div 
                className="absolute right-4 top-1/2 transform -translate-y-2 text-white bg-transparent text-right opacity-0 translate-x-5 animate-fade-in w-2/5 max-w-2/5 pr-2"
                style={{
                  animation: 'fadeIn 1000ms ease-out forwards'
                }}
              >
                <h3 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-8xl font-bold mb-2 md:mb-4 drop-shadow-lg break-words leading-tight">
                  {song.title}
                </h3>
                <p className="text-lg sm:text-2xl md:text-3xl lg:text-5xl xl:text-7xl font-medium mb-2 md:mb-4 drop-shadow-md break-words leading-tight" style={{ opacity: 0.9 }}>
                  {song.artist}
                </p>
                <p className="text-sm sm:text-lg md:text-xl lg:text-2xl xl:text-4xl font-normal drop-shadow-md break-words leading-tight" style={{ opacity: 0.75 }}>
                  {song.album} • {song.genre}
                </p>
                <style jsx global>{`
                  @keyframes fadeIn {
                    from {
                      opacity: 0;
                      transform: translateY(-50%) translateX(20px);
                    }
                    to {
                      opacity: 1;
                      transform: translateY(-50%) translateX(0);
                    }
                  }
                `}</style>
              </div>
            )}
          </div>
          
          {/* クリック可能な透明レイヤー */}
          <div
            key={`clickable-${song.title}`}
            className="fixed inset-0 w-full h-full cursor-pointer transition-all duration-300"
            style={{
              transform: index === 0 
                ? `translateY(${scrollY * 1}px)` 
                : `translateY(${Math.max(0, (scrollY - (index * getResponsiveSpacerHeight())) * 1)}px)`,
              zIndex: 100 - index,
              transition: 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
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

          {/* 楽曲情報表示 (1.5秒後) */}
          {showingSongInfo === song.title && (
            <div 
              className="absolute right-4 top-1/2 transform -translate-y-2 text-white bg-transparent text-right opacity-0 translate-x-5 animate-fade-in w-2/5 max-w-2/5 pr-2"
              style={{
                animation: 'fadeIn 1000ms ease-out forwards',
                zIndex: -(index + 2)  // 背景画像レイヤーより1つ下に配置
              }}
            >
              <h3 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-8xl font-bold mb-2 md:mb-4 drop-shadow-lg break-words leading-tight">
                {song.title}
              </h3>
              <p className="text-lg sm:text-2xl md:text-3xl lg:text-5xl xl:text-7xl font-medium mb-2 md:mb-4 drop-shadow-md break-words leading-tight" style={{ opacity: 0.9 }}>
                {song.artist}
              </p>
              <p className="text-sm sm:text-lg md:text-xl lg:text-2xl xl:text-4xl font-normal drop-shadow-md break-words leading-tight" style={{ opacity: 0.75 }}>
                {song.album} • {song.genre}
              </p>
              <style jsx global>{`
                @keyframes fadeIn {
                  from {
                    opacity: 0;
                    transform: translateY(-50%) translateX(20px);
                  }
                  to {
                    opacity: 1;
                    transform: translateY(-50%) translateX(0);
                  }
                }
              `}</style>
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
          
          {/* スクロール用のスペーサー - パララックスレイヤー数に合わせて動的生成（モバイル対応） */}
          {songs.slice(0, -1).map((_, index) => (
            <div key={`spacer-${index}`} className="h-[70vh] md:h-[75vh] lg:h-[100vh]"></div>
          ))}
          <div key={`spacer-offset`} className="h-[70vh] md:h-[75vh] lg:h-[100vh]"></div>
          
          {/* プロフィールセクション - パララックススクロール対応 */}
          <div 
            className="h-screen flex items-center justify-center py-4 relative"
            style={{
              transform: `translateY(${Math.max(0, (scrollY - getProfileStartPosition()) * 0.5)}px)`,
              transition: 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
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