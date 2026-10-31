'use client'

import React from 'react'
import { Song } from '../../lib/firestore'

interface SongParallaxLayerProps {
  song: Song
  index: number
  scrollY: number
  bufferHeight: number
  spacerHeight: number
  backgroundSize: string
  layerFilter: string
  isCurrentlyPlaying: boolean
  isShowingInfo: boolean
  onPlay: (song: Song, index: number) => void
}

export default function SongParallaxLayer({
  song,
  index,
  scrollY,
  bufferHeight,
  spacerHeight,
  backgroundSize,
  layerFilter,
  isCurrentlyPlaying,
  isShowingInfo,
  onPlay
}: SongParallaxLayerProps) {
  const scrollOffset =
    index === 0
      ? Math.max(0, scrollY - bufferHeight)
      : Math.max(0, scrollY - (bufferHeight + index * spacerHeight))

  const translateTransform = `translate3d(0, ${scrollOffset}px, 0)`
  const bgPosY = index === 0 ? 50 + scrollOffset * 0.08 : 50 + scrollOffset * 0.05

  return (
    <>
      {/* パララックスレイヤーコンテナ */}
      <div
        className="fixed inset-0 w-full h-full will-change-transform"
        style={{
          transform: translateTransform,
          zIndex: -(index + 1),
          transition: 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        }}
      >
        {/* 背景画像レイヤー（フィルター適用対象） */}
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            backgroundImage: song.coverImagePath ? `url(${song.coverImagePath})` : undefined,
            backgroundColor: song.coverImagePath ? undefined : '#1f2937',
            backgroundSize: backgroundSize,
            backgroundPosition: `center ${bgPosY}%`,
            backgroundRepeat: 'no-repeat',
            filter: `${layerFilter} drop-shadow(0 10px 25px rgba(0, 0, 0, 1)) drop-shadow(0 4px 8px rgba(0, 0, 0, 1))`,
            transition: 'filter 0.3s ease-out'
          }}
        />

        {/* 再生ボタン（フィルター影響外・半透明黒円の直感的なデザイン） */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ease-in-out pointer-events-none ${
            !isCurrentlyPlaying ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
          }`}
        >
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-black/60 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex items-center justify-center transition-all duration-300">
              <svg
                className="w-8 h-8 md:w-12 md:h-12 text-white fill-white translate-x-0.5 drop-shadow-md"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <span className="text-white text-xs md:text-sm font-semibold tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] uppercase select-none">
              PLAY
            </span>
          </div>
        </div>

        {/* 未再生時のdescriptionテキスト（フレーバーテキスト） */}
        <div
          className={`absolute right-0 top-3/5 transform -translate-y-3/5 text-white bg-transparent text-right transition-all duration-1000 ease-out ${
            !isCurrentlyPlaying && !isShowingInfo
              ? 'opacity-100 transform -translate-y-3/5 translate-x-0'
              : 'opacity-0 transform -translate-y-3/5 translate-x-5'
          }`}
        >
          {song.description && (
            <div
              className="pl-4 pr-4 py-2"
              style={{
                background: 'linear-gradient(to left, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0))'
              }}
            >
              <p
                className="text-sm sm:text-lg md:text-1xl lg:text-2xl xl:text-3xl drop-shadow whitespace-pre-line leading-relaxed"
                style={{ opacity: 1, fontFamily: 'vdl-v7gothic, sans-serif', fontWeight: 300 }}
              >
                {song.description.replace(/\/n/g, '\n')}
              </p>
            </div>
          )}
        </div>

        {/* 再生中の楽曲情報表示（フィルター影響外） */}
        <div
          className={`absolute right-4 top-1/2 transform -translate-y-1/2 text-white bg-transparent text-right pr-2 transition-all duration-1000 ease-out ${
            isShowingInfo
              ? 'opacity-100 transform -translate-y-1/2 translate-x-0'
              : 'opacity-0 transform -translate-y-1/2 translate-x-5'
          }`}
        >
          <div className="overflow-hidden mb-2 md:mb-4">
            <h3
              className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-8xl font-bold drop-shadow-lg leading-tight break-words overflow-hidden"
              style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto' }}
            >
              {song.title.replace(/\/n/g, '\n')}
            </h3>
          </div>
          <p
            className="text-lg sm:text-2xl md:text-3xl lg:text-5xl xl:text-7xl font-medium mb-2 md:mb-4 drop-shadow-md break-words leading-tight whitespace-pre-line"
            style={{ opacity: 0.9 }}
          >
            {song.genre.replace(/\/n/g, '\n')}
          </p>
          <p
            className="text-sm sm:text-lg md:text-xl lg:text-2xl xl:text-4xl font-normal drop-shadow-md break-words leading-tight"
            style={{ opacity: 0.8 }}
          >
            {song.releaseDate}
          </p>
          {song.originalTracks && (
            <p
              className="text-xs sm:text-sm md:text-lg lg:text-xl xl:text-3xl font-semibold drop-shadow-md break-words leading-tight whitespace-pre-line"
              style={{ opacity: 0.8 }}
            >
              {song.originalTracks.replace(/\/n/g, '\n')}
            </p>
          )}
        </div>
      </div>

      {/* クリック可能な透明レイヤー */}
      <div
        className="fixed inset-0 w-full h-full cursor-pointer transition-all duration-300 will-change-transform"
        style={{
          transform: translateTransform,
          zIndex: 100 - index,
          transition: 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        }}
        onClick={(e) => {
          e.preventDefault()
          onPlay(song, index)
        }}
        title={`${song.title} - クリックで再生`}
      />
    </>
  )
}

