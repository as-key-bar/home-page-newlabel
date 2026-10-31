'use client'

import React, { memo } from 'react'

interface HeroHeaderLayerProps {
  scrollY: number
  windowHeight: number
  songsCount: number
  onScrollClick: () => void
}

function HeroHeaderLayerComponent({
  scrollY,
  windowHeight,
  songsCount,
  onScrollClick
}: HeroHeaderLayerProps) {
  // ヘッダーが完全に画面上へスクロールアウトしたら描画・合成をスキップ
  const isOffscreen = windowHeight > 0 && scrollY * 0.8 > windowHeight * 1.1
  const translateTransform = `translate3d(0, ${Math.round(scrollY * -0.8)}px, 0)`

  return (
    <>
      {/* ヘッダー背景画像レイヤー */}
      <div
        className="fixed inset-0 w-full h-full"
        style={{
          backgroundImage: `url(/images/newlabel_logo.png)`,
          backgroundSize: '50%',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          transform: translateTransform,
          zIndex: -(songsCount + 1),
          visibility: isOffscreen ? 'hidden' : 'visible',
          willChange: isOffscreen ? 'auto' : 'transform',
          opacity: 0.9
        }}
      />

      {/* ヘッダークリック可能レイヤー */}
      <div
        className="fixed top-0 left-0 w-full"
        style={{
          height: '75vh',
          transform: translateTransform,
          zIndex: 100 + songsCount,
          visibility: isOffscreen ? 'hidden' : 'visible',
          willChange: isOffscreen ? 'auto' : 'transform',
          pointerEvents: scrollY > 100 || isOffscreen ? 'none' : 'auto'
        }}
      >
        <header
          className="relative shadow-sm h-full flex items-center"
          style={{
            background:
              'linear-gradient(to bottom, rgba(255, 255, 255, 1) 70%, rgba(255, 255, 255, 0.85) 100%)'
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

const HeroHeaderLayer = memo(HeroHeaderLayerComponent)
export default HeroHeaderLayer
