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
      // 別の曲を再生
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

  // 得意ジャンル一覧データ
  const genres = [
    { name: 'Electro Swing', desc: '華やかなスウィング感と重厚なクラブビートの融合' },
    { name: 'Symphonic / Dramatic', desc: 'ストリングス・ブラスが疾走する壮大で熱い展開' },
    { name: 'Sound Game / 音ゲーコア', desc: '高BPM、変拍子、複雑なフレーズが炸裂するキラーチューン' },
    { name: 'Club / Dance', desc: 'Techno, Future House, Drum & Bass, UK Garage' },
    { name: 'Chiptune / 8-bit', desc: 'ファミコンライクなピコピコ音と現代ビートのハイブリッド' },
    { name: 'Rock / Loud / Metal', desc: '叙情的なギターリフとエレクトロの重厚な融合' },
    { name: 'Piano Emocore', desc: '叙情的でエモーショナルなピアノ主体のメロディライン' },
    { name: 'Jazz / Fusion / Lounge', desc: '都会的で洗練されたコードワークと心地よいグルーヴ' },
    { name: 'IDM / Glitch', desc: '実験的な電子音やグリッチノイズを取り入れた緻密な音響構築' },
  ]

  // 外部リンク集
  const workLinks: WorkLink[] = [
    {
      title: 'YouTube (Touhou)',
      description: '東方アレンジ楽曲のミュージックビデオ',
      url: 'https://www.youtube.com/@bazaarrecords',
      icon: (
        <svg className="w-7 h-7 text-red-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      )
    },
    {
      title: 'YouTube (NewLabel Official)',
      description: 'ボーカロイド・オリジナル楽曲のミュージックビデオ',
      url: 'https://www.youtube.com/@newlabelofficial',
      icon: (
        <svg className="w-7 h-7 text-red-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      )
    },
    {
      title: 'X / Twitter',
      description: '最新情報・制作進捗・日常の呟き',
      url: 'https://x.com/askey_Azukibar',
      icon: (
        <svg className="w-7 h-7 text-gray-200" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      )
    },
    {
      title: 'Streaming',
      description: 'Spotify、Apple Music等での楽曲配信',
      url: 'https://lnk.to/4582736134755',
      icon: (
        <svg className="w-7 h-7 text-green-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
        </svg>
      )
    }
  ]

  return (
    <div className="min-h-screen bg-[#08090d] text-gray-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      <SlideMenu />

      {/* ヘッダー */}
      <header className="border-b border-white/10 backdrop-blur-md bg-black/40 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img 
              src="/images/newlabel_logotrim.png" 
              alt=".new label" 
              className="h-10 w-auto object-contain filter invert"
            />
            <span className="text-xs uppercase tracking-widest text-cyan-400 font-mono hidden sm:inline">
              Official Site
            </span>
          </Link>

          {/* クイックナビ */}
          <nav className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm font-medium text-gray-300 pr-16 sm:pr-20">
            <a href="#about" className="hover:text-cyan-400 transition-colors py-1 px-2 rounded hover:bg-white/5">
              About
            </a>
            <a href="#works" className="hover:text-cyan-400 transition-colors py-1 px-2 rounded hover:bg-white/5">
              Works
            </a>
            <a href="#price" className="hover:text-cyan-400 transition-colors py-1 px-2 rounded hover:bg-white/5">
              Price
            </a>
            <Link 
              href="/contact" 
              className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full transition-colors text-xs font-semibold shadow-sm"
            >
              依頼相談
            </Link>
          </nav>
        </div>
      </header>

      {/* ヒーローセクション */}
      <div className="relative overflow-hidden py-16 sm:py-20 border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-950/20 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-mono tracking-widest bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-4">
            PORTFOLIO & COMMISSION INFO
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400">
            ABOUT / WORKS / PRICING
          </h1>
          <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
            外連味（けれんみ）あるドラマチックな展開と、キャッチーかつ斬新な音像。<br className="hidden sm:inline" />
            音楽レーベル「.new label」の制作実績、得意ジャンル、ご依頼料金のご案内です。
          </p>

          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <a 
              href="#works" 
              className="px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold transition-all shadow-lg shadow-cyan-950/50 flex items-center gap-2"
            >
              <span>🎧 楽曲を試聴する</span>
            </a>
            <a 
              href="#price" 
              className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all border border-white/10"
            >
              <span>💰 料金表を見る</span>
            </a>
            <Link 
              href="/contact" 
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white text-sm font-semibold transition-all shadow-lg shadow-purple-950/50"
            >
              <span>📮 制作を相談する</span>
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-12 space-y-24">

        {/* ========================================================================= */}
        {/* 1. About セクション: 強み & 得意ジャンル */}
        {/* ========================================================================= */}
        <section id="about" className="scroll-mt-20">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-mono text-cyan-400 tracking-wider uppercase">{'// 01. ABOUT & SKILLS'}</span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
            できること・サウンドの強み
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-8">
            「自分、これできます」を分かりやすく凝縮。世界観を大切にしながら、聴き手の心を掴むフックと大胆な展開力で作品を彩ります。
          </p>

          {/* 3つの強みカード */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
            <div className="p-6 rounded-xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/40 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-4 text-xl group-hover:scale-110 transition-transform">
                ⚡
              </div>
              <h3 className="text-base font-bold mb-2 text-white">大胆なアレンジ & 展開美</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                外連味（けれんみ）たっぷりの構成。予測を裏切り期待に応える急転直下のブレイクや変拍子、感情を揺さぶるドラマチックな展開を作ります。
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white/[0.03] border border-white/10 hover:border-purple-500/40 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 mb-4 text-xl group-hover:scale-110 transition-transform">
                🎹
              </div>
              <h3 className="text-base font-bold mb-2 text-white">幅広いジャンル横断力</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                エレクトロスウィング、シンフォニック、音ゲーコア、チップチューン、IDMまで。多様なジャンルのエッセンスを自在に融合・再構築します。
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white/[0.03] border border-white/10 hover:border-pink-500/40 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400 mb-4 text-xl group-hover:scale-110 transition-transform">
                🎯
              </div>
              <h3 className="text-base font-bold mb-2 text-white">世界観のトータル具現化</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                ゲーム設定やキャラクターの心情、コンテンツのストーリーラインを深く読み解き、作品の「顔」となる印象的なテーマ曲・BGMへ昇華します。
              </p>
            </div>
          </div>

          {/* 得意ジャンル一覧 */}
          <div className="p-6 rounded-xl bg-black/40 border border-white/10">
            <h3 className="text-sm font-semibold tracking-wide text-gray-300 uppercase font-mono mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              得意ジャンル・対応スタイル一覧
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {genres.map((g, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-colors">
                  <div className="font-semibold text-xs text-cyan-300 mb-1">{g.name}</div>
                  <div className="text-[11px] text-gray-400 leading-normal">{g.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* ========================================================================= */}
        {/* 2. Works セクション: 制作実績 & 試聴バー */}
        {/* ========================================================================= */}
        <section id="works" className="scroll-mt-20">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-mono text-cyan-400 tracking-wider uppercase">{'// 02. WORKS & PORTFOLIO'}</span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
                制作実績・試聴
              </h2>
              <p className="text-gray-400 text-sm">
                各カードの再生ボタンよりワンクリックで楽曲をご試聴いただけます。
              </p>
            </div>
            <div className="text-xs text-gray-400 font-mono">
              登録実績: {songs.length} 件
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400 font-mono text-sm">
              実績データを読み込み中...
            </div>
          ) : songs.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm bg-white/[0.02] rounded-xl border border-white/5">
              現在公開可能な実績を準備中です。
            </div>
          ) : (
            <div className="space-y-4">
              {songs.map((song) => {
                const isThisPlaying = currentPlayingId === song.id && isPlaying
                const isThisActive = currentPlayingId === song.id

                return (
                  <div
                    key={song.id}
                    className={`p-4 sm:p-5 rounded-xl border transition-all duration-200 ${
                      isThisActive
                        ? 'bg-cyan-950/20 border-cyan-500/50 shadow-lg shadow-cyan-950/30'
                        : 'bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      {/* カバーアート + 再生ボタン */}
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-black flex-shrink-0 border border-white/10 group">
                        {song.coverImagePath ? (
                          <img
                            src={song.coverImagePath}
                            alt={song.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                            className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center transition-opacity opacity-90 sm:opacity-0 sm:group-hover:opacity-100 hover:!opacity-100"
                            aria-label={isThisPlaying ? '一時停止' : '再生'}
                          >
                            <div className="w-10 h-10 rounded-full bg-cyan-500 text-black flex items-center justify-center shadow-lg transform active:scale-95 transition-transform">
                              {isThisPlaying ? (
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                                </svg>
                              ) : (
                                <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z"/>
                                </svg>
                              )}
                            </div>
                          </button>
                        )}
                      </div>

                      {/* 楽曲メタ情報 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          {song.clientOrProject && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                              {song.clientOrProject}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-white/10 text-gray-300">
                            {song.genre}
                          </span>
                          {song.releaseDate && (
                            <span className="text-[11px] font-mono text-gray-500">
                              {song.releaseDate}
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg font-bold text-white truncate mb-1">
                          {song.title}
                        </h3>

                        {song.description && (
                          <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-2">
                            {song.description}
                          </p>
                        )}

                        {song.originalTracks && (
                          <div className="text-[11px] text-gray-500 font-mono truncate">
                            原曲/原題: {song.originalTracks}
                          </div>
                        )}
                      </div>

                      {/* 試聴操作（右側） */}
                      {song.audioPath && (
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-white/5">
                          <button
                            onClick={() => handleTogglePlay(song)}
                            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                              isThisPlaying
                                ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30 font-bold'
                                : 'bg-white/10 hover:bg-white/20 text-white'
                            }`}
                          >
                            {isThisPlaying ? (
                              <>
                                <span className="inline-block w-2 h-2 rounded-full bg-black animate-pulse" />
                                <span>一時停止</span>
                              </>
                            ) : (
                              <>
                                <span>▶ 試聴する</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 再生中のシークバー */}
                    {isThisActive && song.audioPath && (
                      <div className="mt-4 pt-3 border-t border-cyan-500/20">
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] font-mono text-cyan-400 w-10 text-right">
                            {formatTime(currentTime)}
                          </span>
                          <input
                            type="range"
                            min="0"
                            max={duration || 100}
                            step="0.1"
                            value={currentTime}
                            onChange={handleSeek}
                            className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                          />
                          <span className="text-[11px] font-mono text-gray-500 w-10">
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
        {/* 3. Price セクション: 料金表 & 制作ガイド */}
        {/* ========================================================================= */}
        <section id="price" className="scroll-mt-20">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-mono text-cyan-400 tracking-wider uppercase">{'// 03. PRICING & TERMS'}</span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
              制作料金プラン
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              ご依頼の基本料金目安です。個人クリエイター様・同人企画・企業案件問わず、ご予算に合わせた柔軟なご提案・値引き相談が可能です。
            </p>
          </div>

          {/* 3大料金カード */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {/* インスト */}
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between hover:border-white/20 transition-all">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-gray-400">Instrumental</span>
                <h3 className="text-xl font-bold mt-1 mb-2 text-white">BGM・インスト楽曲</h3>
                <div className="flex items-baseline gap-1 my-4">
                  <span className="text-3xl font-extrabold text-cyan-400 font-mono">40,000</span>
                  <span className="text-xs text-gray-400 font-mono">円〜 (税込)</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed mb-6">
                  ゲームBGM、配信オープニング/エンディング、動画PV、イベント劇伴など。
                </p>
                <div className="space-y-2 text-xs text-gray-300 border-t border-white/10 pt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400">✓</span> 尺目安: 1〜3分程度
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400">✓</span> シームレスループ処理対応
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400">✓</span> リテイク2回まで無料
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400">✓</span> 商用利用・収益化配信利用OK
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-white/5">
                <Link
                  href="/contact"
                  className="w-full block py-2 text-center text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  BGM制作を相談する
                </Link>
              </div>
            </div>

            {/* 歌モノ（おすすめ） */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-cyan-950/40 via-white/[0.04] to-purple-950/20 border-2 border-cyan-500/50 flex flex-col justify-between relative shadow-xl shadow-cyan-950/40">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-cyan-500 text-black text-[11px] font-bold tracking-wider uppercase">
                RECOMMENDED
              </div>
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-cyan-300">Vocal Song</span>
                <h3 className="text-xl font-bold mt-1 mb-2 text-white">歌モノ・ボーカル楽曲</h3>
                <div className="flex items-baseline gap-1 my-4">
                  <span className="text-3xl font-extrabold text-cyan-300 font-mono">70,000</span>
                  <span className="text-xs text-gray-400 font-mono">円〜 (税込)</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed mb-6">
                  VTuberオリジナル曲、ボーカロイド楽曲、同人/商業ゲーム主題歌など。
                </p>
                <div className="space-y-2 text-xs text-gray-200 border-t border-white/10 pt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400">✓</span> 作曲・編曲・オケミックス込み
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400">✓</span> カラオケ（Off-Vocal）音源付属
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400">✓</span> コーラス付きオケ・パラ納品対応
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400">✓</span> デモ段階のリテイク回数無制限
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10">
                <Link
                  href="/contact"
                  className="w-full block py-2.5 text-center text-xs font-bold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black transition-colors shadow-md"
                >
                  歌モノ制作を相談する
                </Link>
              </div>
            </div>

            {/* アレンジ・リミックス */}
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between hover:border-white/20 transition-all">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-gray-400">Arrangement</span>
                <h3 className="text-xl font-bold mt-1 mb-2 text-white">アレンジ・カバー音源</h3>
                <div className="flex items-baseline gap-1 my-4">
                  <span className="text-3xl font-extrabold text-purple-400 font-mono">30,000</span>
                  <span className="text-xs text-gray-400 font-mono">円〜 (税込)</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed mb-6">
                  「歌ってみた」用オケ制作、既存楽曲の大胆なリアレンジ、リミックスなど。
                </p>
                <div className="space-y-2 text-xs text-gray-300 border-t border-white/10 pt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-purple-400">✓</span> キー変更・尺のカスタム対応
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-purple-400">✓</span> 原曲リスペクト×独自アレンジ
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-purple-400">✓</span> リテイク2回まで無料
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-purple-400">✓</span> 高音質マスタリング音源納品
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-white/5">
                <Link
                  href="/contact"
                  className="w-full block py-2 text-center text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  アレンジを相談する
                </Link>
              </div>
            </div>
          </div>

          {/* オプション案内 & 柔軟なご相談 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
            <div className="p-6 rounded-xl bg-white/[0.02] border border-white/10">
              <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <span>⚙️</span> オプション料金（目安）
              </h4>
              <ul className="space-y-2 text-xs text-gray-400">
                <li className="flex justify-between py-1 border-b border-white/5">
                  <span>特急納品オプション (2週間以内)</span>
                  <span className="font-mono text-cyan-300">+15,000円〜</span>
                </li>
                <li className="flex justify-between py-1 border-b border-white/5">
                  <span>パラデータ (全ステム個別) 納品</span>
                  <span className="font-mono text-cyan-300">+10,000円</span>
                </li>
                <li className="flex justify-between py-1 border-b border-white/5">
                  <span>ボーカルピッチ補正 / タイミングエディット</span>
                  <span className="font-mono text-cyan-300">+8,000円 / 1本</span>
                </li>
                <li className="flex justify-between py-1">
                  <span>著作権譲渡（買取）契約</span>
                  <span className="font-mono text-cyan-300">要相談 (個別お見積もり)</span>
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-xl bg-gradient-to-br from-purple-950/20 to-black border border-purple-500/20">
              <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <span>🤝</span> ご予算に応じた柔軟な対応
              </h4>
              <p className="text-xs text-gray-300 leading-relaxed mb-3">
                「同人企画なので予算が少し足りない」「ショート尺（1分以内）なので安くしてほしい」など、ご希望に応じて構成や作業範囲を調整したお見積もりが可能です。
              </p>
              <p className="text-xs text-purple-300">
                まずはお気軽にお問い合わせフォーム、またはX（Twitter）のDMよりご相談ください。
              </p>
            </div>
          </div>

          {/* 制作の流れ */}
          <div className="p-6 rounded-xl bg-black/40 border border-white/10">
            <h4 className="text-sm font-bold text-white mb-6 font-mono uppercase tracking-wide">
              {'// 制作の流れ (Workflow)'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
              <div className="space-y-2">
                <div className="font-mono text-xs text-cyan-400 font-bold">STEP 01</div>
                <div className="text-sm font-bold text-white">ご相談・ヒアリング</div>
                <div className="text-xs text-gray-400 leading-relaxed">
                  用途、希望納期、イメージ参考曲、予算感などを伺い、お見積もりをご提示します。
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-mono text-xs text-cyan-400 font-bold">STEP 02</div>
                <div className="text-sm font-bold text-white">デモ制作（確認）</div>
                <div className="text-xs text-gray-400 leading-relaxed">
                  ワンコーラス等のデモ音源を制作。方向性・メロディ・コード感を確認いただきます。
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-mono text-xs text-cyan-400 font-bold">STEP 03</div>
                <div className="text-sm font-bold text-white">フル制作・ミックス</div>
                <div className="text-xs text-gray-400 leading-relaxed">
                  フル尺への展開、細部の音作り、ミックス・マスタリングを仕上げます。
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-mono text-xs text-cyan-400 font-bold">STEP 04</div>
                <div className="text-sm font-bold text-white">最終確認・納品</div>
                <div className="text-xs text-gray-400 leading-relaxed">
                  完成音源をご確認いただき、24bit/48kHz WAV等のご指定形式で納品いたします。
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* ========================================================================= */}
        {/* 4. 外部リンク集 (YouTube, Twitter, Streaming) */}
        {/* ========================================================================= */}
        <section id="links" className="scroll-mt-20">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-mono text-cyan-400 tracking-wider uppercase">{'// 04. OFFICIAL LINKS'}</span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-6">
            公式リンク・配信チャンネル
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {workLinks.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group p-5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-cyan-500/30 transition-all flex items-center gap-4"
              >
                <div className="flex-shrink-0 p-2.5 rounded-lg bg-black/40 border border-white/5 group-hover:scale-105 transition-transform">
                  {link.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-white group-hover:text-cyan-400 transition-colors">
                    {link.title}
                  </div>
                  <div className="text-xs text-gray-400 truncate mt-0.5">
                    {link.description}
                  </div>
                </div>
                <span className="text-gray-600 group-hover:text-cyan-400 transition-colors text-sm">
                  ↗
                </span>
              </a>
            ))}
          </div>
        </section>


        {/* ========================================================================= */}
        {/* 5. お問い合わせ CTA */}
        {/* ========================================================================= */}
        <section id="contact" className="scroll-mt-20">
          <div className="p-8 sm:p-12 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-purple-950/30 to-black border border-cyan-500/30 text-center relative overflow-hidden">
            <div className="relative z-10 max-w-2xl mx-auto space-y-4">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                GET IN TOUCH
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                楽曲制作のご依頼・お見積もり
              </h2>
              <p className="text-sm text-gray-300 leading-relaxed">
                企画段階のふんわりとしたご相談でも大歓迎です。<br className="hidden sm:inline" />
                制作スケジュール、参考楽曲、ご予算など、まずはお気軽にご連絡ください。
              </p>
              <div className="pt-4 flex flex-wrap justify-center gap-4">
                <Link
                  href="/contact"
                  className="px-8 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm transition-all shadow-lg shadow-cyan-500/30 active:scale-95"
                >
                  お問い合わせフォームへ進む
                </Link>
                <a
                  href="https://x.com/askey_Azukibar"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-all border border-white/10"
                >
                  X（Twitter）のDMで相談する
                </a>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* フッター */}
      <footer className="border-t border-white/10 py-8 mt-20 text-center text-xs text-gray-500 font-mono">
        <p>&copy; {new Date().getFullYear()} .new label. All rights reserved.</p>
      </footer>
    </div>
  )
}