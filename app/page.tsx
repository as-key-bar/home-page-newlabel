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
import MobileSongSwitcher from '../components/top/MobileSongSwitcher'

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
  const [zoomedOutSongs, setZoomedOutSongs] = useState<Set<number>>(new Set())
  const [playingDarkenedSongs, setPlayingDarkenedSongs] = useState<Set<number>>(new Set())
  const [showingSongInfo, setShowingSongInfo] = useState<number | null>(null)
  const [isAtBottom, setIsAtBottom] = useState(false)
  const [showInitialLoading, setShowInitialLoading] = useState(true)
  const [volume, setVolume] = useState(0.05) // 初期値5%
  const [imagesLoaded, setImagesLoaded] = useState(false)
  const playTimeoutsRef = useRef<number[]>([])

  const clearPlayTimeouts = useCallback(() => {
    playTimeoutsRef.current.forEach((id) => window.clearTimeout(id))
    playTimeoutsRef.current = []
  }, [])

  // 画像事前読み込み関数（初期表示に必要な上位3枚＋ロゴのみをブロッキング対象にして初期表示も高速化）
  const preloadImages = useCallback(async (imagePaths: string[]): Promise<void> => {
    const priorityPaths = imagePaths.slice(0, 4)
    const deferredPaths = imagePaths.slice(4)

    const loadPromises = priorityPaths.map((path) => {
      return new Promise<void>((resolve) => {
        const img = new Image()
        img.onload = () => resolve()
        img.onerror = () => resolve()
        img.src = path
      })
    })

    try {
      await Promise.all(loadPromises)
    } finally {
      setImagesLoaded(true)
      // 残りの画像はアイドル時にバックグラウンドでプリロード
      if (deferredPaths.length > 0) {
        setTimeout(() => {
          deferredPaths.forEach((path) => {
            const img = new Image()
            img.src = path
          })
        }, 300)
      }
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

        // 楽曲データ取得（公開対象を取得し、/work ページ用のキャッシュにも保存）
        const songsCollection = collection(db, 'songs')
        const songsQuery = query(songsCollection, where('visible', '==', true), orderBy('order'))
        const songsSnapshot = await getDocs(songsQuery)
        const allVisibleSongs = songsSnapshot.docs.map(
          (d, index) =>
            ({
              ...d.data(),
              id: d.id,
              order: typeof d.data().order === 'number' ? d.data().order : index + 1
            }) as Song
        )
        const { setCachedVisibleSongs, prefetchWorksData } = await import('../lib/firestore')
        setCachedVisibleSongs(allVisibleSongs)
        // /work ページの動画実績も同時にバックグラウンドで先読み開始
        prefetchWorksData().catch(() => {})
        const songsData = allVisibleSongs.filter((song) => song.showInTop !== false)
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
        songsData.forEach((song) => {
          if (song.coverImagePath) {
            imagesToPreload.push(song.coverImagePath)
          }
        })
        if (profileData?.profileImage) {
          imagesToPreload.push(profileData.profileImage)
        }

        await preloadImages(imagesToPreload)
      } catch (err) {
        console.error('直接データ取得エラー:', err)
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
            if (Array.isArray(songsData?.songs)) {
              songsData.songs.forEach((song: Song) => {
                if (song.coverImagePath) {
                  imagesToPreload.push(song.coverImagePath)
                }
              })
            }
            if (profileData?.profileImage) {
              imagesToPreload.push(profileData.profileImage)
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
      const minimumDisplayTime = 1000
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

  // パララックススクロールとウィンドウサイズのイベントリスナー
  // モバイルのアドレスバー伸縮によるガタつきを防ぐため、横幅が変わった時のみ高さを再計算
  const lastWindowWidthRef = useRef(0)

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
      const currentWidth = window.innerWidth
      if (Math.abs(currentWidth - lastWindowWidthRef.current) > 10) {
        lastWindowWidthRef.current = currentWidth
        setWindowHeight(window.innerHeight)
      }
    }

    lastWindowWidthRef.current = window.innerWidth
    setWindowHeight(window.innerHeight)

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // GPU scale3d によるズーム状態切り替えヘルパー
  const setSongZoomedOut = useCallback((songId: number, zoomedOut: boolean) => {
    setZoomedOutSongs((prev) => {
      const next = new Set(prev)
      if (zoomedOut) {
        next.add(songId)
      } else {
        next.delete(songId)
      }
      return next
    })
  }, [])

  // スペースキーによる再生停止のキーボードイベントリスナー
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' && currentlyPlaying && audioRef) {
        event.preventDefault()

        audioRef.pause()
        audioRef.currentTime = 0

        setSongZoomedOut(currentlyPlaying, false)
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
  }, [currentlyPlaying, audioRef, setSongZoomedOut])

  // 音量変更時に現在再生中の音楽の音量を更新
  useEffect(() => {
    if (audioRef) {
      audioRef.volume = volume
    }
  }, [volume, audioRef])

  const spacerHeight = windowHeight
  const bufferHeight = windowHeight

  // カスタムスムーススクロール関数
  const smoothScrollTo = useCallback((targetY: number) => {
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
  }, [])

  // 各レイヤーの暗転度合い（0.0 = 明るい 〜 0.7 = 暗い）を軽量に算出
  const calculateDarknessOpacity = (index: number, currentScrollY: number, songId: number): number => {
    if (spacerHeight <= 0) return 0
    const layerStartPosition = bufferHeight + index * spacerHeight
    const isPlayingDarkened = playingDarkenedSongs.has(songId)
    const playingExtraDarkness = isPlayingDarkened ? 0.35 : 0

    if (currentScrollY < layerStartPosition) {
      const darknessFactor = Math.min(
        0.5,
        Math.max(0, (layerStartPosition - currentScrollY) / spacerHeight / 2)
      )
      const scrollDarkness = darknessFactor * 0.85
      return Math.round(Math.min(0.75, scrollDarkness + playingExtraDarkness) * 50) / 50
    }

    return playingExtraDarkness
  }

  // 音楽再生機能
  const playAudio = useCallback(
    (song: Song, index: number) => {
      const songNumericId = parseInt(song.id)
      clearPlayTimeouts()

      if (audioRef) {
        audioRef.pause()
        audioRef.currentTime = 0

        if (currentlyPlaying) {
          setSongZoomedOut(currentlyPlaying, false)
          setPlayingDarkenedSongs((prev) => {
            const newSet = new Set(prev)
            newSet.delete(currentlyPlaying)
            return newSet
          })
          setShowingSongInfo(null)
        }
      }

      // 同じ楽曲の場合は停止
      if (currentlyPlaying === songNumericId) {
        setSongZoomedOut(songNumericId, false)
        setPlayingDarkenedSongs((prev) => {
          const newSet = new Set(prev)
          newSet.delete(songNumericId)
          return newSet
        })
        setShowingSongInfo(null)
        setCurrentlyPlaying(null)
        setAudioRef(null)
        return
      }

      // クリックしたレイヤーの位置まで自動スクロール
      const targetScrollPosition = bufferHeight + index * spacerHeight
      smoothScrollTo(targetScrollPosition)

      // 縮小アニメーション開始 (scale 1.18 → 1.0)
      setSongZoomedOut(songNumericId, true)

      const audio = new Audio(song.audioPath)
      audio.volume = volume
      setCurrentlyPlaying(songNumericId)
      setAudioRef(audio)

      const t1 = window.setTimeout(() => {
        audio.play().catch((err) => {
          console.error('音楽の再生に失敗しました:', err)
          setSongZoomedOut(songNumericId, false)
          setCurrentlyPlaying(null)
        })

        const t2 = window.setTimeout(() => {
          setPlayingDarkenedSongs((prev) => {
            const newSet = new Set(prev)
            newSet.add(songNumericId)
            return newSet
          })
        }, 1000)

        const t3 = window.setTimeout(() => {
          setShowingSongInfo(songNumericId)
        }, 1500)

        playTimeoutsRef.current.push(t2, t3)
      }, 300)

      playTimeoutsRef.current.push(t1)

      audio.onended = () => {
        clearPlayTimeouts()
        setSongZoomedOut(songNumericId, false)
        setPlayingDarkenedSongs((prev) => {
          const newSet = new Set(prev)
          newSet.delete(songNumericId)
          return newSet
        })
        setShowingSongInfo(null)
        setCurrentlyPlaying(null)
        setAudioRef(null)
      }
    },
    [
      audioRef,
      currentlyPlaying,
      bufferHeight,
      spacerHeight,
      smoothScrollTo,
      setSongZoomedOut,
      clearPlayTimeouts,
      volume
    ]
  )

  // ヘッダースクロールと一番目の楽曲再生
  const handleHeaderScrollClick = useCallback(() => {
    if (songs.length === 0) return

    smoothScrollTo(bufferHeight)

    setTimeout(() => {
      playAudio(songs[0], 0)
    }, 600)
  }, [songs, bufferHeight, smoothScrollTo, playAudio])

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    )
  }

  // 現在画面内で最前面にある楽曲レイヤーのインデックスを特定（カリング用）
  // scrollY < bufferHeight + (index + 1) * spacerHeight を満たす最小の index が現在見えている最前面レイヤー
  const activeSongIndex =
    spacerHeight > 0
      ? Math.max(0, Math.floor((scrollY - bufferHeight) / spacerHeight))
      : 0

  // プロフィールセクションは最後の楽曲がスライドし始めた時（または楽曲0件時）のみ描画
  const isProfileVisible =
    songs.length === 0 || activeSongIndex >= songs.length - 1 || isAtBottom

  return (
    <>
      {loading && <LoadingScreen isExiting={isExiting} />}

      <div className="relative select-none">
        {/* 画面両端のドット列・三角形列 */}
        <SideDecorations scrollY={scrollY} />

        {/* スライドメニュー */}
        <SlideMenu volume={volume} onVolumeChange={setVolume} isLoading={loading} />

        {/* スマホ向け：画面右側の丸型サムネイル楽曲切り替えバー */}
        {!loading && (
          <MobileSongSwitcher
            songs={songs}
            activeSongIndex={activeSongIndex}
            currentlyPlaying={currentlyPlaying}
            isHeaderActive={scrollY < bufferHeight * 0.5}
            isAtBottom={isAtBottom}
            onSelectSong={playAudio}
          />
        )}

        {/* ヘッダーパララックスレイヤー */}
        <HeroHeaderLayer
          scrollY={scrollY}
          windowHeight={windowHeight}
          songsCount={songs.length}
          onScrollClick={handleHeaderScrollClick}
        />

        {/* プロフィールパララックス＆最下部インタラクティブレイヤー */}
        <ProfileSection
          profile={profile}
          songsCount={songs.length}
          isAtBottom={isAtBottom}
          isVisible={isProfileVisible}
        />

        {/* パララックス背景レイヤー（各楽曲：画面に映る最大2枚のみ描画・GPU合成） */}
        {songs.map((song, index) => {
          const songNumericId = parseInt(song.id)
          const rawOffset =
            index === 0
              ? Math.max(0, scrollY - bufferHeight)
              : Math.max(0, scrollY - (bufferHeight + index * spacerHeight))

          // カリング判定:
          // 1. すでに画面下へ完全に抜けたレイヤー (rawOffset >= windowHeight) は非表示
          // 2. 現在見えている最前面レイヤー (activeSongIndex) とその直後の1枚 (activeSongIndex + 1) 以外は完全に隠れているため非表示
          const isVisible =
            windowHeight === 0 ||
            (rawOffset < windowHeight && index <= activeSongIndex + 1)

          return (
            <SongParallaxLayer
              key={`parallax-${songNumericId}-${index}`}
              song={song}
              index={index}
              scrollOffset={isVisible ? rawOffset : 0}
              darknessOpacity={
                isVisible ? calculateDarknessOpacity(index, scrollY, songNumericId) : 0
              }
              isZoomedOut={zoomedOutSongs.has(songNumericId)}
              isVisible={isVisible}
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
