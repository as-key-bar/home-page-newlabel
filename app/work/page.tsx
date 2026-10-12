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
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // 楽曲データ取得（実績ページ表示対象のみ）
  useEffect(() => {
    const loadWorks = async () => {
      try {
        const { db } = await import('../../lib/firebase')
        const { collection, getDocs, query, orderBy, where } = await import('firebase/firestore')

        const songsCollection = collection(db, 'songs')
        const songsQuery = query(songsCollection, where('visible', '==', true), orderBy('order'))
        const songsSnapshot = await getDocs(songsQuery)
        const songsData = songsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }) as Song)
          .filter(song => song.showInPortfolio !== false)

        setSongs(songsData)
      } catch (error) {
        console.error('Failed to load portfolio songs:', error)
      } finally {
        setLoading(false)
      }
    }

    loadWorks()
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
      title: 'YouTube (Touhou)',
      description: '東方アレンジ楽曲のミュージックビデオ',
      url: 'https://www.youtube.com/@bazaarrecords',
      icon: (
        <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      )
    },
    {
      title: 'YouTube (NewLabel Official)',
      description: 'ボーカロイド・オリジナル楽曲のミュージックビデオ',
      url: 'https://www.youtube.com/@newlabelofficial',
      icon: (
        <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      )
    },
    {
      title: 'X / Twitter',
      description: '制作進捗・告知・日常',
      url: 'https://x.com/askey_Azukibar',
      icon: (
        <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      )
    },
    {
      title: 'Streaming',
      description: '各種サブスクリプション配信サービス',
      url: 'https://lnk.to/4582736134755',
      icon: (
        <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
        </svg>
      )
    }
  ]

  return (
    <div className="min-h-screen bg-black text-gray-200 selection:bg-white selection:text-black">
      <SlideMenu />

      {/* ヘッダー */}
      <header className="border-b border-white/10 backdrop-blur-md bg-black/60 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img 
              src="/images/newlabel_logotrim.png" 
              alt=".new label" 
              className="h-8 w-auto object-contain filter invert"
            />
            <span className="text-xs tracking-wider text-gray-400 font-mono hidden sm:inline">
              / WORKS & ABOUT
            </span>
          </Link>

          {/* クイックナビ */}
          <nav className="flex items-center gap-1 sm:gap-3 text-xs font-mono text-gray-400 pr-16 sm:pr-20">
            <a href="#works" className="hover:text-white transition-colors py-1 px-2 rounded hover:bg-white/5">
              Works
            </a>
            <a href="#about" className="hover:text-white transition-colors py-1 px-2 rounded hover:bg-white/5">
              About
            </a>
            <a href="#pricing" className="hover:text-white transition-colors py-1 px-2 rounded hover:bg-white/5">
              Pricing
            </a>
            <Link 
              href="/contact" 
              className="ml-2 px-3 py-1 bg-white text-black hover:bg-gray-200 rounded transition-colors text-xs font-medium"
            >
              Contact
            </Link>
          </nav>
        </div>
      </header>

      {/* ヒーロー */}
      <div className="border-b border-white/10 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-xs font-mono tracking-widest text-gray-500 uppercase mb-3">
            Portfolio & Commission
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
            WORKS & ABOUT
          </h1>
          <p className="text-sm text-gray-400 max-w-xl mx-auto leading-relaxed">
            ゲームBGM・ボーカル楽曲・インストゥルメンタルなどの楽曲制作を行っています。<br className="hidden sm:inline" />
            制作実績の試聴と、ご依頼に関する目安料金のご案内です。
          </p>

          <div className="flex flex-wrap justify-center gap-3 mt-8 text-xs font-mono">
            <a 
              href="#works" 
              className="px-4 py-2 rounded border border-white/30 hover:border-white text-white transition-colors"
            >
              楽曲試聴 ↓
            </a>
            <a 
              href="#pricing" 
              className="px-4 py-2 rounded border border-white/30 hover:border-white text-white transition-colors"
            >
              料金目安 ↓
            </a>
            <Link 
              href="/contact" 
              className="px-4 py-2 rounded bg-white text-black hover:bg-gray-200 transition-colors font-sans font-medium"
            >
              ご相談・お問い合わせ
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-16 space-y-24">

        {/* ========================================================================= */}
        {/* 1. Works セクション: 制作実績 & 試聴バー */}
        {/* ========================================================================= */}
        <section id="works" className="scroll-mt-20">
          <div className="flex items-baseline justify-between border-b border-white/10 pb-3 mb-6">
            <div>
              <span className="text-xs font-mono text-gray-500 mr-2">01</span>
              <h2 className="text-xl sm:text-2xl font-bold text-white inline">WORKS</h2>
            </div>
            <span className="text-xs font-mono text-gray-500">
              {songs.length} tracks
            </span>
          </div>

          <p className="text-xs text-gray-400 mb-8 leading-relaxed">
            これまでに制作・提供した楽曲の一部です。各カードの再生ボタンよりご試聴いただけます。
          </p>

          {loading ? (
            <div className="text-center py-12 text-gray-500 font-mono text-xs">
              Loading tracks...
            </div>
          ) : songs.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-xs border border-white/5 rounded">
              現在公開可能な楽曲を準備中です。
            </div>
          ) : (
            <div className="space-y-3">
              {songs.map((song) => {
                const isThisPlaying = currentPlayingId === song.id && isPlaying
                const isThisActive = currentPlayingId === song.id

                return (
                  <div
                    key={song.id}
                    className={`p-4 rounded border transition-colors ${
                      isThisActive
                        ? 'bg-white/[0.04] border-white/30'
                        : 'bg-white/[0.01] border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* カバーアート + 再生ボタン */}
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded overflow-hidden bg-black flex-shrink-0 border border-white/10 group">
                        {song.coverImagePath ? (
                          <img
                            src={song.coverImagePath}
                            alt={song.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600 font-mono text-xs">
                            NO ART
                          </div>
                        )}

                        {/* 再生オーバーレイ */}
                        {song.audioPath && (
                          <button
                            onClick={() => handleTogglePlay(song)}
                            className="absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity opacity-90 sm:opacity-0 sm:group-hover:opacity-100 hover:!opacity-100"
                            aria-label={isThisPlaying ? '一時停止' : '再生'}
                          >
                            <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow">
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
                          <span className="text-[11px] font-mono text-gray-400">
                            {song.genre}
                          </span>
                          {song.releaseDate && (
                            <span className="text-[11px] font-mono text-gray-600">
                              / {song.releaseDate}
                            </span>
                          )}
                          {song.clientOrProject && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 text-gray-300 font-mono">
                              {song.clientOrProject}
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-semibold text-white truncate">
                          {song.title}
                        </h3>

                        {song.description && (
                          <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">
                            {song.description}
                          </p>
                        )}

                        {song.originalTracks && (
                          <div className="text-[11px] text-gray-500 font-mono truncate mt-0.5">
                            原曲: {song.originalTracks}
                          </div>
                        )}
                      </div>

                      {/* 試聴操作ボタン */}
                      {song.audioPath && (
                        <div className="hidden sm:block flex-shrink-0">
                          <button
                            onClick={() => handleTogglePlay(song)}
                            className={`px-3 py-1.5 rounded text-xs font-mono transition-colors border ${
                              isThisPlaying
                                ? 'bg-white text-black border-white'
                                : 'bg-transparent text-gray-300 border-white/20 hover:border-white/50'
                            }`}
                          >
                            {isThisPlaying ? 'PAUSE' : 'PLAY'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* シークバー（再生中のみ表示） */}
                    {isThisActive && song.audioPath && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] font-mono text-gray-400 w-10 text-right">
                            {formatTime(currentTime)}
                          </span>
                          <input
                            type="range"
                            min="0"
                            max={duration || 100}
                            step="0.1"
                            value={currentTime}
                            onChange={handleSeek}
                            className="flex-1 h-1 bg-white/20 rounded appearance-none cursor-pointer accent-white"
                          />
                          <span className="text-[11px] font-mono text-gray-600 w-10">
                            {formatTime(duration)}
                          </span>
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
        {/* 2. About セクション: 特徴 & 得意ジャンル */}
        {/* ========================================================================= */}
        <section id="about" className="scroll-mt-20">
          <div className="flex items-baseline justify-between border-b border-white/10 pb-3 mb-6">
            <div>
              <span className="text-xs font-mono text-gray-500 mr-2">02</span>
              <h2 className="text-xl sm:text-2xl font-bold text-white inline">ABOUT</h2>
            </div>
            <span className="text-xs font-mono text-gray-500">
              Style & Genres
            </span>
          </div>

          <p className="text-xs text-gray-400 mb-8 leading-relaxed">
            エレクトロニックやクラブミュージックのビート感を基軸に、生楽器やジャズ、チップチューンなどの要素を融合させた、展開力のあるサウンドを得意としています。
          </p>

          {/* 3つの特徴 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            <div className="p-5 rounded border border-white/10 bg-white/[0.01]">
              <span className="text-xs font-mono text-gray-500 block mb-2">01 / ARRANGEMENT</span>
              <h3 className="text-sm font-semibold text-white mb-2">緩急のある展開力</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                単調なループに終始せず、場面の切り替わりや感情の起伏に寄り添ったドラマチックな構成を意識しています。
              </p>
            </div>

            <div className="p-5 rounded border border-white/10 bg-white/[0.01]">
              <span className="text-xs font-mono text-gray-500 block mb-2">02 / CROSSOVER</span>
              <h3 className="text-sm font-semibold text-white mb-2">多ジャンルの融合</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                エレクトロスウィング、シンフォニック、音ゲーコア、チップチューンなど、異なるジャンルの質感を取り入れたハイブリッドな音像。
              </p>
            </div>

            <div className="p-5 rounded border border-white/10 bg-white/[0.01]">
              <span className="text-xs font-mono text-gray-500 block mb-2">03 / WORLDVIEW</span>
              <h3 className="text-sm font-semibold text-white mb-2">世界観への寄り添い</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                ゲームのシナリオやキャラクター性、コンテンツの持つ背景設定を読み解き、作品の印象を形作るサウンドを作ります。
              </p>
            </div>
          </div>

          {/* 得意ジャンル一覧 */}
          <div className="border border-white/10 rounded p-5 bg-white/[0.01]">
            <h3 className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-4">
              Genres & Elements
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {genres.map((g, idx) => (
                <div key={idx} className="p-2.5 rounded bg-white/[0.02] border border-white/5">
                  <div className="font-mono text-xs text-white mb-0.5">{g.name}</div>
                  <div className="text-[11px] text-gray-500">{g.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* ========================================================================= */}
        {/* 3. Pricing セクション: 料金目安 & ガイドライン */}
        {/* ========================================================================= */}
        <section id="pricing" className="scroll-mt-20">
          <div className="flex items-baseline justify-between border-b border-white/10 pb-3 mb-6">
            <div>
              <span className="text-xs font-mono text-gray-500 mr-2">03</span>
              <h2 className="text-xl sm:text-2xl font-bold text-white inline">PRICING</h2>
            </div>
            <span className="text-xs font-mono text-gray-500">
              Rates & Options
            </span>
          </div>

          <p className="text-xs text-gray-400 mb-8 leading-relaxed">
            ご依頼内容に応じた基本料金の目安です。個人・同人・企業案件を問わず対応しています。<br className="hidden sm:inline" />
            尺や構成、ご予算に応じた柔軟な調整も可能ですので、お気軽にご相談ください。
          </p>

          {/* 料金カード */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* BGM */}
            <div className="p-5 rounded border border-white/10 bg-white/[0.01] flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-mono text-gray-500 uppercase tracking-wider block mb-1">Instrumental</span>
                <h3 className="text-base font-semibold text-white mb-2">BGM・インスト楽曲</h3>
                <div className="my-3">
                  <span className="text-2xl font-bold text-white font-mono">¥40,000〜</span>
                  <span className="text-[11px] text-gray-500 font-mono ml-1">(税込)</span>
                </div>
                <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                  ゲームBGM、配信オープニング/エンディング、動画PV、各種劇伴など。
                </p>
                <ul className="space-y-1.5 text-xs text-gray-400 border-t border-white/10 pt-3">
                  <li>・ 尺目安: 1〜3分程度</li>
                  <li>・ ループ処理対応（シームレス）</li>
                  <li>・ リテイク2回まで対応</li>
                  <li>・ 商用・収益化配信での利用可能</li>
                </ul>
              </div>
              <div className="mt-5 pt-3 border-t border-white/5">
                <Link
                  href="/contact"
                  className="block w-full py-2 text-center text-xs font-mono rounded border border-white/20 hover:border-white text-gray-200 transition-colors"
                >
                  相談する →
                </Link>
              </div>
            </div>

            {/* 歌モノ */}
            <div className="p-5 rounded border border-white/30 bg-white/[0.03] flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider block mb-1">Vocal Song</span>
                <h3 className="text-base font-semibold text-white mb-2">歌モノ・ボーカル楽曲</h3>
                <div className="my-3">
                  <span className="text-2xl font-bold text-white font-mono">¥70,000〜</span>
                  <span className="text-[11px] text-gray-500 font-mono ml-1">(税込)</span>
                </div>
                <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                  VTuberオリジナル曲、ボーカロイド楽曲、同人/商業テーマソングなど。
                </p>
                <ul className="space-y-1.5 text-xs text-gray-300 border-t border-white/10 pt-3">
                  <li>・ 作曲・編曲・オケミックス込み</li>
                  <li>・ Off-Vocal（カラオケ）音源付属</li>
                  <li>・ パラデータ（ステム）納品対応</li>
                  <li>・ デモ段階でのリテイク柔軟対応</li>
                </ul>
              </div>
              <div className="mt-5 pt-3 border-t border-white/5">
                <Link
                  href="/contact"
                  className="block w-full py-2 text-center text-xs font-mono rounded bg-white text-black hover:bg-gray-200 transition-colors font-medium"
                >
                  相談する →
                </Link>
              </div>
            </div>

            {/* アレンジ */}
            <div className="p-5 rounded border border-white/10 bg-white/[0.01] flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-mono text-gray-500 uppercase tracking-wider block mb-1">Arrangement</span>
                <h3 className="text-base font-semibold text-white mb-2">アレンジ・カバー音源</h3>
                <div className="my-3">
                  <span className="text-2xl font-bold text-white font-mono">¥30,000〜</span>
                  <span className="text-[11px] text-gray-500 font-mono ml-1">(税込)</span>
                </div>
                <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                  歌ってみた用オケ制作、既存楽曲の大胆なリアレンジ、リミックスなど。
                </p>
                <ul className="space-y-1.5 text-xs text-gray-400 border-t border-white/10 pt-3">
                  <li>・ キー変更・尺のカスタム対応</li>
                  <li>・ 原曲リスペクト×独自アレンジ</li>
                  <li>・ リテイク2回まで対応</li>
                  <li>・ マスタリング音源納品</li>
                </ul>
              </div>
              <div className="mt-5 pt-3 border-t border-white/5">
                <Link
                  href="/contact"
                  className="block w-full py-2 text-center text-xs font-mono rounded border border-white/20 hover:border-white text-gray-200 transition-colors"
                >
                  相談する →
                </Link>
              </div>
            </div>
          </div>

          {/* オプション案内 & 柔軟な対応 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="p-4 rounded border border-white/10 bg-white/[0.01]">
              <h4 className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-3">
                Options
              </h4>
              <ul className="space-y-2 text-xs text-gray-400">
                <li className="flex justify-between py-1 border-b border-white/5">
                  <span>短納期・特急オプション (2週間以内)</span>
                  <span className="font-mono text-gray-200">+¥15,000〜</span>
                </li>
                <li className="flex justify-between py-1 border-b border-white/5">
                  <span>パラデータ (全トラック個別) 納品</span>
                  <span className="font-mono text-gray-200">+¥10,000</span>
                </li>
                <li className="flex justify-between py-1 border-b border-white/5">
                  <span>ボーカルピッチ・タイミング補正</span>
                  <span className="font-mono text-gray-200">+¥8,000 / 1本</span>
                </li>
                <li className="flex justify-between py-1">
                  <span>著作権譲渡（買取）契約</span>
                  <span className="font-mono text-gray-400">要相談</span>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded border border-white/10 bg-white/[0.01]">
              <h4 className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-3">
                Custom Plan
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed mb-3">
                「ショート尺（1分程度）のため予算を抑えたい」「同人企画のため全体予算に合わせて相談したい」など、構成や作業範囲を調整したお見積もりも可能です。
              </p>
              <p className="text-xs text-gray-500 font-mono">
                まずはお気軽にお問い合わせフォーム、またはX（Twitter）のDMよりご相談ください。
              </p>
            </div>
          </div>

          {/* 制作の流れ */}
          <div className="p-4 rounded border border-white/10 bg-white/[0.01]">
            <h4 className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-4">
              Workflow
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="font-mono text-xs text-gray-500">01 / HEARING</div>
                <div className="text-xs font-semibold text-white">ご相談・お見積もり</div>
                <div className="text-[11px] text-gray-400 leading-relaxed">
                  用途、希望納期、イメージ参考曲、予算感などを伺いお見積もりします。
                </div>
              </div>

              <div className="space-y-1">
                <div className="font-mono text-xs text-gray-500">02 / DEMO</div>
                <div className="text-xs font-semibold text-white">デモ制作・確認</div>
                <div className="text-[11px] text-gray-400 leading-relaxed">
                  ワンコーラス等のデモ音源を制作し、方向性やメロディを確認いただきます。
                </div>
              </div>

              <div className="space-y-1">
                <div className="font-mono text-xs text-gray-500">03 / PRODUCTION</div>
                <div className="text-xs font-semibold text-white">本制作・ミックス</div>
                <div className="text-[11px] text-gray-400 leading-relaxed">
                  フル尺への展開、アレンジの作り込み、ミックス・マスタリングを行います。
                </div>
              </div>

              <div className="space-y-1">
                <div className="font-mono text-xs text-gray-500">04 / DELIVERY</div>
                <div className="text-xs font-semibold text-white">最終確認・納品</div>
                <div className="text-[11px] text-gray-400 leading-relaxed">
                  完成音源をご確認いただき、24bit/48kHz WAV等の指定形式で納品します。
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* ========================================================================= */}
        {/* 4. 外部リンク集 (YouTube, Twitter, Streaming) */}
        {/* ========================================================================= */}
        <section id="links" className="scroll-mt-20">
          <div className="flex items-baseline justify-between border-b border-white/10 pb-3 mb-6">
            <div>
              <span className="text-xs font-mono text-gray-500 mr-2">04</span>
              <h2 className="text-xl sm:text-2xl font-bold text-white inline">LINKS</h2>
            </div>
            <span className="text-xs font-mono text-gray-500">
              Official Channels
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {workLinks.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded bg-white/[0.01] hover:bg-white/[0.03] border border-white/10 hover:border-white/30 transition-colors flex items-center gap-3.5 group"
              >
                <div className="flex-shrink-0 text-gray-400 group-hover:text-white transition-colors">
                  {link.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-xs text-white group-hover:underline">
                    {link.title}
                  </div>
                  <div className="text-[11px] text-gray-500 truncate mt-0.5">
                    {link.description}
                  </div>
                </div>
                <span className="text-gray-600 group-hover:text-white transition-colors text-xs font-mono">
                  ↗
                </span>
              </a>
            ))}
          </div>
        </section>


        {/* ========================================================================= */}
        {/* 5. お問い合わせ CTA */}
        {/* ========================================================================= */}
        <section id="contact" className="scroll-mt-20 border-t border-white/10 pt-16">
          <div className="text-center max-w-xl mx-auto space-y-4">
            <span className="text-xs font-mono text-gray-500 tracking-wider uppercase">
              CONTACT
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              制作のご相談・お見積もり
            </h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              ご依頼に関するご相談やお見積もりは、お問い合わせフォーム、<br className="hidden sm:inline" />
              またはX（Twitter）のDMよりお気軽にご連絡ください。
            </p>
            <div className="pt-4 flex flex-wrap justify-center gap-3">
              <Link
                href="/contact"
                className="px-6 py-2.5 rounded bg-white text-black font-medium text-xs hover:bg-gray-200 transition-colors"
              >
                お問い合わせフォーム
              </Link>
              <a
                href="https://x.com/askey_Azukibar"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2.5 rounded border border-white/20 text-gray-300 font-mono text-xs hover:border-white hover:text-white transition-colors"
              >
                X (Twitter) DM ↗
              </a>
            </div>
          </div>
        </section>

      </main>

      {/* フッター */}
      <footer className="border-t border-white/10 py-8 text-center text-xs text-gray-600 font-mono">
        <p>&copy; {new Date().getFullYear()} .new label</p>
      </footer>
    </div>
  )
}