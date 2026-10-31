import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from './firebase-admin'
import type { Song, License, Profile, MovieWork, DesignWork } from './firestore'

// ==========================================
// 順序付きコレクション共通ヘルパー（Admin SDK 経由。Firestore ルールの対象外）
// ==========================================

interface OrderedItem {
  id: string
  order: number
  createdAt?: Date
  updatedAt?: Date
}

async function addOrderedDocAdmin<T extends OrderedItem>(
  collectionName: string,
  itemData: Omit<T, 'id' | 'createdAt' | 'updatedAt'>,
  errorLabel: string
): Promise<T> {
  try {
    const db = getAdminDb()
    const snapshot = await db.collection(collectionName).get()
    const maxId = Math.max(...snapshot.docs.map((d) => parseInt(d.id, 10) || 0), 0)
    const newId = (maxId + 1).toString()

    // 既存ドキュメントの表示順を1つずつ下げる
    const batch = db.batch()
    for (const d of snapshot.docs) {
      batch.update(d.ref, {
        order: (d.data().order ?? 0) + 1,
        updatedAt: FieldValue.serverTimestamp()
      })
    }

    // 新しいドキュメントを最上位に設定
    const newDoc = {
      ...itemData,
      id: newId,
      order: 1,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    }
    batch.set(db.collection(collectionName).doc(newId), newDoc)
    await batch.commit()
    return { ...itemData, id: newId, order: 1 } as T
  } catch (error) {
    console.error(`${errorLabel}追加エラー:`, error)
    throw new Error(`${errorLabel}の追加に失敗しました`)
  }
}

async function updateOrderedDocAdmin<T extends OrderedItem>(
  collectionName: string,
  id: string,
  updates: Partial<T>,
  errorLabel: string
): Promise<void> {
  try {
    // id / 作成日時はクライアントから上書きさせない
    const { id: _id, createdAt: _createdAt, ...rest } = updates
    void _id
    void _createdAt
    await getAdminDb().collection(collectionName).doc(id).update({
      ...rest,
      updatedAt: FieldValue.serverTimestamp()
    })
  } catch (error) {
    console.error(`${errorLabel}更新エラー:`, error)
    throw new Error(`${errorLabel}の更新に失敗しました`)
  }
}

async function deleteOrderedDocAdmin<T extends OrderedItem>(
  collectionName: string,
  id: string,
  errorLabel: string
): Promise<void> {
  try {
    const db = getAdminDb()
    const docRef = db.collection(collectionName).doc(id)
    const docSnap = await docRef.get()
    if (!docSnap.exists) {
      throw new Error(`${errorLabel}が見つかりません`)
    }
    const deletedData = docSnap.data() as T

    await docRef.delete()

    // 削除された要素より下位の表示順を1つずつ上げる
    const snapshot = await db.collection(collectionName).get()
    const batch = db.batch()
    for (const d of snapshot.docs) {
      const remaining = d.data() as T
      if (remaining.order > deletedData.order) {
        batch.update(d.ref, {
          order: remaining.order - 1,
          updatedAt: FieldValue.serverTimestamp()
        })
      }
    }
    await batch.commit()
  } catch (error) {
    console.error(`${errorLabel}削除エラー:`, error)
    throw new Error(`${errorLabel}の削除に失敗しました`)
  }
}

async function reorderOrderedDocsAdmin(
  collectionName: string,
  ids: string[],
  errorLabel: string
): Promise<void> {
  try {
    const db = getAdminDb()
    const batch = db.batch()
    ids.forEach((id, i) => {
      batch.update(db.collection(collectionName).doc(id), {
        order: i + 1,
        updatedAt: FieldValue.serverTimestamp()
      })
    })
    await batch.commit()
  } catch (error) {
    console.error(`${errorLabel}順序変更エラー:`, error)
    throw new Error(`${errorLabel}順序の変更に失敗しました`)
  }
}

// ==========================================
// 楽曲 (Songs) 操作
// ==========================================

// 楽曲一覧取得（Admin SDK 経由・クライアントSDKフォールバック付き）
export async function getSongsAdmin(): Promise<Song[]> {
  try {
    const db = getAdminDb()
    const snapshot = await db.collection('songs').get()
    const songs = snapshot.docs.map((doc, index) => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        order: typeof data.order === 'number' ? data.order : index + 1,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt
      }
    }) as Song[]
    return songs.sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999))
  } catch (adminError) {
    console.warn('Admin SDK での楽曲取得失敗、クライアントSDKにフォールバック:', adminError)
    const { getSongs } = await import('./firestore')
    return getSongs()
  }
}

// 楽曲追加
export async function addSong(songData: Omit<Song, 'id' | 'createdAt' | 'updatedAt'>): Promise<Song> {
  return addOrderedDocAdmin<Song>('songs', songData, '楽曲')
}

// 楽曲更新
export async function updateSong(id: string, updates: Partial<Song>): Promise<void> {
  return updateOrderedDocAdmin<Song>('songs', id, updates, '楽曲')
}

// 楽曲削除
export async function deleteSong(id: string): Promise<void> {
  return deleteOrderedDocAdmin<Song>('songs', id, '楽曲')
}

// 楽曲順序変更
export async function reorderSongs(songIds: string[]): Promise<void> {
  return reorderOrderedDocsAdmin('songs', songIds, '楽曲')
}

// ==========================================
// 設定 (License / Profile) 操作
// ==========================================

// ライセンス取得（Admin SDK 経由・フォールバック保証付き）
export async function getLicenseAdmin(): Promise<License> {
  const { defaultLicense } = await import('./fallback-data')
  try {
    const db = getAdminDb()
    const doc = await db.collection('settings').doc('license').get()
    if (doc.exists) {
      return doc.data() as License
    }
    // 未設定の場合は初期データを自動保存
    try {
      await db.collection('settings').doc('license').set({
        ...defaultLicense,
        updatedAt: FieldValue.serverTimestamp()
      })
    } catch (saveErr) {
      console.warn('ライセンス初期データ保存スキップ:', saveErr)
    }
    return defaultLicense
  } catch (error) {
    console.warn('ライセンスデータ取得失敗のためフォールバックを使用:', error)
    return defaultLicense
  }
}

// プロフィール取得（Admin SDK 経由・フォールバック保証付き）
export async function getProfileAdmin(): Promise<Profile> {
  const { defaultProfile } = await import('./fallback-data')
  try {
    const db = getAdminDb()
    const doc = await db.collection('settings').doc('profile').get()
    if (doc.exists) {
      return doc.data() as Profile
    }
    return defaultProfile
  } catch (error) {
    console.warn('プロフィールデータ取得失敗のためフォールバックを使用:', error)
    return defaultProfile
  }
}

// ==========================================
// 動画実績 (Movies) 操作
// ==========================================

export async function getMoviesAdmin(): Promise<MovieWork[]> {
  const { defaultMovies } = await import('./fallback-data')
  try {
    const db = getAdminDb()
    const snapshot = await db.collection('movies').orderBy('order', 'asc').get()
    if (snapshot.empty) {
      return defaultMovies
    }
    return snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id
    })) as MovieWork[]
  } catch (error) {
    console.warn('動画データ取得失敗のためフォールバックを使用:', error)
    return defaultMovies
  }
}

export async function addMovie(movieData: Omit<MovieWork, 'id' | 'createdAt' | 'updatedAt'>): Promise<MovieWork> {
  return addOrderedDocAdmin<MovieWork>('movies', movieData, '動画')
}

export async function updateMovie(id: string, updates: Partial<MovieWork>): Promise<void> {
  return updateOrderedDocAdmin<MovieWork>('movies', id, updates, '動画')
}

export async function deleteMovie(id: string): Promise<void> {
  return deleteOrderedDocAdmin<MovieWork>('movies', id, '動画')
}

export async function reorderMovies(movieIds: string[]): Promise<void> {
  return reorderOrderedDocsAdmin('movies', movieIds, '動画')
}

// ==========================================
// デザイン実績 (Designs) 操作
// ==========================================

export async function getDesignsAdmin(): Promise<DesignWork[]> {
  const { defaultDesigns } = await import('./fallback-data')
  try {
    const db = getAdminDb()
    const snapshot = await db.collection('designs').orderBy('order', 'asc').get()
    if (snapshot.empty) {
      return defaultDesigns
    }
    return snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id
    })) as DesignWork[]
  } catch (error) {
    console.warn('デザインデータ取得失敗のためフォールバックを使用:', error)
    return defaultDesigns
  }
}

export async function addDesign(designData: Omit<DesignWork, 'id' | 'createdAt' | 'updatedAt'>): Promise<DesignWork> {
  return addOrderedDocAdmin<DesignWork>('designs', designData, 'デザイン')
}

export async function updateDesign(id: string, updates: Partial<DesignWork>): Promise<void> {
  return updateOrderedDocAdmin<DesignWork>('designs', id, updates, 'デザイン')
}

export async function deleteDesign(id: string): Promise<void> {
  return deleteOrderedDocAdmin<DesignWork>('designs', id, 'デザイン')
}

export async function reorderDesigns(designIds: string[]): Promise<void> {
  return reorderOrderedDocsAdmin('designs', designIds, 'デザイン')
}
