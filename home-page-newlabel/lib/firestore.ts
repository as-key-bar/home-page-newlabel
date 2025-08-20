import { db } from './firebase'
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
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
    
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as Song[]
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
    
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as Song[]
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
    
    return {
      ...snapshot.data(),
      id: snapshot.id,
      createdAt: snapshot.data().createdAt?.toDate(),
      updatedAt: snapshot.data().updatedAt?.toDate(),
    } as Song
  } catch (error) {
    console.error('楽曲取得エラー:', error)
    throw new Error('楽曲の取得に失敗しました')
  }
}

// 楽曲追加
export async function addSong(songData: Omit<Song, 'id' | 'createdAt' | 'updatedAt'>): Promise<Song> {
  try {
    // 現在の楽曲数を取得して新しいIDを生成
    const songsSnapshot = await getDocs(collection(db, 'songs'))
    const maxId = Math.max(...songsSnapshot.docs.map(doc => parseInt(doc.id) || 0), 0)
    const newId = (maxId + 1).toString()
    
    // 既存楽曲の表示順を1つずつ下げる
    const songs = await getSongs()
    for (const song of songs) {
      await updateDoc(doc(db, 'songs', song.id), {
        order: song.order + 1,
        updatedAt: new Date()
      })
    }
    
    // 新しい楽曲を最上位に設定
    const newSong: Song = {
      ...songData,
      id: newId,
      order: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    await setDoc(doc(db, 'songs', newId), newSong)
    return newSong
  } catch (error) {
    console.error('楽曲追加エラー:', error)
    throw new Error('楽曲の追加に失敗しました')
  }
}

// 楽曲更新
export async function updateSong(id: string, updates: Partial<Song>): Promise<void> {
  try {
    const songRef = doc(db, 'songs', id)
    await updateDoc(songRef, {
      ...updates,
      updatedAt: new Date()
    })
  } catch (error) {
    console.error('楽曲更新エラー:', error)
    throw new Error('楽曲の更新に失敗しました')
  }
}

// 楽曲削除
export async function deleteSong(id: string): Promise<void> {
  try {
    const song = await getSong(id)
    if (!song) {
      throw new Error('楽曲が見つかりません')
    }
    
    const deletedOrder = song.order
    
    // 楽曲削除
    await deleteDoc(doc(db, 'songs', id))
    
    // 削除された楽曲より下位の楽曲の表示順を1つずつ上げる
    const songs = await getSongs()
    for (const remainingSong of songs) {
      if (remainingSong.order > deletedOrder) {
        await updateDoc(doc(db, 'songs', remainingSong.id), {
          order: remainingSong.order - 1,
          updatedAt: new Date()
        })
      }
    }
  } catch (error) {
    console.error('楽曲削除エラー:', error)
    throw new Error('楽曲の削除に失敗しました')
  }
}

// 楽曲順序変更
export async function reorderSongs(songIds: string[]): Promise<void> {
  try {
    for (let i = 0; i < songIds.length; i++) {
      await updateDoc(doc(db, 'songs', songIds[i]), {
        order: i + 1,
        updatedAt: new Date()
      })
    }
  } catch (error) {
    console.error('楽曲順序変更エラー:', error)
    throw new Error('楽曲順序の変更に失敗しました')
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