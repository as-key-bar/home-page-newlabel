'use client'

import React, { memo } from 'react'
import { Song } from '../../lib/firestore'

interface SongParallaxLayerProps {
  song: Song
  index: number
  scrollOffset: number
  darknessOpacity: number
  isZoomedOut: boolean
  isVisible: boolean
  isCurrentlyPlaying: boolean
  isShowingInfo: boolean
  onPlay: (song: Song, index: number) => void
}

function SongParallaxLayerComponent({
  song,
  index,
  scrollOffset,
  darknessOpacity,
  isZoomedOut,
  isVisible,
  isCurrentlyPlaying,
  isShowingInfo,
  onPlay
}: SongParallaxLayerProps) {
  // 画面外または背面に完全に隠れているレイヤーはGPU合成・イベント判定から除外
  if (!isVisible) {
    return null
  }

  const translateTransform = `translate3d(0, ${Math.round(scrollOffset)}px, 0)`
  // 再生時は 1.0 倍（全体表示）、通常時は 1.18 倍に拡大（GPUの scale3d で滑らかにアニメーション）
  const imageScaleTransform = isZoomedOut ? 'scale3d(1, 1, 1)' : 'scale3d(1.18, 1.18, 1)'

  return (
    <>
      {/* パララックスレイヤーコンテナ */}
      <div
        className="fixed inset-0 w-full h-full overflow-hidden will-change-transform"
        style={{
          transform: translateTransform,
          zIndex: -(index + 1),
          boxShadow: scrollOffset > 0 ? '0 -12px 28px rgba(0, 0, 0, 0.75)' : undefined
        }}
      >
        {/* 背景画像レイヤー（CPU再ペイントを起こす backgroundPosition/backgroundSize 変更を廃止し、GPU scale3d のみで制御） */}
        <div
          className="absolute inset-0 w-full h-full will-change-transform"
          style={{
            backgroundImage: song.coverImagePath ? `url(${song.coverImagePath})` : undefined,
            backgroundColor: song.coverImagePath ? '#111827' : '#1f2937',
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat',
            transform: imageScaleTransform,
            transition: 'transform 1.1s cubic-bezier(0.22, 1, 0.36, 1)'
          }}
        />

        {/* 軽量な暗転オーバーレイ（重い CSS filter: brightness/drop-shadow/blur の代替） */}
        <div
          className="absolute inset-0 bg-black pointer-events-none"
          style={{
            opacity: darknessOpacity,
            transition: 'opacity 0.25s ease-out'
          }}
        />

        {/* 再生ボタン（モバイルGPU負荷の高い backdrop-blur を軽量な半透明黒円に変更） */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-in-out pointer-events-none ${
            !isCurrentlyPlaying ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
          }`}
        >
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-black/70 border border-white/40 shadow-[0_8px_24px_rgba(0,0,0,0.65)] flex items-center justify-center">
              <svg
                className="w-8 h-8 md:w-12 md:h-12 text-white fill-white translate-x-0.5"
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
          className={`absolute right-0 top-3/5 transform -translate-y-3/5 text-white bg-transparent text-right transition-all duration-700 ease-out pointer-events-none ${
            !isCurrentlyPlaying && !isShowingInfo
              ? 'opacity-100 translate-x-0'
              : 'opacity-0 translate-x-5'
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

        {/* 再生中の楽曲情報表示 */}
        <div
          className={`absolute right-4 top-1/2 transform -translate-y-1/2 text-white bg-transparent text-right pr-2 transition-all duration-700 ease-out pointer-events-none ${
            isShowingInfo ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-5'
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

      {/* クリック可能な透明レイヤー（表示中のレイヤーのみ） */}
      <div
        className="fixed inset-0 w-full h-full cursor-pointer will-change-transform"
        style={{
          transform: translateTransform,
          zIndex: 100 - index
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

const SongParallaxLayer = memo(SongParallaxLayerComponent)
export default SongParallaxLayer
