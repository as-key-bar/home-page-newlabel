'use client'

import React, { useState } from 'react'
import { DesignWork } from '../../lib/firestore'

interface DesignWorksTabProps {
  designs: DesignWork[]
  loading: boolean
}

export default function DesignWorksTab({ designs, loading }: DesignWorksTabProps) {
  const [selectedDesign, setSelectedDesign] = useState<DesignWork | null>(null)
  const visibleDesigns = designs.filter((d) => d.visible !== false)

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-sm">
        デザインデータを読み込み中...
      </div>
    )
  }

  if (visibleDesigns.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500 dark:text-gray-400 text-sm border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
        現在公開可能なデザイン実績を準備中です。
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleDesigns.map((design) => (
          <div
            key={design.id}
            onClick={() => setSelectedDesign(design)}
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/40 overflow-hidden flex flex-col group cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-all shadow-sm"
          >
            {/* 画像エリア */}
            <div className="aspect-square w-full bg-gray-100 dark:bg-gray-800 overflow-hidden flex items-center justify-center relative">
              <img
                src={design.imagePath}
                alt={design.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium">
                拡大表示 🔍
              </div>
            </div>

            {/* メタ情報 */}
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white mb-1">
                  {design.title}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                  {design.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 拡大プレビューモーダル */}
      {selectedDesign && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedDesign(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-xl max-w-3xl w-full p-4 sm:p-6 overflow-hidden max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-700 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                  {selectedDesign.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 whitespace-pre-line">
                  {selectedDesign.description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDesign(null)}
                className="p-1 rounded-lg text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white text-xl"
                aria-label="閉じる"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center bg-black/5 dark:bg-black/40 rounded-lg p-2 min-h-0">
              <img
                src={selectedDesign.imagePath}
                alt={selectedDesign.title}
                className="max-h-[65vh] w-auto max-w-full object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

