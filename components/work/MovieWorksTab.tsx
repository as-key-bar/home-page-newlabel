'use client'

import React from 'react'
import { MovieWork } from '../../lib/firestore'
import { getYoutubeEmbedUrl } from '../../lib/youtube'

interface MovieWorksTabProps {
  movies: MovieWork[]
  loading: boolean
}

export default function MovieWorksTab({ movies, loading }: MovieWorksTabProps) {
  const visibleMovies = movies.filter((m) => m.visible !== false)

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" aria-busy="true">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/40 overflow-hidden animate-pulse"
          >
            <div className="aspect-video w-full bg-gray-200 dark:bg-gray-700" />
            <div className="p-4 space-y-2">
              <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (visibleMovies.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500 dark:text-gray-400 text-sm border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
        現在公開可能な動画実績を準備中です。
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {visibleMovies.map((movie) => {
        const embedUrl = getYoutubeEmbedUrl(movie.youtubeUrl)
        return (
          <div
            key={movie.id}
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/40 overflow-hidden flex flex-col shadow-sm"
          >
            {/* YouTube 埋め込み */}
            <div className="aspect-video w-full bg-black">
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  title={movie.title}
                  loading="lazy"
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                  動画を読み込めません
                </div>
              )}
            </div>

            {/* メタ情報 */}
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-base text-gray-900 dark:text-white mb-1.5">
                  {movie.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                  {movie.description}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

