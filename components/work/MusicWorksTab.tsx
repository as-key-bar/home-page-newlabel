'use client'

import React from 'react'
import { Song } from '../../lib/firestore'

interface MusicWorksTabProps {
  songs: Song[]
  loading: boolean
  currentPlayingId: string | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  onTogglePlay: (song: Song) => void
  onSeek: (e: React.ChangeEvent<HTMLInputElement>) => void
  onVolumeChange: (newVol: number) => void
  onToggleMute: () => void
}

function formatTime(time: number) {
  if (isNaN(time)) return '00:00'
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export default function MusicWorksTab({
  songs,
  loading,
  currentPlayingId,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  onTogglePlay,
  onSeek,
  onVolumeChange,
  onToggleMute
}: MusicWorksTabProps) {
  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-sm">
        楽曲データを読み込み中...
      </div>
    )
  }

  if (songs.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500 dark:text-gray-400 text-sm border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
        現在公開可能な楽曲を準備中です。
      </div>
    )
  }

  return (
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
              {/* カバーアート + 再生ボタン（サムネイルがある場合）、または再生ボタンのみ（サムネイル無しの場合） */}
              {song.coverImagePath ? (
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0 border border-gray-200 dark:border-gray-600 group">
                  <img
                    src={song.coverImagePath}
                    alt={song.title}
                    className="w-full h-full object-cover"
                  />

                  {/* 再生オーバーレイ */}
                  {song.audioPath && (
                    <button
                      onClick={() => onTogglePlay(song)}
                      className="absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity opacity-90 sm:opacity-0 sm:group-hover:opacity-100 hover:!opacity-100"
                      aria-label={isThisPlaying ? '一時停止' : '再生'}
                    >
                      <div className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-md">
                        {isThisPlaying ? (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        )}
                      </div>
                    </button>
                  )}
                </div>
              ) : (
                song.audioPath && (
                  <button
                    onClick={() => onTogglePlay(song)}
                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-colors border shadow-sm ${
                      isThisPlaying
                        ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    aria-label={isThisPlaying ? '一時停止' : '再生'}
                  >
                    {isThisPlaying ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>
                )
              )}

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
                    onClick={() => onTogglePlay(song)}
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
                      onChange={onSeek}
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
                      onClick={onToggleMute}
                      className="p-1 rounded text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                      aria-label={isMuted || volume === 0 ? 'ミュート解除' : 'ミュート'}
                      title={isMuted || volume === 0 ? 'ミュート解除' : 'ミュート'}
                    >
                      {isMuted || volume === 0 ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 14l4-4m0 4l-4-4"
                          />
                        </svg>
                      ) : volume < 0.5 ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.536 8.464a5 5 0 010 7.072M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                          />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                          />
                        </svg>
                      )}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
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
  )
}

