'use client'

import React, { useState, useEffect, useRef } from 'react'

interface LazyImageProps {
  src: string
  alt: string
  className?: string
  style?: React.CSSProperties
  threshold?: number
  placeholder?: string
  onLoad?: () => void
  onError?: () => void
  fallbackColor?: string
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  style = {},
  threshold = 0.1,
  placeholder,
  onLoad,
  onError,
  fallbackColor = '#f3f4f6'
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold, rootMargin: '50px' }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [threshold])

  useEffect(() => {
    if (isVisible && !isLoaded && !hasError) {
      const img = new Image()
      
      img.onload = () => {
        setIsLoaded(true)
        onLoad?.()
      }
      
      img.onerror = () => {
        setHasError(true)
        onError?.()
      }
      
      img.src = src
    }
  }, [isVisible, src, isLoaded, hasError, onLoad, onError])

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={style}
    >
      {/* プレースホルダー */}
      {!isLoaded && !hasError && (
        <div
          className="absolute inset-0 flex items-center justify-center transition-opacity duration-300"
          style={{
            backgroundColor: fallbackColor,
            backgroundImage: placeholder ? `url(${placeholder})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {!placeholder && (
            <div className="animate-pulse">
              <div className="w-8 h-8 bg-gray-300 rounded"></div>
            </div>
          )}
        </div>
      )}

      {/* エラー時のフォールバック */}
      {hasError && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ backgroundColor: fallbackColor }}
        >
          <div className="text-gray-400 text-center">
            <div className="w-8 h-8 mx-auto mb-2 opacity-50">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-xs">画像を読み込めませんでした</p>
          </div>
        </div>
      )}

      {/* メイン画像 */}
      {isLoaded && !hasError && (
        <div
          className="absolute inset-0 transition-opacity duration-500 opacity-100"
          style={{
            backgroundImage: `url(${src})`,
            backgroundSize: style.backgroundSize || 'cover',
            backgroundPosition: style.backgroundPosition || 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
      )}
    </div>
  )
}

export default LazyImage