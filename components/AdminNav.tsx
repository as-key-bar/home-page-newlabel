'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'

export default function AdminNav() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const navItems = [
    { label: '楽曲管理', href: '/admin/songs' },
    { label: '動画実績管理', href: '/admin/movie' },
    { label: 'デザイン実績管理', href: '/admin/design' },
  ]

  return (
    <header className="mb-8 pb-4 border-b border-gray-800">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="hover:opacity-80">
            <img
              src="/images/newlabel_logotrim.png"
              alt="Logo"
              className="h-8 w-auto object-contain filter invert"
            />
          </Link>
          <span className="text-xl font-bold text-white">管理ダッシュボード</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs sm:text-sm text-gray-400 truncate max-w-[200px] sm:max-w-none">
            {user?.email}
          </span>
          <Link
            href="/work"
            target="_blank"
            className="px-3 py-1.5 text-xs rounded border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 transition-colors"
          >
            /work を確認 ↗
          </Link>
          <button
            onClick={logout}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors"
          >
            ログアウト
          </button>
        </div>
      </div>

      <nav className="flex gap-2 overflow-x-auto pt-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}

