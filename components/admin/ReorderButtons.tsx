'use client'

import React from 'react'
import { ReorderAction } from '../../lib/admin-utils'

interface ReorderButtonsProps {
  id: string
  onReorder: (id: string, action: ReorderAction) => void
}

export default function ReorderButtons({ id, onReorder }: ReorderButtonsProps) {
  return (
    <div className="flex gap-1">
      <button
        type="button"
        onClick={() => onReorder(id, 'top')}
        className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-xs rounded transition-colors"
        title="最上位へ"
      >
        ↑↑
      </button>
      <button
        type="button"
        onClick={() => onReorder(id, 'up')}
        className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-xs rounded transition-colors"
        title="1つ上へ"
      >
        ↑
      </button>
      <button
        type="button"
        onClick={() => onReorder(id, 'down')}
        className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-xs rounded transition-colors"
        title="1つ下へ"
      >
        ↓
      </button>
      <button
        type="button"
        onClick={() => onReorder(id, 'bottom')}
        className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-xs rounded transition-colors"
        title="最下位へ"
      >
        ↓↓
      </button>
    </div>
  )
}

