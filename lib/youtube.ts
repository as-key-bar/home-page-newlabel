/**
 * YouTube の各種 URL 形式から動画 ID (11桁) を抽出するユーティリティ
 */
export function extractYoutubeId(urlOrId: string | undefined | null): string | null {
  if (!urlOrId) return null
  const trimmed = urlOrId.trim()
  if (!trimmed) return null

  // すでに 11 桁の動画 ID の場合
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed
  }

  // youtu.be/ID
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
  if (shortMatch) return shortMatch[1]

  // youtube.com/watch?v=ID
  const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/)
  if (watchMatch) return watchMatch[1]

  // youtube.com/embed/ID
  const embedMatch = trimmed.match(/embed\/([a-zA-Z0-9_-]{11})/)
  if (embedMatch) return embedMatch[1]

  // youtube.com/shorts/ID
  const shortsMatch = trimmed.match(/shorts\/([a-zA-Z0-9_-]{11})/)
  if (shortsMatch) return shortsMatch[1]

  // youtube.com/live/ID
  const liveMatch = trimmed.match(/live\/([a-zA-Z0-9_-]{11})/)
  if (liveMatch) return liveMatch[1]

  return null
}

/**
 * YouTube の埋め込み用 iframe URL を生成
 */
export function getYoutubeEmbedUrl(urlOrId: string | undefined | null): string | null {
  const id = extractYoutubeId(urlOrId)
  if (!id) return null
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0`
}

/**
 * YouTube のサムネイル画像 URL を生成
 */
export function getYoutubeThumbnailUrl(urlOrId: string | undefined | null): string | null {
  const id = extractYoutubeId(urlOrId)
  if (!id) return null
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`
}

