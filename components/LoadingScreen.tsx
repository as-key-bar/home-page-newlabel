'use client'

import { useEffect } from 'react'

interface LoadingScreenProps {
  isExiting?: boolean
}

export default function LoadingScreen({ isExiting = false }: LoadingScreenProps) {
  // ローディング画面表示中はスクロールを無効にする
  useEffect(() => {
    // スクロールを無効にするスタイルを追加
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'
    document.body.style.height = '100%'
    
    // コンポーネントがアンマウントされる時にスタイルを元に戻す
    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
      document.body.style.height = ''
    }
  }, [])
  return (
    <div className={`fixed inset-0 z-[10000] bg-white flex flex-col items-center justify-center invert ${isExiting ? 'animate-fall-down shadow-10xl' : ''}`}>
      {/* New Label Name Trim Logo */}
      <div className="mb-8 opacity-0 animate-fade-in-up" style={{ animationDelay: '20ms' }}>
        <img 
          src="/images/newlabel_logotrim.png" 
          alt="New Label Name Trim Logo" 
          className="h-16 w-auto object-contain"
        />
      </div>

      {/* Welcome Message */}
      <div className="mb-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        <p className="text-gray-600 dark:text-gray-400 text-center">official website</p>
      </div>

      {/* Now Loading Message */}
      {/* <p className="text-gray-600 dark:text-gray-400 text-center">now loading...</p> */}

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes fall-down {
          0% {
            transform: translateY(0) rotate(0deg);
          }
          100% {
            transform: translateY(150vh) rotate(15deg);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out forwards;
        }
        .animate-fall-down {
          animation: fall-down 0.8s cubic-bezier(1, 0, 0.5, 0.5) forwards;
        }
      `}</style>
    </div>
  )
}