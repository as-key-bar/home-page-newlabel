import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from './firebase-admin'
import { getSong, getSongs, Song } from './firestore'

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
    const song = await getSong(id)
    if (!song) {
      throw new Error('楽曲が見つかりません')
    }

    const db = getAdminDb()
    await db.collection('songs').doc(id).delete()

    // 削除された楽曲より下位の楽曲の表示順を1つずつ上げる
    const songs = await getSongs()
    const batch = db.batch()
    for (const remaining of songs) {
      if (remaining.order > song.order) {
        batch.update(db.collection('songs').doc(remaining.id), {
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

