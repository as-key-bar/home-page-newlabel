'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Song,
  MovieWork,
  DesignWork,
  getVisibleSongs,
  getMovies,
  getDesigns,
  getCachedVisibleSongs,
  getCachedMovies,
  getCachedDesigns,
  setCachedVisibleSongs,
  setCachedMovies,
  setCachedDesigns
} from '../../lib/firestore'
import SlideMenu from '../../components/SlideMenu'
import { useAudioPlayer } from '../../hooks/useAudioPlayer'
import MusicWorksTab from '../../components/work/MusicWorksTab'
import MovieWorksTab from '../../components/work/MovieWorksTab'
import DesignWorksTab from '../../components/work/DesignWorksTab'
import PricingAndFlowSection from '../../components/work/PricingAndFlowSection'

// デザイン実績タブの表示フラグ（将来デザイン実績を追加して公開する際は true に変更）
const SHOW_DESIGN_TAB = false

export default function WorkPage() {
  const [songs, setSongs] = useState<Song[]>([])
  const [movies, setMovies] = useState<MovieWork[]>([])
  const [designs, setDesigns] = useState<DesignWork[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMovies, setLoadingMovies] = useState(true)
  const [loadingDesigns, setLoadingDesigns] = useState(!SHOW_DESIGN_TAB ? false : true)
  const [activeTab, setActiveTab] = useState<'music' | 'movie' | 'design'>('music')

  const {
    currentPlayingId,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    handleTogglePlay,
    handleSeek,
    handleVolumeChange,
    toggleMute
  } = useAudioPlayer(0.15)

  // ページ表示時に全カテゴリの実績・件数を一括並列取得（キャッシュがあれば 0ms で即時反映）
  useEffect(() => {
    let isMounted = true

    // 1. キャッシュが存在すれば初回フレームで即座に件数・一覧を反映
    const cachedSongs = getCachedVisibleSongs()
    if (cachedSongs && cachedSongs.length > 0) {
      setSongs(cachedSongs.filter((song) => song.showInPortfolio !== false))
      setLoading(false)
    }

    const cachedMovies = getCachedMovies()
    if (cachedMovies && cachedMovies.length > 0) {
      setMovies(cachedMovies)
      setLoadingMovies(false)
    }

    const cachedDesigns = SHOW_DESIGN_TAB ? getCachedDesigns() : null
    if (cachedDesigns && cachedDesigns.length > 0) {
      setDesigns(cachedDesigns)
      setLoadingDesigns(false)
    }

    // 2. クライアント Firestore SDK で楽曲・動画（・デザイン）を同時並列取得し、揃った時点で一括反映
    const fetchSongsData = async (): Promise<Song[]> => {
      try {
        const visibleSongs = await getVisibleSongs()
        if (visibleSongs.length > 0) {
          return visibleSongs.filter((song) => song.showInPortfolio !== false)
        }
      } catch (clientErr) {
        console.warn('Direct Firestore songs fetch failed, falling back to API:', clientErr)
      }

      try {
        const res = await fetch('/api/songs')
        if (res.ok) {
          const data = await res.json()
          if (data && Array.isArray(data.songs)) {
            const visible = data.songs.filter((song: Song) => song.visible !== false)
            setCachedVisibleSongs(visible)
            return visible.filter((song: Song) => song.showInPortfolio !== false)
          }
        }
      } catch (apiErr) {
        console.error('Fallback API songs fetch failed:', apiErr)
      }
      return cachedSongs ? cachedSongs.filter((song) => song.showInPortfolio !== false) : []
    }

    const fetchMoviesData = async (): Promise<MovieWork[]> => {
      try {
        const directMovies = await getMovies()
        if (directMovies.length > 0) {
          return directMovies
        }
      } catch (clientErr) {
        console.warn('Direct Firestore movies fetch failed, falling back to API:', clientErr)
      }

      try {
        const res = await fetch('/api/movies')
        if (res.ok) {
          const data = await res.json()
          if (data && Array.isArray(data.movies) && data.movies.length > 0) {
            setCachedMovies(data.movies)
            return data.movies
          }
        }
      } catch (apiErr) {
        console.warn('Fallback API movies fetch failed:', apiErr)
      }
      return cachedMovies || []
    }

    const fetchDesignsData = async (): Promise<DesignWork[]> => {
      if (!SHOW_DESIGN_TAB) return []
      try {
        const directDesigns = await getDesigns()
        if (directDesigns.length > 0) {
          return directDesigns
        }
      } catch (clientErr) {
        console.warn('Direct Firestore designs fetch failed, falling back to API:', clientErr)
      }

      try {
        const res = await fetch('/api/designs')
        if (res.ok) {
          const data = await res.json()
          if (data && Array.isArray(data.designs) && data.designs.length > 0) {
            setCachedDesigns(data.designs)
            return data.designs
          }
        }
      } catch (apiErr) {
        console.warn('Fallback API designs fetch failed:', apiErr)
      }
      return cachedDesigns || []
    }

    Promise.all([fetchSongsData(), fetchMoviesData(), fetchDesignsData()]).then(
      ([fetchedSongs, fetchedMovies, fetchedDesigns]) => {
        if (!isMounted) return
        setSongs(fetchedSongs)
        setMovies(fetchedMovies)
        if (SHOW_DESIGN_TAB) {
          setDesigns(fetchedDesigns)
        }
        setLoading(false)
        setLoadingMovies(false)
        setLoadingDesigns(false)
      }
    )

    return () => {
      isMounted = false
    }
  }, [])

  const visibleMovieCount = movies.filter((m) => m.visible !== false).length
  const visibleDesignCount = designs.filter((d) => d.visible !== false).length

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
        {/* 1. Works カード: 制作実績（楽曲・動画・デザイン） */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">制作実績</h2>
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              {SHOW_DESIGN_TAB
                ? 'これまでに制作・提供した楽曲、動画、デザインなどの制作実績です。'
                : 'これまでに制作・提供した楽曲、動画などの制作実績です。'}
            </p>
          </div>

          {/* 実績カテゴリタブ */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('music')}
              className={`pb-3 px-4 text-sm font-semibold transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'music'
                  ? 'border-black dark:border-white text-gray-900 dark:text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <span>楽曲試聴</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-mono min-w-[1.5rem] text-center">
                {loading && songs.length === 0 ? '…' : songs.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('movie')}
              className={`pb-3 px-4 text-sm font-semibold transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'movie'
                  ? 'border-black dark:border-white text-gray-900 dark:text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <span>動画実績</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-mono min-w-[1.5rem] text-center">
                {loadingMovies && visibleMovieCount === 0 ? '…' : visibleMovieCount}
              </span>
            </button>

            {SHOW_DESIGN_TAB && (
              <button
                type="button"
                onClick={() => setActiveTab('design')}
                className={`pb-3 px-4 text-sm font-semibold transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'design'
                    ? 'border-black dark:border-white text-gray-900 dark:text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <span>デザイン実績</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-mono min-w-[1.5rem] text-center">
                  {loadingDesigns && visibleDesignCount === 0 ? '…' : visibleDesignCount}
                </span>
              </button>
            )}
          </div>

          {activeTab === 'music' && (
            <MusicWorksTab
              songs={songs}
              loading={loading}
              currentPlayingId={currentPlayingId}
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              volume={volume}
              isMuted={isMuted}
              onTogglePlay={handleTogglePlay}
              onSeek={handleSeek}
              onVolumeChange={handleVolumeChange}
              onToggleMute={toggleMute}
            />
          )}

          {activeTab === 'movie' && <MovieWorksTab movies={movies} loading={loadingMovies} />}

          {SHOW_DESIGN_TAB && activeTab === 'design' && (
            <DesignWorksTab designs={designs} loading={loadingDesigns} />
          )}
        </section>

        {/* 料金表・制作の流れ・外部リンク・お問い合わせCTA */}
        <PricingAndFlowSection />
      </main>

      {/* フッター */}
      <footer className="text-center text-xs text-gray-500 dark:text-gray-400 py-8">
        <p>&copy; {new Date().getFullYear()} .new label. All rights reserved.</p>
      </footer>
    </div>
  )
}
