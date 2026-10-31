'use client'

import React, { memo, useEffect, useRef } from 'react'
import { Song } from '../../lib/firestore'

interface MobileSongSwitcherProps {
  songs: Song[]
  activeSongIndex: number
  currentlyPlaying: number | null
  isHeaderActive: boolean
  isAtBottom: boolean
  onSelectSong: (song: Song, index: number) => void
}

function MobileSongSwitcherComponent({
  songs,
  activeSongIndex,
  currentlyPlaying,
  isHeaderActive,
  isAtBottom,
  onSelectSong
}: MobileSongSwitcherProps) {
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

  // スクロールやタップでアクティブ曲が変わった際、サムネイルバー内でも見える位置へ自動スクロール
  useEffect(() => {
    if (isHeaderActive || isAtBottom) return
    const targetEl = itemRefs.current[activeSongIndex]
    if (targetEl) {
      targetEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [activeSongIndex, isHeaderActive, isAtBottom])

  if (songs.length === 0) {
    return null
  }

  return (
    <nav
      aria-label="楽曲クイック切り替え"
      className="md:hidden fixed right-2.5 top-1/2 -translate-y-1/2 z-[350] flex flex-col items-center gap-2.5 py-2.5 px-1.5 rounded-full bg-black/50 border border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.5)] max-h-[68vh] overflow-y-auto pointer-events-auto"
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}
    >
      {songs.map((song, index) => {
        const songNumericId = parseInt(song.id)
        const isPlaying = currentlyPlaying === songNumericId
        const isCurrentLayer = !isHeaderActive && !isAtBottom && activeSongIndex === index

        return (
          <button
            key={`thumb-${song.id}-${index}`}
            ref={(el) => {
              itemRefs.current[index] = el
            }}
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onSelectSong(song, index)
            }}
            aria-label={`${song.title} を再生`}
            title={song.title}
            className={`relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 transition-all duration-200 focus:outline-none ${
              isPlaying
                ? 'ring-2 ring-white scale-110 shadow-[0_0_12px_rgba(255,255,255,0.85)] opacity-100'
                : isCurrentLayer
                ? 'ring-2 ring-white/80 scale-105 opacity-100'
                : 'border border-white/30 opacity-65 hover:opacity-100 scale-95'
            }`}
          >
            {song.coverImagePath ? (
              <img
                src={song.coverImagePath}
                alt={song.title}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-800 text-white text-xs font-bold flex items-center justify-center">
                {index + 1}
              </div>
            )}

            {/* 再生中インジケーターオーバーレイ */}
            {isPlaying && (
              <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                <div className="flex items-end gap-0.5 h-3.5">
                  <span className="w-0.5 h-3 bg-white rounded-full animate-pulse" />
                  <span
                    className="w-0.5 h-3.5 bg-white rounded-full animate-pulse"
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className="w-0.5 h-2 bg-white rounded-full animate-pulse"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
              </div>
            )}
          </button>
        )
      })}
    </nav>
  )
}

const MobileSongSwitcher = memo(MobileSongSwitcherComponent)
export default MobileSongSwitcher

