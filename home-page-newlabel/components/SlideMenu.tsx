'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function SlideMenu() {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  const closeMenu = () => {
    setIsOpen(false)
  }

  return (
    <>
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