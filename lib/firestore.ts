import { db } from './firebase'
import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  query,
  where
} from 'firebase/firestore'
import { moveItemByAction, ReorderAction } from './admin-utils'
import { defaultMovies, defaultDesigns } from './fallback-data'

export interface Song {
  id: string
  order: number
  title: string
  releaseDate: string
  genre: string
  description: string
  originalTracks: string
  audioPath: string
  coverImagePath: string
  visible: boolean
  showInTop?: boolean
  showInPortfolio?: boolean
  clientOrProject?: string
  workDescription?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface MovieWork {
  id: string
  order: number
  title: string
  youtubeUrl: string
  description: string
  visible: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface DesignWork {
  id: string
  order: number
  title: string
  imagePath: string
  description: string
  visible: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface LicenseSection {
  id: string
  title: string
  content: string
}

export interface License {
  title: string
  lastUpdated: string
  sections: LicenseSection[]
  contact: {
    email: string
    twitter: string
  }
}

export interface Profile {
  name: string
  bio: string
  genres: string[]
  equipment: string
  contact: {
    email: string
    twitter: string
    soundcloud: string
    bandcamp: string
    instagram: string
    youtube: string
  }
  profileImage: string
}

// ==========================================
// クライアント側キャッシュ（メモリ + localStorage/sessionStorage）
// ページ遷移時（/ -> /work 等）や再訪問時の待ち時間を0msにするためのSWRキャッシュ層
// ==========================================

const CACHE_TTL_MS = 5 * 60 * 1000 // 5分
const STORAGE_KEYS = {
  visibleSongs: 'newlabel_cache_visible_songs_v2',
  movies: 'newlabel_cache_movies_v2',
  designs: 'newlabel_cache_designs_v2'
} as const

interface CacheEntry<T> {
  data: T
  timestamp: number
}

const memoryCache: {
  visibleSongs?: CacheEntry<Song[]>
  movies?: CacheEntry<MovieWork[]>
  designs?: CacheEntry<DesignWork[]>
} = {}

let prefetchPromise: Promise<void> | null = null

function readCache<T>(
  memEntry: CacheEntry<T> | undefined,
  storageKey: string
): { data: T; isFresh: boolean } | null {
  const now = Date.now()
  if (memEntry) {
    return {
      data: memEntry.data,
      isFresh: now - memEntry.timestamp < CACHE_TTL_MS
    }
  }
  if (typeof window !== 'undefined') {
    try {
      const raw = sessionStorage.getItem(storageKey) || localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw) as CacheEntry<T>
        if (parsed && Array.isArray(parsed.data) && parsed.data.length > 0) {
          return {
            data: parsed.data,
            isFresh: now - (parsed.timestamp || 0) < CACHE_TTL_MS
          }
        }
      }
    } catch {
      // ストレージ読み取り失敗時は無視
    }
  }
  return null
}

function writeCache<T>(
  key: 'visibleSongs' | 'movies' | 'designs',
  storageKey: string,
  data: T
): void {
  if (Array.isArray(data) && data.length === 0) return
  const entry: CacheEntry<T> = { data, timestamp: Date.now() }
  ;(memoryCache as Record<string, unknown>)[key] = entry
  if (typeof window !== 'undefined') {
    try {
      const serialized = JSON.stringify(entry)
      sessionStorage.setItem(storageKey, serialized)
      localStorage.setItem(storageKey, serialized)
    } catch {
      // ストレージ容量超過等は無視
    }
  }
}

export function getCachedVisibleSongs(): Song[] | null {
  const hit = readCache(memoryCache.visibleSongs, STORAGE_KEYS.visibleSongs)
  if (hit && !memoryCache.visibleSongs) {
    memoryCache.visibleSongs = { data: hit.data, timestamp: Date.now() }
  }
  return hit ? hit.data : null
}

export function setCachedVisibleSongs(songs: Song[]): void {
  writeCache('visibleSongs', STORAGE_KEYS.visibleSongs, songs)
}

export function getCachedMovies(): MovieWork[] | null {
  const hit = readCache(memoryCache.movies, STORAGE_KEYS.movies)
  if (hit && !memoryCache.movies) {
    memoryCache.movies = { data: hit.data, timestamp: Date.now() }
  }
  return hit ? hit.data : null
}

export function setCachedMovies(movies: MovieWork[]): void {
  writeCache('movies', STORAGE_KEYS.movies, movies)
}

export function getCachedDesigns(): DesignWork[] | null {
  const hit = readCache(memoryCache.designs, STORAGE_KEYS.designs)
  if (hit && !memoryCache.designs) {
    memoryCache.designs = { data: hit.data, timestamp: Date.now() }
  }
  return hit ? hit.data : null
}

export function setCachedDesigns(designs: DesignWork[]): void {
  writeCache('designs', STORAGE_KEYS.designs, designs)
}

/**
 * 管理画面での追加・更新・削除・並び替え時にキャッシュを破棄する
 */
export function invalidateWorksCache(): void {
  delete memoryCache.visibleSongs
  delete memoryCache.movies
  delete memoryCache.designs
  prefetchPromise = null
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(STORAGE_KEYS.visibleSongs)
      sessionStorage.removeItem(STORAGE_KEYS.movies)
      sessionStorage.removeItem(STORAGE_KEYS.designs)
      localStorage.removeItem(STORAGE_KEYS.visibleSongs)
      localStorage.removeItem(STORAGE_KEYS.movies)
      localStorage.removeItem(STORAGE_KEYS.designs)
    } catch {
      // ignore
    }
  }
}

/**
 * /work ページ表示に必要なデータをバックグラウンドでプリフェッチする
 */
export function prefetchWorksData(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (prefetchPromise) return prefetchPromise

  prefetchPromise = Promise.allSettled([
    readCache(memoryCache.visibleSongs, STORAGE_KEYS.visibleSongs)?.isFresh
      ? Promise.resolve()
      : getVisibleSongs(),
    readCache(memoryCache.movies, STORAGE_KEYS.movies)?.isFresh
      ? Promise.resolve()
      : getMovies()
  ]).then(() => {
    prefetchPromise = null
  })

  return prefetchPromise
}

// ==========================================
// 順序付きコレクション共通ヘルパー（クライアント Firestore SDK）
// ==========================================

interface OrderedItem {
  id: string
  order: number
  createdAt?: Date
  updatedAt?: Date
}

async function getOrderedCollectionClient<T extends OrderedItem>(collectionName: string): Promise<T[]> {
  const snapshot = await getDocs(collection(db, collectionName))
  const items = snapshot.docs.map((docSnap, index) => {
    const data = docSnap.data()
    return {
      ...data,
      id: docSnap.id,
      order: typeof data.order === 'number' ? data.order : index + 1,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt
    } as T
  })
  return items.sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999))
}

async function addOrderedDocClient<T extends OrderedItem>(
  collectionName: string,
  itemData: Omit<T, 'id' | 'order' | 'createdAt' | 'updatedAt'>
): Promise<T> {
  const snapshot = await getDocs(collection(db, collectionName))
  const maxId = Math.max(...snapshot.docs.map((d) => parseInt(d.id, 10) || 0), 0)
  const newId = (maxId + 1).toString()

  const batch = writeBatch(db)
  for (const d of snapshot.docs) {
    const currentOrder = typeof d.data().order === 'number' ? d.data().order : 0
    batch.update(d.ref, { order: currentOrder + 1, updatedAt: serverTimestamp() })
  }

  const newDoc = {
    ...itemData,
    id: newId,
    order: 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }
  batch.set(doc(db, collectionName, newId), newDoc)
  await batch.commit()
  invalidateWorksCache()

  return { ...itemData, id: newId, order: 1 } as T
}

async function updateOrderedDocClient<T extends OrderedItem>(
  collectionName: string,
  id: string,
  updates: Partial<T>
): Promise<void> {
  const { id: _id, createdAt: _createdAt, ...rest } = updates
  void _id
  void _createdAt
  await updateDoc(doc(db, collectionName, id), {
    ...rest,
    updatedAt: serverTimestamp()
  })
  invalidateWorksCache()
}

async function deleteOrderedDocClient<T extends OrderedItem>(
  collectionName: string,
  id: string,
  notFoundMessage: string
): Promise<void> {
  const docRef = doc(db, collectionName, id)
  const docSnap = await getDoc(docRef)
  if (!docSnap.exists()) {
    throw new Error(notFoundMessage)
  }
  const deletedData = docSnap.data() as T
  await deleteDoc(docRef)

  const snapshot = await getDocs(collection(db, collectionName))
  const batch = writeBatch(db)
  for (const d of snapshot.docs) {
    const remaining = d.data() as T
    if ((remaining.order ?? 0) > (deletedData.order ?? 0)) {
      batch.update(d.ref, {
        order: remaining.order - 1,
        updatedAt: serverTimestamp()
      })
    }
  }
  await batch.commit()
  invalidateWorksCache()
}

async function reorderOrderedDocByActionClient<T extends OrderedItem>(
  collectionName: string,
  id: string,
  action: ReorderAction,
  notFoundMessage: string
): Promise<void> {
  const items = await getOrderedCollectionClient<T>(collectionName)
  const result = moveItemByAction(items, id, action)
  if (!result) {
    throw new Error(notFoundMessage)
  }

  if (result.moved) {
    const batch = writeBatch(db)
    result.items.forEach((item, i) => {
      batch.update(doc(db, collectionName, item.id), {
        order: i + 1,
        updatedAt: serverTimestamp()
      })
    })
    await batch.commit()
    invalidateWorksCache()
  }
}

// ==========================================
// 楽曲 (Songs) 操作
// ==========================================

// 楽曲データ取得
export async function getSongs(): Promise<Song[]> {
  try {
    return await getOrderedCollectionClient<Song>('songs')
  } catch (error) {
    console.error('楽曲データ取得エラー:', error)
    throw new Error('楽曲データの取得に失敗しました')
  }
}

// 公開楽曲のみ取得（キャッシュ書き込み付き）
export async function getVisibleSongs(): Promise<Song[]> {
  try {
    const songsRef = collection(db, 'songs')
    const q = query(songsRef, where('visible', '==', true))
    const snapshot = await getDocs(q)

    const songs = snapshot.docs.map((docSnap, index) => {
      const data = docSnap.data()
      return {
        ...data,
        id: docSnap.id,
        order: typeof data.order === 'number' ? data.order : index + 1,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt
      }
    }) as Song[]

    const sorted = songs.sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999))
    writeCache('visibleSongs', STORAGE_KEYS.visibleSongs, sorted)
    return sorted
  } catch (error) {
    console.error('公開楽曲データ取得エラー:', error)
    throw new Error('公開楽曲データの取得に失敗しました')
  }
}

// 単一楽曲取得
export async function getSong(id: string): Promise<Song | null> {
  try {
    const songRef = doc(db, 'songs', id)
    const snapshot = await getDoc(songRef)

    if (!snapshot.exists()) {
      return null
    }

    const data = snapshot.data()
    return {
      ...data,
      id: snapshot.id,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt
    } as Song
  } catch (error) {
    console.error('楽曲取得エラー:', error)
    throw new Error('楽曲の取得に失敗しました')
  }
}

// 楽曲追加（クライアント Firestore SDK）
export async function addSongClient(
  songData: Omit<Song, 'id' | 'order' | 'createdAt' | 'updatedAt'>
): Promise<Song> {
  return addOrderedDocClient<Song>('songs', songData)
}

// 楽曲更新（クライアント Firestore SDK）
export async function updateSongClient(id: string, updates: Partial<Song>): Promise<void> {
  return updateOrderedDocClient<Song>('songs', id, updates)
}

// 楽曲削除（クライアント Firestore SDK）
export async function deleteSongClient(id: string): Promise<void> {
  return deleteOrderedDocClient<Song>('songs', id, '楽曲が見つかりません')
}

// 楽曲表示順変更（クライアント Firestore SDK）
export async function reorderSongByActionClient(id: string, action: ReorderAction): Promise<void> {
  return reorderOrderedDocByActionClient<Song>('songs', id, action, '指定された楽曲が見つかりません')
}

// ==========================================
// 設定 (License / Profile) 操作
// ==========================================

// ライセンス情報取得
export async function getLicense(): Promise<License | null> {
  try {
    const licenseRef = doc(db, 'settings', 'license')
    const snapshot = await getDoc(licenseRef)

    if (!snapshot.exists()) {
      return null
    }

    return snapshot.data() as License
  } catch (error) {
    console.error('ライセンス情報取得エラー:', error)
    throw new Error('ライセンス情報の取得に失敗しました')
  }
}

// プロフィール情報取得
export async function getProfile(): Promise<Profile | null> {
  try {
    const profileRef = doc(db, 'settings', 'profile')
    const snapshot = await getDoc(profileRef)

    if (!snapshot.exists()) {
      return null
    }

    return snapshot.data() as Profile
  } catch (error) {
    console.error('プロフィール情報取得エラー:', error)
    throw new Error('プロフィール情報の取得に失敗しました')
  }
}

// ==========================================
// 動画実績 (Movies) 操作
// ==========================================

export async function getMovies(): Promise<MovieWork[]> {
  try {
    const movies = await getOrderedCollectionClient<MovieWork>('movies')
    const result = movies.length > 0 ? movies : defaultMovies
    writeCache('movies', STORAGE_KEYS.movies, result)
    return result
  } catch (error) {
    console.warn('動画実績データ取得失敗:', error)
    return defaultMovies
  }
}

export async function addMovieClient(
  movieData: Omit<MovieWork, 'id' | 'order' | 'createdAt' | 'updatedAt'>
): Promise<MovieWork> {
  return addOrderedDocClient<MovieWork>('movies', movieData)
}

export async function updateMovieClient(id: string, updates: Partial<MovieWork>): Promise<void> {
  return updateOrderedDocClient<MovieWork>('movies', id, updates)
}

export async function deleteMovieClient(id: string): Promise<void> {
  return deleteOrderedDocClient<MovieWork>('movies', id, '動画が見つかりません')
}

export async function reorderMovieByActionClient(id: string, action: ReorderAction): Promise<void> {
  return reorderOrderedDocByActionClient<MovieWork>('movies', id, action, '指定された動画が見つかりません')
}

// ==========================================
// デザイン実績 (Designs) 操作
// ==========================================

export async function getDesigns(): Promise<DesignWork[]> {
  try {
    const designs = await getOrderedCollectionClient<DesignWork>('designs')
    const result = designs.length > 0 ? designs : defaultDesigns
    writeCache('designs', STORAGE_KEYS.designs, result)
    return result
  } catch (error) {
    console.warn('デザイン実績データ取得失敗:', error)
    return defaultDesigns
  }
}

export async function addDesignClient(
  designData: Omit<DesignWork, 'id' | 'order' | 'createdAt' | 'updatedAt'>
): Promise<DesignWork> {
  return addOrderedDocClient<DesignWork>('designs', designData)
}

export async function updateDesignClient(id: string, updates: Partial<DesignWork>): Promise<void> {
  return updateOrderedDocClient<DesignWork>('designs', id, updates)
}

export async function deleteDesignClient(id: string): Promise<void> {
  return deleteOrderedDocClient<DesignWork>('designs', id, 'デザインが見つかりません')
}

export async function reorderDesignByActionClient(id: string, action: ReorderAction): Promise<void> {
  return reorderOrderedDocByActionClient<DesignWork>('designs', id, action, '指定されたデザインが見つかりません')
}
