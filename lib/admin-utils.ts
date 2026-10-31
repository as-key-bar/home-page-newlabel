export type ReorderAction = 'up' | 'down' | 'top' | 'bottom'

/**
 * 配列内の指定ID要素を action ('up' | 'down' | 'top' | 'bottom') に従って移動した新しい配列を返す。
 * 対象が見つからない場合は null、移動不要（先頭で up 等）の場合は元の配列の浅いコピーを返す。
 */
export function moveItemByAction<T extends { id: string }>(
  items: T[],
  id: string,
  action: ReorderAction
): { moved: boolean; items: T[] } | null {
  const targetIndex = items.findIndex((item) => item.id === id)
  if (targetIndex === -1) return null

  let newIndex = targetIndex
  switch (action) {
    case 'up':
      newIndex = Math.max(0, targetIndex - 1)
      break
    case 'down':
      newIndex = Math.min(items.length - 1, targetIndex + 1)
      break
    case 'top':
      newIndex = 0
      break
    case 'bottom':
      newIndex = items.length - 1
      break
    default:
      return null
  }

  if (newIndex === targetIndex) {
    return { moved: false, items: [...items] }
  }

  const next = [...items]
  const [movedItem] = next.splice(targetIndex, 1)
  next.splice(newIndex, 0, movedItem)
  return { moved: true, items: next }
}

/**
 * Firebase Storage へのファイルアップロード共通関数
 */
export async function uploadFileToStorage(options: {
  file: File
  folder: 'images/covers' | 'images/designs' | 'audio'
  maxSizeBytes: number
  allowedMimeTypes?: string[]
}): Promise<string> {
  const { file, folder, maxSizeBytes, allowedMimeTypes } = options

  if (file.size > maxSizeBytes) {
    const maxMB = Math.round(maxSizeBytes / (1024 * 1024))
    throw new Error(`ファイルサイズが大きすぎます（最大${maxMB}MB）`)
  }

  if (allowedMimeTypes && !allowedMimeTypes.includes(file.type)) {
    throw new Error('対応していないファイル形式です')
  }

  const [{ storage }, { ref, uploadBytes, getDownloadURL }] = await Promise.all([
    import('./firebase'),
    import('firebase/storage')
  ])

  const timestamp = Date.now()
  const safeName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
  const storageRef = ref(storage, `${folder}/${safeName}`)
  const uploadResult = await uploadBytes(storageRef, file)
  return getDownloadURL(uploadResult.ref)
}
