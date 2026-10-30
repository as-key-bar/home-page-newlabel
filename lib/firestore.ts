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

// 楽曲データ取得
export async function getSongs(): Promise<Song[]> {
  try {
    const songsRef = collection(db, 'songs')
    const snapshot = await getDocs(songsRef)
    
    const songs = snapshot.docs.map((doc, index) => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        order: typeof data.order === 'number' ? data.order : index + 1,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
      }
    }) as Song[]

    return songs.sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999))
  } catch (error) {
    console.error('楽曲データ取得エラー:', error)
    throw new Error('楽曲データの取得に失敗しました')
  }
}

// 公開楽曲のみ取得
export async function getVisibleSongs(): Promise<Song[]> {
  try {
    const songsRef = collection(db, 'songs')
    const q = query(
      songsRef, 
      where('visible', '==', true)
    )
    const snapshot = await getDocs(q)
    
    const songs = snapshot.docs.map((doc, index) => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        order: typeof data.order === 'number' ? data.order : index + 1,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
      }
    }) as Song[]

    return songs.sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999))
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
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
    } as Song
  } catch (error) {
    console.error('楽曲取得エラー:', error)
    throw new Error('楽曲の取得に失敗しました')
  }
}

// 楽曲追加（クライアント Firestore SDK）
export async function addSongClient(songData: Omit<Song, 'id' | 'order' | 'createdAt' | 'updatedAt'>): Promise<Song> {
  const songsSnapshot = await getDocs(collection(db, 'songs'))
  const maxId = Math.max(...songsSnapshot.docs.map(d => parseInt(d.id) || 0), 0)
  const newId = (maxId + 1).toString()

  const batch = writeBatch(db)
  for (const d of songsSnapshot.docs) {
    const currentOrder = typeof d.data().order === 'number' ? d.data().order : 0
    batch.update(d.ref, { order: currentOrder + 1, updatedAt: serverTimestamp() })
  }

  const newSong = {
    ...songData,
    id: newId,
    order: 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }
  batch.set(doc(db, 'songs', newId), newSong)
  await batch.commit()

  return { ...songData, id: newId, order: 1 } as Song
}

// 楽曲更新（クライアント Firestore SDK）
export async function updateSongClient(id: string, updates: Partial<Song>): Promise<void> {
  const { id: _id, createdAt: _createdAt, ...rest } = updates
  void _id
  void _createdAt
  await updateDoc(doc(db, 'songs', id), {
    ...rest,
    updatedAt: serverTimestamp()
  })
}

// 楽曲削除（クライアント Firestore SDK）
export async function deleteSongClient(id: string): Promise<void> {
  const songRef = doc(db, 'songs', id)
  const songSnap = await getDoc(songRef)
  if (!songSnap.exists()) {
    throw new Error('楽曲が見つかりません')
  }
  const songData = songSnap.data() as Song
  await deleteDoc(songRef)

  const songsSnapshot = await getDocs(collection(db, 'songs'))
  const batch = writeBatch(db)
  for (const d of songsSnapshot.docs) {
    const remaining = d.data() as Song
    if ((remaining.order ?? 0) > (songData.order ?? 0)) {
      batch.update(d.ref, {
        order: remaining.order - 1,
        updatedAt: serverTimestamp()
      })
    }
  }
  await batch.commit()
}

// 楽曲表示順変更（クライアント Firestore SDK）
export async function reorderSongByActionClient(id: string, action: 'up' | 'down' | 'top' | 'bottom'): Promise<void> {
  const songs = await getSongs()
  const targetIndex = songs.findIndex(s => s.id === id)
  if (targetIndex === -1) {
    throw new Error('指定された楽曲が見つかりません')
  }

  let newIndex = targetIndex
  switch (action) {
    case 'up':
      newIndex = Math.max(0, targetIndex - 1)
      break
    case 'down':
      newIndex = Math.min(songs.length - 1, targetIndex + 1)
      break
    case 'top':
      newIndex = 0
      break
    case 'bottom':
      newIndex = songs.length - 1
      break
  }

  if (newIndex !== targetIndex) {
    const [movedItem] = songs.splice(targetIndex, 1)
    songs.splice(newIndex, 0, movedItem)

    const batch = writeBatch(db)
    songs.forEach((song, i) => {
      batch.update(doc(db, 'songs', song.id), {
        order: i + 1,
        updatedAt: serverTimestamp()
      })
    })
    await batch.commit()
  }
}

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

// 動画実績データ取得
export async function getMovies(): Promise<MovieWork[]> {
  try {
    const moviesRef = collection(db, 'movies')
    const snapshot = await getDocs(moviesRef)
    const movies = snapshot.docs.map((doc, index) => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        order: typeof data.order === 'number' ? data.order : index + 1,
      }
    }) as MovieWork[]
    return movies.sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999))
  } catch (error) {
    console.warn('動画実績データ取得失敗:', error)
    return []
  }
}

export async function addMovieClient(movieData: Omit<MovieWork, 'id' | 'order' | 'createdAt' | 'updatedAt'>): Promise<MovieWork> {
  const snapshot = await getDocs(collection(db, 'movies'))
  const maxId = Math.max(...snapshot.docs.map(d => parseInt(d.id) || 0), 0)
  const newId = (maxId + 1).toString()

  const batch = writeBatch(db)
  for (const d of snapshot.docs) {
    const currentOrder = typeof d.data().order === 'number' ? d.data().order : 0
    batch.update(d.ref, { order: currentOrder + 1, updatedAt: serverTimestamp() })
  }

  const newMovie = {
    ...movieData,
    id: newId,
    order: 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }
  batch.set(doc(db, 'movies', newId), newMovie)
  await batch.commit()
  return { ...movieData, id: newId, order: 1 } as MovieWork
}

export async function updateMovieClient(id: string, updates: Partial<MovieWork>): Promise<void> {
  const { id: _id, createdAt: _createdAt, ...rest } = updates
  void _id
  void _createdAt
  await updateDoc(doc(db, 'movies', id), {
    ...rest,
    updatedAt: serverTimestamp()
  })
}

export async function deleteMovieClient(id: string): Promise<void> {
  const docRef = doc(db, 'movies', id)
  const docSnap = await getDoc(docRef)
  if (!docSnap.exists()) {
    throw new Error('動画が見つかりません')
  }
  const movieData = docSnap.data() as MovieWork
  await deleteDoc(docRef)

  const snapshot = await getDocs(collection(db, 'movies'))
  const batch = writeBatch(db)
  for (const d of snapshot.docs) {
    const remaining = d.data() as MovieWork
    if ((remaining.order ?? 0) > (movieData.order ?? 0)) {
      batch.update(d.ref, {
        order: remaining.order - 1,
        updatedAt: serverTimestamp()
      })
    }
  }
  await batch.commit()
}

export async function reorderMovieByActionClient(id: string, action: 'up' | 'down' | 'top' | 'bottom'): Promise<void> {
  const movies = await getMovies()
  const targetIndex = movies.findIndex(m => m.id === id)
  if (targetIndex === -1) throw new Error('指定された動画が見つかりません')

  let newIndex = targetIndex
  switch (action) {
    case 'up': newIndex = Math.max(0, targetIndex - 1); break
    case 'down': newIndex = Math.min(movies.length - 1, targetIndex + 1); break
    case 'top': newIndex = 0; break
    case 'bottom': newIndex = movies.length - 1; break
  }

  if (newIndex !== targetIndex) {
    const [moved] = movies.splice(targetIndex, 1)
    movies.splice(newIndex, 0, moved)
    const batch = writeBatch(db)
    movies.forEach((m, i) => {
      batch.update(doc(db, 'movies', m.id), { order: i + 1, updatedAt: serverTimestamp() })
    })
    await batch.commit()
  }
}

// デザイン実績データ取得
export async function getDesigns(): Promise<DesignWork[]> {
  try {
    const designsRef = collection(db, 'designs')
    const snapshot = await getDocs(designsRef)
    const designs = snapshot.docs.map((doc, index) => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        order: typeof data.order === 'number' ? data.order : index + 1,
      }
    }) as DesignWork[]
    return designs.sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999))
  } catch (error) {
    console.warn('デザイン実績データ取得失敗:', error)
    return []
  }
}

export async function addDesignClient(designData: Omit<DesignWork, 'id' | 'order' | 'createdAt' | 'updatedAt'>): Promise<DesignWork> {
  const snapshot = await getDocs(collection(db, 'designs'))
  const maxId = Math.max(...snapshot.docs.map(d => parseInt(d.id) || 0), 0)
  const newId = (maxId + 1).toString()

  const batch = writeBatch(db)
  for (const d of snapshot.docs) {
    const currentOrder = typeof d.data().order === 'number' ? d.data().order : 0
    batch.update(d.ref, { order: currentOrder + 1, updatedAt: serverTimestamp() })
  }

  const newDesign = {
    ...designData,
    id: newId,
    order: 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }
  batch.set(doc(db, 'designs', newId), newDesign)
  await batch.commit()
  return { ...designData, id: newId, order: 1 } as DesignWork
}

export async function updateDesignClient(id: string, updates: Partial<DesignWork>): Promise<void> {
  const { id: _id, createdAt: _createdAt, ...rest } = updates
  void _id
  void _createdAt
  await updateDoc(doc(db, 'designs', id), {
    ...rest,
    updatedAt: serverTimestamp()
  })
}

export async function deleteDesignClient(id: string): Promise<void> {
  const docRef = doc(db, 'designs', id)
  const docSnap = await getDoc(docRef)
  if (!docSnap.exists()) {
    throw new Error('デザインが見つかりません')
  }
  const designData = docSnap.data() as DesignWork
  await deleteDoc(docRef)

  const snapshot = await getDocs(collection(db, 'designs'))
  const batch = writeBatch(db)
  for (const d of snapshot.docs) {
    const remaining = d.data() as DesignWork
    if ((remaining.order ?? 0) > (designData.order ?? 0)) {
      batch.update(d.ref, {
        order: remaining.order - 1,
        updatedAt: serverTimestamp()
      })
    }
  }
  await batch.commit()
}

export async function reorderDesignByActionClient(id: string, action: 'up' | 'down' | 'top' | 'bottom'): Promise<void> {
  const designs = await getDesigns()
  const targetIndex = designs.findIndex(d => d.id === id)
  if (targetIndex === -1) throw new Error('指定されたデザインが見つかりません')

  let newIndex = targetIndex
  switch (action) {
    case 'up': newIndex = Math.max(0, targetIndex - 1); break
    case 'down': newIndex = Math.min(designs.length - 1, targetIndex + 1); break
    case 'top': newIndex = 0; break
    case 'bottom': newIndex = designs.length - 1; break
  }

  if (newIndex !== targetIndex) {
    const [moved] = designs.splice(targetIndex, 1)
    designs.splice(newIndex, 0, moved)
    const batch = writeBatch(db)
    designs.forEach((d, i) => {
      batch.update(doc(db, 'designs', d.id), { order: i + 1, updatedAt: serverTimestamp() })
    })
    await batch.commit()
  }
}