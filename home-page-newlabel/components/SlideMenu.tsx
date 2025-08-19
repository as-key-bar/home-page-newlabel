'use client'

import { useState } from 'react'
import Link from 'next/link'

interface SlideMenuProps {
  volume?: number
  onVolumeChange?: (volume: number) => void
}

export default function SlideMenu({ volume = 0.1, onVolumeChange }: SlideMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  const closeMenu = () => {
    setIsOpen(false)
  }

  return (
    <>
      {/* 音量コントロール */}
      <div className="fixed top-4 right-20 z-[10000] flex items-center px-3 py-2">
        <div className="flex items-center space-x-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-black">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" fill="currentColor"/>
          </svg>
          <input
            type="range"
            min="0"
            max="0.4"
            step="0.01"
            value={volume}
            onChange={(e) => onVolumeChange?.(parseFloat(e.target.value))}
            className="w-20 h-1 appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #000000 0%, #000000 ${(volume / 0.4) * 100}%, #000000 ${(volume / 0.4) * 100}%, #000000 100%)`,
              height: '1px'
            }}
          />
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
        </div>
      </div>
      
      {/* メニューボタン */}
      <button
        onClick={toggleMenu}
        className="fixed top-4 right-4 z-[10000] p-2 rounded-lg bg-white/90 hover:bg-white shadow-md transition-all duration-200"
        aria-label="メニューを開く"
      >
        <div className="w-6 h-6 flex flex-col justify-center space-y-1">
          <span className={`block h-0.5 w-6 bg-gray-800 transition-transform duration-200 ${isOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
          <span className={`block h-0.5 w-6 bg-gray-800 transition-opacity duration-200 ${isOpen ? 'opacity-0' : ''}`}></span>
          <span className={`block h-0.5 w-6 bg-gray-800 transition-transform duration-200 ${isOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
        </div>
      </button>

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