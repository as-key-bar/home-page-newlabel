'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Song } from '../../lib/firestore'
import SlideMenu from '../../components/SlideMenu'

interface WorkLink {
  title: string
  description: string
  url: string
  icon: React.ReactNode
}

export default function WorkPage() {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.15)
  const [isMuted, setIsMuted] = useState(false)
  const [prevVolume, setPrevVolume] = useState(0.15)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // 楽曲データ取得
  useEffect(() => {
    let isMounted = true

    const loadWorks = async () => {
      try {
        // まず /api/songs からの取得を試みる
        const res = await fetch('/api/songs')
        if (res.ok) {
          const data = await res.json()
          if (data && Array.isArray(data.songs) && data.songs.length > 0) {
            const filtered = data.songs.filter(
              (song: Song) => song.visible !== false && song.showInPortfolio !== false
            )
            if (isMounted) {
              setSongs(filtered)
              setLoading(false)
              return
            }
          }
        }
      } catch (err) {
        console.warn('API fetch songs error, falling back to direct Firestore:', err)
      }

      // API失敗時はクライアントFirestore直接取得
      try {
        const { db } = await import('../../lib/firebase')
        const { collection, getDocs, query, orderBy, where } = await import('firebase/firestore')

        const songsCollection = collection(db, 'songs')
        const songsQuery = query(songsCollection, where('visible', '==', true), orderBy('order'))
        const songsSnapshot = await getDocs(songsQuery)
        const songsData = songsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }) as Song)
          .filter(song => song.showInPortfolio !== false)

        if (isMounted) {
          setSongs(songsData)
        }
      } catch (error) {
        console.error('Failed to load portfolio songs:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadWorks()

    return () => {
      isMounted = false
    }
  }, [])

  // オーディオ制御
  const handleTogglePlay = (song: Song) => {
    if (!song.audioPath) return

    if (currentPlayingId === song.id) {
      if (audioRef.current) {
        if (isPlaying) {
          audioRef.current.pause()
          setIsPlaying(false)
        } else {
          audioRef.current.play().catch(console.error)
          setIsPlaying(true)
        }
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      const audio = new Audio(song.audioPath)
      audio.volume = isMuted ? 0 : volume
      audioRef.current = audio
      setCurrentPlayingId(song.id)
      setIsPlaying(true)
      setCurrentTime(0)
      setDuration(0)

      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration)
      })

      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime)
      })

      audio.addEventListener('ended', () => {
        setIsPlaying(false)
        setCurrentTime(0)
      })

      audio.play().catch(err => {
        console.error('Audio play error:', err)
        setIsPlaying(false)
      })
    }
  }

  // シークバー操作
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)
    setCurrentTime(newTime)
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
    }
  }

  // 音量変更操作
  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol)
    if (newVol > 0 && isMuted) {
      setIsMuted(false)
    } else if (newVol === 0) {
      setIsMuted(true)
    }
    if (audioRef.current) {
      audioRef.current.volume = newVol
    }
  }

  // ミュート切り替え
  const toggleMute = () => {
    if (isMuted) {
      const restored = prevVolume > 0 ? prevVolume : 0.15
      setVolume(restored)
      setIsMuted(false)
      if (audioRef.current) {
        audioRef.current.volume = restored
      }
    } else {
      setPrevVolume(volume)
      setIsMuted(true)
      if (audioRef.current) {
        audioRef.current.volume = 0
      }
    }
  }

  // コンポーネント破棄時に音声を停止
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  // 時間フォーマット (00:00)
  const formatTime = (time: number) => {
    if (isNaN(time)) return '00:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  // 得意ジャンル一覧
  const genres = [
    { name: 'Electro Swing', desc: 'ジャジーなスウィング感とビートの融合' },
    { name: 'Symphonic / Dramatic', desc: '管弦楽器を取り入れたドラマチックな展開' },
    { name: 'Sound Game / 音ゲーコア', desc: '高BPM、変拍子、複雑なフレーズワーク' },
    { name: 'Dance / Club', desc: 'Techno, Future House, Drum & Bass, UK Garage' },
    { name: 'Chiptune / 8-bit', desc: 'レトロゲーム音源と現代的ビートのハイブリッド' },
    { name: 'Rock / Loud', desc: '叙情的なギターと電子音のレイヤー' },
    { name: 'Piano Emocore', desc: 'ピアノ主体のエモーショナルなメロディライン' },
    { name: 'Jazz / Fusion', desc: '洗練されたコード感とグルーヴ' },
    { name: 'IDM / Glitch', desc: '実験的な電子音とグリッチノイズ' },
  ]

  // 外部リンク集
  const workLinks: WorkLink[] = [
    {
      title: 'YouTube (東方アレンジ / Bazaar Records)',
      description: '東方アレンジ楽曲のミュージックビデオを公開中',
      url: 'https://www.youtube.com/@bazaarrecords',
      icon: (
        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      )
    },
    {
      title: 'YouTube (ボーカロイド / NewLabel Official)',
      description: 'ボーカロイド・オリジナル楽曲の公式チャンネル',
      url: 'https://www.youtube.com/@newlabelofficial',
      icon: (
        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      )
    },
    {
      title: 'X (Twitter)',
      description: '最新の制作状況・告知・活動全般',
      url: 'https://x.com/askey_Azukibar',
      icon: (
        <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      )
    },
    {
      title: 'サブスク配信リンク',
      description: 'Apple Music, Spotify等での各種配信音源',
      url: 'https://lnk.to/4582736134755',
      icon: (
        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
        </svg>
      )
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SlideMenu volume={isMuted ? 0 : volume} onVolumeChange={handleVolumeChange} />

      {/* ヘッダー（お問い合わせ・利用規約と統一） */}
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
              制作実績・ご依頼案内
            </p>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* ========================================================================= */}
        {/* 1. Works カード: 制作実績 & 試聴プレイヤー */}
        {/* ========================================================================= */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              制作実績・楽曲試聴
            </h2>
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              これまでに制作・リリースした楽曲の一部です。各カードの再生ボタンよりご試聴いただけます。
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-sm">
              楽曲データを読み込み中...
            </div>
          ) : songs.length === 0 ? (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400 text-sm border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
              現在公開可能な楽曲を準備中です。
            </div>
          ) : (
            <div className="space-y-4">
              {songs.map((song) => {
                const isThisPlaying = currentPlayingId === song.id && isPlaying
                const isThisActive = currentPlayingId === song.id

                return (
                  <div
                    key={song.id}
                    className={`p-4 rounded-lg border transition-all ${
                      isThisActive
                        ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-700/60 shadow-sm'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* カバーアート + 再生ボタン */}
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0 border border-gray-200 dark:border-gray-600 group">
                        {song.coverImagePath ? (
                          <img
                            src={song.coverImagePath}
                            alt={song.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-xs font-medium">
                            No Image
                          </div>
                        )}

                        {/* 再生オーバーレイ */}
                        {song.audioPath && (
                          <button
                            onClick={() => handleTogglePlay(song)}
                            className="absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity opacity-90 sm:opacity-0 sm:group-hover:opacity-100 hover:!opacity-100"
                            aria-label={isThisPlaying ? '一時停止' : '再生'}
                          >
                            <div className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-md">
                              {isThisPlaying ? (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                                </svg>
                              ) : (
                                <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z"/>
                                </svg>
                              )}
                            </div>
                          </button>
                        )}
                      </div>

                      {/* 楽曲メタ情報 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          {song.genre && (
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                              {song.genre}
                            </span>
                          )}
                          {song.releaseDate && (
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              / {song.releaseDate}
                            </span>
                          )}
                          {song.clientOrProject && (
                            <span className="px-2 py-0.5 rounded text-[11px] bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                              {song.clientOrProject}
                            </span>
                          )}
                        </div>

                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                          {song.title}
                        </h3>

                        {/* 仕事実績紹介（workページ限定表示） */}
                        {song.workDescription && (
                          <p className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 mt-1 leading-relaxed">
                            {song.workDescription}
                          </p>
                        )}

                        {song.description && (
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                            {song.description}
                          </p>
                        )}

                        {song.originalTracks && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            原曲: {song.originalTracks}
                          </div>
                        )}
                      </div>

                      {/* 試聴操作ボタン（デスクトップ） */}
                      {song.audioPath && (
                        <div className="hidden sm:block flex-shrink-0">
                          <button
                            onClick={() => handleTogglePlay(song)}
                            className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors border ${
                              isThisPlaying
                                ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white'
                                : 'bg-transparent text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            {isThisPlaying ? '一時停止' : '試聴する'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 再生コントロール（シークバー & 音量バー）（再生中のみ表示） */}
                    {isThisActive && song.audioPath && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4">
                          {/* シークバー */}
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <span className="text-xs text-gray-500 dark:text-gray-400 w-9 text-right font-mono">
                              {formatTime(currentTime)}
                            </span>
                            <input
                              type="range"
                              min="0"
                              max={duration || 100}
                              step="0.1"
                              value={currentTime}
                              onChange={handleSeek}
                              aria-label="再生位置"
                              className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-black dark:accent-white"
                            />
                            <span className="text-xs text-gray-400 dark:text-gray-500 w-9 font-mono">
                              {formatTime(duration)}
                            </span>
                          </div>

                          {/* 音量バー */}
                          <div className="flex items-center gap-2 justify-end sm:border-l sm:border-gray-200 dark:sm:border-gray-700 sm:pl-4">
                            <button
                              type="button"
                              onClick={toggleMute}
                              className="p-1 rounded text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                              aria-label={isMuted || volume === 0 ? 'ミュート解除' : 'ミュート'}
                              title={isMuted || volume === 0 ? 'ミュート解除' : 'ミュート'}
                            >
                              {isMuted || volume === 0 ? (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l4-4m0 4l-4-4" />
                                </svg>
                              ) : volume < 0.5 ? (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                </svg>
                              )}
                            </button>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.01"
                              value={isMuted ? 0 : volume}
                              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                              aria-label="音量"
                              className="w-20 sm:w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-black dark:accent-white"
                            />
                            <span className="text-[11px] font-mono text-gray-500 dark:text-gray-400 w-8 text-right">
                              {Math.round((isMuted ? 0 : volume) * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>


        {/* ========================================================================= */}
        {/* 2. Pricing カード: 制作料金の目安 & 制作の流れ */}
        {/* ========================================================================= */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              楽曲制作料金の目安
            </h2>
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              ご依頼内容に応じた基本料金の目安です。個人・同人・企業案件を問わず対応しております。<br />
              曲の尺や構成、ご予算に応じた柔軟な調整も可能ですので、まずはお気軽にご相談ください。
            </p>
          </div>

          {/* 3つの料金カード */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* BGM */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 flex flex-col justify-between bg-gray-50/50 dark:bg-gray-900/40">
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">
                  BGM / Instrumental
                </span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  BGM・インスト楽曲
                </h3>
                <div className="my-3">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">40,000円〜</span>
                  <span className="text-xs text-gray-500 ml-1">（税込）</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                  ゲームBGM、配信オープニング・エンディング、PV、各種劇伴など。
                </p>
                <ul className="space-y-1.5 text-xs text-gray-700 dark:text-gray-300 border-t border-gray-200 dark:border-gray-700 pt-3">
                  <li>・ 尺目安: 1〜3分程度</li>
                  <li>・ ループ処理対応（シームレス）</li>
                  <li>・ リテイク2回まで無料対応</li>
                  <li>・ 商用・収益化配信での利用可能</li>
                </ul>
              </div>
              <div className="mt-6 pt-3 border-t border-gray-200 dark:border-gray-700">
                <Link
                  href="/contact"
                  className="block w-full py-2 text-center text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 transition-colors"
                >
                  この内容で相談する
                </Link>
              </div>
            </div>

            {/* 歌モノ */}
            <div className="border-2 border-gray-900 dark:border-gray-100 rounded-lg p-5 flex flex-col justify-between bg-white dark:bg-gray-800 shadow-sm relative">
              <span className="absolute -top-3 right-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                おすすめ
              </span>
              <div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300 block mb-1">
                  Vocal Song
                </span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  歌モノ・ボーカル楽曲
                </h3>
                <div className="my-3">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">70,000円〜</span>
                  <span className="text-xs text-gray-500 ml-1">（税込）</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                  VTuberオリジナル曲、ボーカロイド楽曲、同人・商業テーマソングなど。
                </p>
                <ul className="space-y-1.5 text-xs text-gray-700 dark:text-gray-300 border-t border-gray-200 dark:border-gray-700 pt-3">
                  <li>・ 作曲・編曲・オケミックス込み</li>
                  <li>・ カラオケ（Off-Vocal）音源付属</li>
                  <li>・ パラデータ（ステム）納品対応</li>
                  <li>・ デモ段階でのリテイク柔軟対応</li>
                </ul>
              </div>
              <div className="mt-6 pt-3 border-t border-gray-200 dark:border-gray-700">
                <Link
                  href="/contact"
                  className="block w-full py-2 text-center text-xs font-medium rounded-lg bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black transition-colors"
                >
                  この内容で相談する
                </Link>
              </div>
            </div>

            {/* アレンジ */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 flex flex-col justify-between bg-gray-50/50 dark:bg-gray-900/40">
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">
                  Arrangement / Remix
                </span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  アレンジ・カバー音源
                </h3>
                <div className="my-3">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">30,000円〜</span>
                  <span className="text-xs text-gray-500 ml-1">（税込）</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                  歌ってみた用オケ制作、既存楽曲の大胆なリアレンジ、リミックスなど。
                </p>
                <ul className="space-y-1.5 text-xs text-gray-700 dark:text-gray-300 border-t border-gray-200 dark:border-gray-700 pt-3">
                  <li>・ キー変更・尺のカスタム対応</li>
                  <li>・ 原曲リスペクト×独自アレンジ</li>
                  <li>・ リテイク2回まで無料対応</li>
                  <li>・ マスタリング音源納品</li>
                </ul>
              </div>
              <div className="mt-6 pt-3 border-t border-gray-200 dark:border-gray-700">
                <Link
                  href="/contact"
                  className="block w-full py-2 text-center text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 transition-colors"
                >
                  この内容で相談する
                </Link>
              </div>
            </div>
          </div>

          {/* オプション案内 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                オプション料金
              </h4>
              <ul className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
                <li className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                  <span>短納期・特急オプション（2週間以内納品）</span>
                  <span className="font-semibold text-gray-900 dark:text-white">+15,000円〜</span>
                </li>
                <li className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                  <span>パラデータ（全トラック個別）納品</span>
                  <span className="font-semibold text-gray-900 dark:text-white">+10,000円</span>
                </li>
                <li className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                  <span>ボーカルピッチ・タイミング補正</span>
                  <span className="font-semibold text-gray-900 dark:text-white">+8,000円 / 1本</span>
                </li>
                <li className="flex justify-between py-1">
                  <span>著作権譲渡（買取）契約</span>
                  <span className="text-gray-500 dark:text-gray-400">要相談</span>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                ご予算に応じた柔軟なプランニング
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                「ショート尺（1分程度）のため予算を抑えたい」「同人企画のため全体予算に合わせて相談したい」など、構成や作業範囲を調整したお見積もりも可能です。
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                まずはお気軽にお問い合わせフォーム、またはX（Twitter）のDMよりご相談ください。
              </p>
            </div>
          </div>

          {/* 制作の流れ */}
          <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              制作の流れ
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Step 1</span>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">ご相談・お見積もり</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  用途、希望納期、イメージ参考曲、ご予算感などを伺いお見積もりをご案内します。
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Step 2</span>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">デモ制作・ご確認</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  ワンコーラス等のデモ音源を制作し、楽曲の方向性やメロディをご確認いただきます。
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Step 3</span>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">本制作・ミックス</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  フル尺への展開、細部のアレンジの作り込み、ミックス・マスタリングを行います。
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Step 4</span>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">最終確認・納品</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  完成音源をご確認いただき、24bit/48kHz WAV等のご指定形式にて納品いたします。
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* ========================================================================= */}
        {/* 3. About カード: 得意ジャンル & 特徴 */}
        {/* ========================================================================= */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              得意ジャンル・音楽的特徴
            </h2>
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              エレクトロニックやクラブミュージックのビート感を基軸に、生楽器やジャズ、チップチューンなどの要素を融合させた、展開力のあるサウンドを得意としています。
            </p>
          </div>

          {/* 3つの特徴 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-1">特徴 1</span>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">緩急のある展開力</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                単調なループに終始せず、場面の切り替わりや感情の起伏に寄り添ったドラマチックな構成を意識しています。
              </p>
            </div>

            <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-1">特徴 2</span>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">多ジャンルの融合</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                エレクトロスウィング、シンフォニック、音ゲーコア、チップチューンなど、異なるジャンルの質感を取り入れたハイブリッドな音像。
              </p>
            </div>

            <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-1">特徴 3</span>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">世界観への寄り添い</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                ゲームのシナリオやキャラクター性、コンテンツの持つ背景設定を読み解き、作品の印象を形作るサウンドを作ります。
              </p>
            </div>
          </div>

          {/* 得意ジャンル一覧 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              対応ジャンル一覧
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {genres.map((g, idx) => (
                <div key={idx} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
                  <div className="text-xs font-bold text-gray-900 dark:text-white mb-0.5">{g.name}</div>
                  <div className="text-[11px] text-gray-600 dark:text-gray-400">{g.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* ========================================================================= */}
        {/* 4. Links カード: 外部リンク & 公式チャンネル */}
        {/* ========================================================================= */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              公式リンク・配信チャンネル
            </h2>
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              YouTubeでのMV公開やサブスク配信、SNSでの告知を行っています。
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {workLinks.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-colors flex items-center gap-3.5 group"
              >
                <div className="flex-shrink-0">
                  {link.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {link.title}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    {link.description}
                  </div>
                </div>
                <span className="text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 text-xs">
                  ↗
                </span>
              </a>
            ))}
          </div>
        </section>


        {/* ========================================================================= */}
        {/* 5. Contact カード: お問い合わせ CTA */}
        {/* ========================================================================= */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sm:p-8 border border-gray-200 dark:border-gray-700 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            ご依頼・お見積もりのお問い合わせ
          </h2>
          <p className="text-gray-700 dark:text-gray-300 text-sm max-w-xl mx-auto leading-relaxed mb-6">
            楽曲制作のご依頼やお見積もり、利用に関するご相談など、<br className="hidden sm:inline" />
            お問い合わせフォームまたはX（Twitter）のDMよりお気軽にご連絡ください。
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black font-medium py-3 px-8 rounded-lg transition-colors text-sm"
            >
              お問い合わせフォームへ
            </Link>
            <a
              href="https://x.com/askey_Azukibar"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium py-3 px-8 rounded-lg transition-colors text-sm"
            >
              X（Twitter）DMで相談
            </a>
          </div>
        </section>

      </main>

      {/* フッター */}
      <footer className="text-center text-xs text-gray-500 dark:text-gray-400 py-8">
        <p>&copy; {new Date().getFullYear()} .new label. All rights reserved.</p>
      </footer>
    </div>
  )
}