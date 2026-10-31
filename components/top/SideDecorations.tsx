'use client'

import React, { memo } from 'react'

interface SideDecorationsProps {
  scrollY: number
}

// 画面高さ + ループ周期分のみの軽量な要素数に最適化（280px周期）
const DOTS = Array.from({ length: 24 })
const TRIANGLES = Array.from({ length: 6 })

function SideDecorationsComponent({ scrollY }: SideDecorationsProps) {
  const offsetTransform = `translate3d(0, ${(scrollY * -0.3) % 280}px, 0)`

  return (
    <>
      {/* 画面両端のドット列 */}
      <div className="fixed left-0 top-0 w-4 h-screen z-50 overflow-hidden pointer-events-none">
        <div
          className="flex flex-col items-center pt-8 will-change-transform"
          style={{
            transform: offsetTransform
          }}
        >
          {DOTS.map((_, index) => (
            <div
              key={`left-dot-${index}`}
              className="w-2 h-2 bg-white rounded-full opacity-60 mb-12"
            />
          ))}
        </div>
      </div>

      <div className="fixed right-0 top-0 w-4 h-screen z-50 overflow-hidden pointer-events-none">
        <div
          className="flex flex-col items-center pt-8 will-change-transform"
          style={{
            transform: offsetTransform
          }}
        >
          {DOTS.map((_, index) => (
            <div
              key={`right-dot-${index}`}
              className="w-2 h-2 bg-white rounded-full opacity-60 mb-12"
            />
          ))}
        </div>
      </div>

      {/* 画面両端の三角形列（ドット列の内側） */}
      <div className="fixed left-6 top-0 w-4 h-screen z-50 overflow-hidden pointer-events-none">
        <div
          className="flex flex-col items-center pt-8 will-change-transform"
          style={{
            transform: offsetTransform
          }}
        >
          {TRIANGLES.map((_, index) => (
            <div
              key={`left-triangle-${index}`}
              className="w-0 h-0 opacity-60"
              style={{
                borderTop: '4px solid transparent',
                borderBottom: '4px solid transparent',
                borderLeft: '6px solid white',
                marginBottom: '272px'
              }}
            />
          ))}
        </div>
      </div>

      <div className="fixed right-6 top-0 w-4 h-screen z-50 overflow-hidden pointer-events-none">
        <div
          className="flex flex-col items-center pt-8 will-change-transform"
          style={{
            transform: offsetTransform
          }}
        >
          {TRIANGLES.map((_, index) => (
            <div
              key={`right-triangle-${index}`}
              className="w-0 h-0 opacity-60"
              style={{
                borderTop: '4px solid transparent',
                borderBottom: '4px solid transparent',
                borderRight: '6px solid white',
                marginBottom: '272px'
              }}
            />
          ))}
        </div>
      </div>
    </>
  )
}

const SideDecorations = memo(SideDecorationsComponent)
export default SideDecorations
