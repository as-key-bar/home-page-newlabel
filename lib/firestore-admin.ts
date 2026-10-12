import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from './firebase-admin'
import type { Song, License, Profile } from './firestore'

// 書き込み系操作（Admin SDK 経由。Firestore ルールの対象外）

// 楽曲追加
export async function addSong(songData: Omit<Song, 'id' | 'createdAt' | 'updatedAt'>): Promise<Song> {
  try {
    const db = getAdminDb()
    const songsSnapshot = await db.collection('songs').get()
    const maxId = Math.max(...songsSnapshot.docs.map(d => parseInt(d.id) || 0), 0)
    const newId = (maxId + 1).toString()

    // 既存楽曲の表示順を1つずつ下げる
    const batch = db.batch()
    for (const d of songsSnapshot.docs) {
      batch.update(d.ref, { order: (d.data().order ?? 0) + 1, updatedAt: FieldValue.serverTimestamp() })
    }

    // 新しい楽曲を最上位に設定
    const newSong = {
      ...songData,
      id: newId,
      order: 1,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    }
    batch.set(db.collection('songs').doc(newId), newSong)
    await batch.commit()
    return { ...songData, id: newId, order: 1 } as Song
  } catch (error) {
    console.error('楽曲追加エラー:', error)
    throw new Error('楽曲の追加に失敗しました')
  }
}

// 楽曲更新
export async function updateSong(id: string, updates: Partial<Song>): Promise<void> {
  try {
    // id / 作成日時はクライアントから上書きさせない
    const { id: _id, createdAt: _createdAt, ...rest } = updates
    void _id
    void _createdAt
    await getAdminDb().collection('songs').doc(id).update({
      ...rest,
      updatedAt: FieldValue.serverTimestamp()
    })
  } catch (error) {
    console.error('楽曲更新エラー:', error)
    throw new Error('楽曲の更新に失敗しました')
  }
}

// 楽曲削除
export async function deleteSong(id: string): Promise<void> {
  try {
    const db = getAdminDb()
    const songDoc = await db.collection('songs').doc(id).get()
    if (!songDoc.exists) {
      throw new Error('楽曲が見つかりません')
    }
    const songData = songDoc.data() as Song

    await db.collection('songs').doc(id).delete()

    // 削除された楽曲より下位の楽曲の表示順を1つずつ上げる
    const songsSnapshot = await db.collection('songs').get()
    const batch = db.batch()
    for (const doc of songsSnapshot.docs) {
      const remaining = doc.data() as Song
      if (remaining.order > songData.order) {
        batch.update(doc.ref, {
          order: remaining.order - 1,
          updatedAt: FieldValue.serverTimestamp()
        })
      }
    }
    await batch.commit()
  } catch (error) {
    console.error('楽曲削除エラー:', error)
    throw new Error('楽曲の削除に失敗しました')
  }
}

// 楽曲順序変更
export async function reorderSongs(songIds: string[]): Promise<void> {
  try {
    const db = getAdminDb()
    const batch = db.batch()
    songIds.forEach((songId, i) => {
      batch.update(db.collection('songs').doc(songId), {
        order: i + 1,
        updatedAt: FieldValue.serverTimestamp()
      })
    })
    await batch.commit()
  } catch (error) {
    console.error('楽曲順序変更エラー:', error)
    throw new Error('楽曲順序の変更に失敗しました')
  }
}

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


