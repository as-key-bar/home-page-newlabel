'use client'

import { useState } from 'react'
import Link from 'next/link'

interface SlideMenuProps {
  volume?: number
  onVolumeChange?: (volume: number) => void
  isLoading?: boolean
}

export default function SlideMenu({ volume = 0.1, onVolumeChange, isLoading = false }: SlideMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  const closeMenu = () => {
    setIsOpen(false)
  }

  // ローディング中は非表示
  if (isLoading) {
    return null
  }

  return (
    <>
      {/* ヘッダー右上コントロール群 */}
      <div className="fixed top-4 right-4 z-[10000] flex items-center space-x-2 sm:space-x-3">
        {/* YouTube リンク */}
        <a
          href="https://www.youtube.com/@newlabelofficial"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg bg-white/90 hover:bg-white shadow-md transition-all duration-200 flex items-center justify-center hover:scale-105 group"
          aria-label="公式 YouTube チャンネル"
          title="YouTube チャンネルを開く"
        >
          <svg className="w-5 h-5 text-[#FF0000]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        </a>

        {/* 音量コントロール（onVolumeChangeが渡されている場合のみ表示） */}
        {onVolumeChange && (
          <div className="flex items-center space-x-2 px-2.5 py-2 rounded-lg bg-white/90 shadow-md">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-black">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" fill="currentColor"/>
            </svg>
            <input
              type="range"
              min="0"
              max="0.4"
              step="0.01"
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-16 sm:w-20 h-1 appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #000000 0%, #000000 ${(volume / 0.4) * 100}%, #000000 ${(volume / 0.4) * 100}%, #000000 100%)`,
                height: '1px'
              }}
            />
          </div>
        )}
        
        {/* メニューボタン */}
        <button
          onClick={toggleMenu}
          className="p-2 rounded-lg bg-white/90 hover:bg-white shadow-md transition-all duration-200"
          aria-label="メニューを開く"
        >
          <div className="w-6 h-6 flex flex-col justify-center space-y-1">
            <span className={`block h-0.5 w-6 bg-gray-800 transition-transform duration-200 ${isOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
            <span className={`block h-0.5 w-6 bg-gray-800 transition-opacity duration-200 ${isOpen ? 'opacity-0' : ''}`}></span>
            <span className={`block h-0.5 w-6 bg-gray-800 transition-transform duration-200 ${isOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
          </div>
        </button>
      </div>

      <style jsx>{`
        .slider {
          background: #000000;
          outline: none;
        }
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          background: white;
          border: 1px solid #000000;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 2px rgba(0,0,0,0.3);
        }
        .slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          background: white;
          border: 1px solid #000000;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 2px rgba(0,0,0,0.3);
        }
      `}</style>

      {/* オーバーレイ */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[9998] transition-opacity duration-200"
          onClick={closeMenu}
        />
      )}

      {/* スライドメニュー */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white text-black transform transition-transform duration-300 z-[9999] shadow-xl ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-8 pt-16">
          <nav className="space-y-6">
            <Link
              href="/"
              onClick={closeMenu}
              className="block text-xl font-medium text-black hover:text-gray-600 transition-colors"
            >
              Home
            </Link>
            <Link
              href="/license"
              onClick={closeMenu}
              className="block text-xl font-medium text-black hover:text-gray-600 transition-colors"
            >
              License
            </Link>
            <Link
              href="/work"
              onClick={closeMenu}
              className="block text-xl font-medium text-black hover:text-gray-600 transition-colors"
            >
              Works & About
              <span className="block text-xs text-gray-500 font-normal mt-0.5">制作実績・料金表・強み</span>
            </Link>
            <Link
              href="/contact"
              onClick={closeMenu}
              className="block text-xl font-medium text-black hover:text-gray-600 transition-colors"
            >
              Contact
            </Link>
          </nav>
        </div>
      </div>
    </>
  )
}