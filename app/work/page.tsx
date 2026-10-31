'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Song, MovieWork, DesignWork } from '../../lib/firestore'
import SlideMenu from '../../components/SlideMenu'
import { useAudioPlayer } from '../../hooks/useAudioPlayer'
import MusicWorksTab from '../../components/work/MusicWorksTab'
import MovieWorksTab from '../../components/work/MovieWorksTab'
import DesignWorksTab from '../../components/work/DesignWorksTab'
import PricingAndFlowSection from '../../components/work/PricingAndFlowSection'

export default function WorkPage() {
  const [songs, setSongs] = useState<Song[]>([])
  const [movies, setMovies] = useState<MovieWork[]>([])
  const [designs, setDesigns] = useState<DesignWork[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMovies, setLoadingMovies] = useState(true)
  const [loadingDesigns, setLoadingDesigns] = useState(true)
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

  // 楽曲データ取得
  useEffect(() => {
    let isMounted = true

    const loadWorks = async () => {
      try {
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

      try {
        const { getVisibleSongs } = await import('../../lib/firestore')
        const visibleSongs = await getVisibleSongs()
        const portfolioSongs = visibleSongs.filter((song) => song.showInPortfolio !== false)
        if (isMounted) {
          setSongs(portfolioSongs)
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

  // 動画実績データ取得
  useEffect(() => {
    let isMounted = true
    const loadMovies = async () => {
      try {
        const res = await fetch('/api/movies')
        if (res.ok) {
          const data = await res.json()
          if (data && Array.isArray(data.movies) && data.movies.length > 0) {
            if (isMounted) setMovies(data.movies)
            return
          }
        }
      } catch (err) {
        console.warn('Failed to load movies from API:', err)
      }

      try {
        const { getMovies } = await import('../../lib/firestore')
        const directMovies = await getMovies()
        if (isMounted && directMovies.length > 0) {
          setMovies(directMovies)
        }
      } catch (err) {
        console.warn('Failed to load movies from direct Firestore:', err)
      } finally {
        if (isMounted) setLoadingMovies(false)
      }
    }
    loadMovies()
    return () => {
      isMounted = false
    }
  }, [])

  // デザイン実績データ取得
  useEffect(() => {
    let isMounted = true
    const loadDesigns = async () => {
      try {
        const res = await fetch('/api/designs')
        if (res.ok) {
          const data = await res.json()
          if (data && Array.isArray(data.designs) && data.designs.length > 0) {
            if (isMounted) setDesigns(data.designs)
            return
          }
        }
      } catch (err) {
        console.warn('Failed to load designs from API:', err)
      }

      try {
        const { getDesigns } = await import('../../lib/firestore')
        const directDesigns = await getDesigns()
        if (isMounted && directDesigns.length > 0) {
          setDesigns(directDesigns)
        }
      } catch (err) {
        console.warn('Failed to load designs from direct Firestore:', err)
      } finally {
        if (isMounted) setLoadingDesigns(false)
      }
    }
    loadDesigns()
    return () => {
      isMounted = false
    }
  }, [])

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
              これまでに制作・提供した楽曲、動画、デザインなどの制作実績です。
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
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-mono">
                {songs.length}
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
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-mono">
                {movies.filter((m) => m.visible !== false).length}
              </span>
            </button>

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
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-mono">
                {designs.filter((d) => d.visible !== false).length}
              </span>
            </button>
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

          {activeTab === 'design' && <DesignWorksTab designs={designs} loading={loadingDesigns} />}
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
