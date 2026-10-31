'use client'

import React from 'react'

interface HeroHeaderLayerProps {
  scrollY: number
  songsCount: number
  onScrollClick: () => void
}

export default function HeroHeaderLayer({
  scrollY,
  songsCount,
  onScrollClick
}: HeroHeaderLayerProps) {
  const translateTransform = `translate3d(0, ${scrollY * -0.8}px, 0)`

  return (
    <>
      {/* ヘッダー背景画像レイヤー */}
      <div
        className="fixed inset-0 w-full h-full will-change-transform"
        style={{
          backgroundImage: `url(/images/newlabel_logo.png)`,
          backgroundSize: '50%',
          backgroundPosition: `center ${50 - scrollY * 0.1}%`,
          backgroundRepeat: 'no-repeat',
          transform: translateTransform,
          zIndex: -(songsCount + 1),
          filter: `brightness(0.9) saturate(0.8) blur(0.5px) drop-shadow(0 10px 25px rgba(0, 0, 0, 0.3))`,
          transition: 'filter 0.3s ease-out, transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        }}
      />

      {/* ヘッダークリック可能レイヤー */}
      <div
        className="fixed top-0 left-0 w-full transition-all duration-300 will-change-transform"
        style={{
          height: '75vh',
          transform: translateTransform,
          zIndex: 100 + songsCount,
          transition: 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          pointerEvents: scrollY > 100 ? 'none' : 'auto'
        }}
      >
        <header
          className="relative shadow-sm backdrop-blur-sm h-full flex items-center"
          style={{
            background:
              'linear-gradient(to bottom, rgba(255, 255, 255, 1) 70%, rgba(255, 255, 255, 0.8) 100%)'
          }}
        >
          <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center w-full">
            <div className="flex-1 flex flex-col items-center">
              <div className="h-32 w-auto overflow-hidden flex items-center justify-center">
                <img
                  src="/images/newlabel_logo.png"
                  alt="NewLabel Logo"
                  className="h-64 w-auto object-cover"
                  style={{
                    objectPosition: '50% 50%',
                    clipPath: 'inset(30% 0 40% 0)'
                  }}
                />
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-1 text-center">
                SCROLL AND PLAY DEMO
              </p>
            </div>
          </div>

          {/* スクロール促進アイコン */}
          <div
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 cursor-pointer hover:opacity-70 transition-opacity px-36 pb-6 pt-[100px]"
            onClick={onScrollClick}
            title="最初の楽曲まで移動"
          >
            <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[12px] border-l-transparent border-r-transparent border-t-gray-500 opacity-100 animate-bounce" />
          </div>
        </header>
      </div>
    </>
  )
}

