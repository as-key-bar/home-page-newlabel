'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Song } from './api/songs/route'
import { Profile } from '../lib/firestore'
import LoadingScreen from '../components/LoadingScreen'
import SlideMenu from '../components/SlideMenu'
import SideDecorations from '../components/top/SideDecorations'
import HeroHeaderLayer from '../components/top/HeroHeaderLayer'
import ProfileSection from '../components/top/ProfileSection'
import SongParallaxLayer from '../components/top/SongParallaxLayer'

export default function Home() {
  const [songs, setSongs] = useState<Song[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isExiting, setIsExiting] = useState(false)
  const [loadingStartTime] = useState(Date.now())
  const [error, setError] = useState<string | null>(null)
  const [scrollY, setScrollY] = useState(0)
  const [windowHeight, setWindowHeight] = useState(0)
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null)
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null)
  const [backgroundSizes, setBackgroundSizes] = useState<Map<number, number>>(new Map())
  const [playingDarkenedSongs, setPlayingDarkenedSongs] = useState<Set<number>>(new Set())
  const [showingSongInfo, setShowingSongInfo] = useState<number | null>(null)
  const [isAtBottom, setIsAtBottom] = useState(false)
  const [showInitialLoading, setShowInitialLoading] = useState(true)
  const [volume, setVolume] = useState(0.05) // 初期値5%
  const [imagesLoaded, setImagesLoaded] = useState(false) // 画像読み込み完了状態

  // 최신 backgroundSizes をアニメーション関数から参照するための ref
  const backgroundSizesRef = useRef<Map<number, number>>(new Map())
  useEffect(() => {
    backgroundSizesRef.current = backgroundSizes
  }, [backgroundSizes])

  // 画像事前読み込み関数
  const preloadImages = useCallback(async (imagePaths: string[]): Promise<void> => {
    const loadPromises = imagePaths.map((path) => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve()
        img.onerror = () => reject(new Error(`Failed to load image: ${path}`))
        img.src = path
      })
    })

    try {
      await Promise.all(loadPromises)
      setImagesLoaded(true)
    } catch (err) {
      console.error('Image preloading failed:', err)
      setImagesLoaded(true)
    }
  }, [])

  // サイト内遷移の検知
  useEffect(() => {
    const hasVisited = sessionStorage.getItem('hasVisitedSite')
    if (hasVisited) {
      setShowInitialLoading(false)
    } else {
      sessionStorage.setItem('hasVisitedSite', 'true')
    }
  }, [])

  // データ取得とローディング制御
  useEffect(() => {
    const loadData = async () => {
      try {
        const { db } = await import('../lib/firebase')
        const { collection, getDocs, query, orderBy, where, doc, getDoc } = await import(
          'firebase/firestore'
        )

        // 楽曲データ取得（トップページ表示対象のみ）
        const songsCollection = collection(db, 'songs')
        const songsQuery = query(songsCollection, where('visible', '==', true), orderBy('order'))
        const songsSnapshot = await getDocs(songsQuery)
        const songsData = songsSnapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }) as Song)
          .filter((song) => song.showInTop !== false)
        setSongs(songsData)

        // プロフィールデータ取得
        const profileRef = doc(db, 'settings', 'profile')
        const profileSnapshot = await getDoc(profileRef)
        let profileData: Profile | null = null
        if (profileSnapshot.exists()) {
          profileData = profileSnapshot.data() as Profile
          setProfile(profileData)
        }

        // 画像事前読み込み
        const imagesToPreload: string[] = ['/images/newlabel_logo.png']
        if (profileData?.profileImage) {
          imagesToPreload.push(profileData.profileImage)
        }
        songsData.forEach((song) => {
          if (song.coverImagePath) {
            imagesToPreload.push(song.coverImagePath)
          }
        })

        await preloadImages(imagesToPreload)
      } catch (err) {
        console.error('直接データ取得エラー:', err)
        // フォールバック: API経由で取得
        Promise.all([
          fetch('/api/songs').then((res) => res.json()),
          fetch('/api/profile').then((res) => res.json())
        ])
          .then(([songsData, profileData]) => {
            if (songsData && Array.isArray(songsData.songs)) {
              const visibleSongs = songsData.songs.filter(
                (song: Song) => song.visible === true && song.showInTop !== false
              )
              setSongs(visibleSongs)
            } else {
              setError('楽曲データの読み込みに失敗しました')
            }

            if (profileData && !profileData.error) {
              setProfile(profileData)
            }

            const imagesToPreload: string[] = ['/images/newlabel_logo.png']
            if (profileData?.profileImage) {
              imagesToPreload.push(profileData.profileImage)
            }
            if (Array.isArray(songsData?.songs)) {
              songsData.songs.forEach((song: Song) => {
                if (song.coverImagePath) {
                  imagesToPreload.push(song.coverImagePath)
                }
              })
            }

            preloadImages(imagesToPreload)
          })
          .catch((fallbackErr) => {
            setError('データの読み込みに失敗しました')
            console.error(fallbackErr)
            preloadImages(['/images/newlabel_logo.png'])
          })
      }
    }

    loadData().finally(() => {
      const currentTime = Date.now()
      const elapsedTime = currentTime - loadingStartTime
      const minimumDisplayTime = 1000 // 最低1秒表示
      const remainingTime = Math.max(0, minimumDisplayTime - elapsedTime)

      if (!showInitialLoading) {
        setLoading(false)
        return
      }

      const waitForImages = () => {
        if (imagesLoaded) {
          setTimeout(() => {
            setIsExiting(true)
            setTimeout(() => {
              setLoading(false)
            }, 1200)
          }, remainingTime)
        } else {
          setTimeout(waitForImages, 100)
        }
      }

      waitForImages()
    })
  }, [showInitialLoading, imagesLoaded, loadingStartTime, preloadImages])

  // パララックススクロールとウィンドウサイズのイベントリスナー（requestAnimationFrame + passive による軽量化）
  useEffect(() => {
    let ticking = false

    const handleScroll = () => {
      if (ticking) return
      ticking = true

      requestAnimationFrame(() => {
        const currentScrollY = window.scrollY
        setScrollY(currentScrollY)

        const documentHeight = document.documentElement.scrollHeight
        const winHeight = window.innerHeight
        const scrollBottom = currentScrollY + winHeight
        const threshold = 100

        setIsAtBottom(scrollBottom >= documentHeight - threshold)
        ticking = false
      })
    }

    const handleResize = () => {
      setWindowHeight(window.innerHeight)
    }

    setWindowHeight(window.innerHeight)

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // 滑らかな背景サイズアニメーション関数
  const animateBackgroundSize = useCallback(
    (songId: number, targetSize: number, duration: number = 1200) => {
      const startTime = Date.now()
      const currentSize = backgroundSizesRef.current.get(songId) || 135
      const sizeDifference = targetSize - currentSize

      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)

        // easeOutCubic
        const easedProgress = 1 - Math.pow(1 - progress, 3)
        const currentAnimatedSize = currentSize + sizeDifference * easedProgress

        setBackgroundSizes((prev) => new Map(prev).set(songId, currentAnimatedSize))

        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }

      requestAnimationFrame(animate)
    },
    []
  )

  // スペースキーによる再生停止のキーボードイベントリスナー
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' && currentlyPlaying && audioRef) {
        event.preventDefault()

        audioRef.pause()
        audioRef.currentTime = 0

        animateBackgroundSize(currentlyPlaying, 135, 800)
        setPlayingDarkenedSongs((prev) => {
          const newSet = new Set(prev)
          newSet.delete(currentlyPlaying)
          return newSet
        })
        setShowingSongInfo(null)

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
  }, [currentlyPlaying, audioRef, animateBackgroundSize])

  // 音量変更時に現在再生中の音楽の音量を更新
  useEffect(() => {
    if (audioRef) {
      audioRef.volume = volume
    }
  }, [volume, audioRef])

  // レスポンシブ対応のスペーサー高さ計算関数
  const getResponsiveSpacerHeight = () => {
    if (windowHeight === 0) return windowHeight
    return windowHeight
  }

  // バッファ高さ計算関数（ヘッダー後の空白スペース）
  const getBufferHeight = () => {
    return getResponsiveSpacerHeight()
  }

  // カスタムスムーススクロール関数
  const smoothScrollTo = (targetY: number) => {
    const startY = window.scrollY
    const distance = targetY - startY
    const duration = 400
    let startTime: number | null = null

    const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3)

    const animateScroll = (currentTime: number) => {
      if (startTime === null) startTime = currentTime
      const timeElapsed = currentTime - startTime
      const progress = Math.min(timeElapsed / duration, 1)

      const easedProgress = easeOutCubic(progress)
      const currentY = startY + distance * easedProgress

      window.scrollTo(0, currentY)

      if (progress < 1) {
        requestAnimationFrame(animateScroll)
      }
    }

    requestAnimationFrame(animateScroll)
  }

  // パララックスレイヤーの色合い計算関数（再生状態も考慮）
  const calculateLayerFilter = (index: number, currentScrollY: number, song?: Song): string => {
    const spacerHeight = getResponsiveSpacerHeight()
    const bufferHeight = getBufferHeight()
    const layerStartPosition = bufferHeight + index * spacerHeight
    const layerEndPosition = layerStartPosition + spacerHeight / 4

    const isPlayingDarkened = song && playingDarkenedSongs.has(parseInt(song.id))

    if (currentScrollY < layerStartPosition) {
      const darknessFactor = Math.max(0, (layerStartPosition - currentScrollY) / spacerHeight / 2)
      const brightness = Math.max(0.3, 1 - darknessFactor * 0.85)
      const playingDarkness = isPlayingDarkened ? 0.7 : 1
      return `brightness(${brightness * playingDarkness})`
    }

    if (currentScrollY >= layerStartPosition && currentScrollY <= layerEndPosition) {
      const playingDarkness = isPlayingDarkened ? 0.7 : 1
      return `brightness(${playingDarkness})`
    }

    if (currentScrollY > layerEndPosition) {
      const fadeDistance = currentScrollY - layerEndPosition
      const maxFadeDistance = spacerHeight * 0.5
      const whitenessProgress = Math.min(1, fadeDistance / maxFadeDistance)

      const saturateValue = Math.max(0.4, 1 - whitenessProgress * 0.6)
      const baseBrightness = isPlayingDarkened ? 0.84 : 1.2

      return `brightness(${baseBrightness}) saturate(${saturateValue}) contrast(0.9) sepia(0.1) blur(0.3px)`
    }

    const playingDarkness = isPlayingDarkened ? 0.7 : 1
    return `brightness(${playingDarkness})`
  }

  // 背景サイズ計算関数
  const calculateBackgroundSize = (song: Song): string => {
    const animatedSize = backgroundSizes.get(parseInt(song.id)) || 135
    if (typeof window === 'undefined' || windowHeight === 0) return `${animatedSize}%`

    const aspectRatio = window.innerWidth / windowHeight
    if (aspectRatio < 1) {
      return 'cover'
    }
    return `${animatedSize}%`
  }

  // ヘッダースクロールと一番目の楽曲再生
  const handleHeaderScrollClick = () => {
    if (songs.length === 0) return

    const targetScrollPosition = getBufferHeight()
    smoothScrollTo(targetScrollPosition)

    setTimeout(() => {
      playAudio(songs[0], 0)
    }, 600)
  }

  // 音楽再生機能
  const playAudio = (song: Song, index: number) => {
    if (audioRef) {
      audioRef.pause()
      audioRef.currentTime = 0

      if (currentlyPlaying) {
        animateBackgroundSize(currentlyPlaying, 135, 800)
        setPlayingDarkenedSongs((prev) => {
          const newSet = new Set(prev)
          newSet.delete(currentlyPlaying)
          return newSet
        })
        setShowingSongInfo(null)
      }

      setTimeout(() => {
        setCurrentlyPlaying(null)
        setAudioRef(null)
      }, 100)
    }

    // 同じ楽曲の場合は停止
    if (currentlyPlaying === parseInt(song.id)) {
      animateBackgroundSize(parseInt(song.id), 135, 800)
      setPlayingDarkenedSongs((prev) => {
        const newSet = new Set(prev)
        newSet.delete(parseInt(song.id))
        return newSet
      })
      setShowingSongInfo(null)

      setTimeout(() => {
        setCurrentlyPlaying(null)
        setAudioRef(null)
      }, 100)
      return
    }

    // クリックしたレイヤーの位置まで自動スクロール
    const spacerHeight = getResponsiveSpacerHeight()
    const bufferHeight = getBufferHeight()
    const targetScrollPosition = bufferHeight + index * spacerHeight
    smoothScrollTo(targetScrollPosition)

    // 縮小アニメーション開始 (135% → 100%)
    animateBackgroundSize(parseInt(song.id), 100, 1200)

    const audio = new Audio(song.audioPath)
    audio.volume = volume

    setTimeout(() => {
      audio.play().catch((err) => {
        console.error('音楽の再生に失敗しました:', err)
        animateBackgroundSize(parseInt(song.id), 135, 400)
      })
      setCurrentlyPlaying(parseInt(song.id))
      setAudioRef(audio)

      setTimeout(() => {
        setPlayingDarkenedSongs((prev) => {
          const newSet = new Set(prev)
          newSet.add(parseInt(song.id))
          return newSet
        })
      }, 1000)

      setTimeout(() => {
        setShowingSongInfo(parseInt(song.id))
      }, 1500)
    }, 300)

    audio.onended = () => {
      animateBackgroundSize(parseInt(song.id), 135, 800)
      setPlayingDarkenedSongs((prev) => {
        const newSet = new Set(prev)
        newSet.delete(parseInt(song.id))
        return newSet
      })
      setShowingSongInfo(null)
      setTimeout(() => {
        setCurrentlyPlaying(null)
        setAudioRef(null)
      }, 100)
    }
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

  const bufferHeight = getBufferHeight()
  const spacerHeight = getResponsiveSpacerHeight()

  return (
    <>
      {loading && <LoadingScreen isExiting={isExiting} />}

      <div className="relative select-none">
        {/* 画面両端のドット列・三角形列 */}
        <SideDecorations scrollY={scrollY} />

        {/* スライドメニュー */}
        <SlideMenu volume={volume} onVolumeChange={setVolume} isLoading={loading} />

        {/* ヘッダーパララックスレイヤー */}
        <HeroHeaderLayer
          scrollY={scrollY}
          songsCount={songs.length}
          onScrollClick={handleHeaderScrollClick}
        />

        {/* プロフィールパララックス＆最下部インタラクティブレイヤー */}
        <ProfileSection
          profile={profile}
          songsCount={songs.length}
          isAtBottom={isAtBottom}
        />

        {/* パララックス背景レイヤー（各楽曲） */}
        {songs.map((song, index) => {
          const songNumericId = parseInt(song.id)
          return (
            <SongParallaxLayer
              key={`parallax-${songNumericId}-${index}`}
              song={song}
              index={index}
              scrollY={scrollY}
              bufferHeight={bufferHeight}
              spacerHeight={spacerHeight}
              backgroundSize={calculateBackgroundSize(song)}
              layerFilter={calculateLayerFilter(index, scrollY, song)}
              isCurrentlyPlaying={currentlyPlaying === songNumericId}
              isShowingInfo={showingSongInfo === songNumericId}
              onPlay={playAudio}
            />
          )
        })}

        {/* メインコンテンツ（スクロールスペーサー） */}
        <main className="relative z-10 pointer-events-none select-none">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">
                {songs.length === 0
                  ? '楽曲データがありません'
                  : `${songs.length} 楽曲が見つかりました`}
              </p>
            </div>

            {/* バッファスペーサー */}
            <div className="h-[90vh] md:h-[90vh] lg:h-[100vh]" />

            {/* 楽曲ごとのスペーサー */}
            {songs.slice(0, -1).map((_, index) => (
              <div key={`spacer-${index}`} className="h-[70vh] md:h-[75vh] lg:h-[100vh]" />
            ))}
            <div className="h-[100vh] md:h-[100vh] lg:h-[100vh]" />
            <div className="h-[250vh] md:h-[150vh] lg:h-[100vh]" />
          </div>
        </main>
      </div>
    </>
  )
}
