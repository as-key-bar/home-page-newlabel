import { db } from './firebase'
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  orderBy, 
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
    const q = query(songsRef, orderBy('order', 'asc'))
    const snapshot = await getDocs(q)
    
    return snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
      }
    }) as Song[]
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
      where('visible', '==', true),
      orderBy('order', 'asc')
    )
    const snapshot = await getDocs(q)
    
    return snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
      }
    }) as Song[]
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