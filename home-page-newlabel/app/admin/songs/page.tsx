'use client'

import { useState, useEffect } from 'react'
import { Song } from '../../api/songs/route'
import AuthGuard from '../../../components/AuthGuard'
import { useAuth } from '../../../contexts/AuthContext'

export default function SongsAdmin() {
  const { user, logout } = useAuth()
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingSong, setEditingSong] = useState<Song | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingAudio, setUploadingAudio] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    releaseDate: '',
    genre: '',
    description: '',
    originalTracks: '',
    audioPath: '',
    coverImagePath: '',
    visible: 'true'
  })

  // 楽曲一覧を取得
  const fetchSongs = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/songs')
      if (!response.ok) throw new Error('楽曲の取得に失敗しました')
      const data = await response.json()
      setSongs(data.songs || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : '楽曲の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSongs()
  }, [])

  // フォームをリセット
  const resetForm = () => {
    setFormData({
      title: '',
      releaseDate: '',
      genre: '',
      description: '',
      originalTracks: '',
      audioPath: '',
      coverImagePath: '',
      visible: 'true'
    })
    setEditingSong(null)
    setShowAddForm(false)
  }

  // メッセージをクリア
  const clearMessages = () => {
    setError('')
    setSuccessMessage('')
  }

  // 新規追加
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMessages()
    
    try {
      const response = await fetch('/api/songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '楽曲の追加に失敗しました')
      }
      
      setSuccessMessage('楽曲が正常に追加されました')
      resetForm()
      fetchSongs()
    } catch (err) {
      setError(err instanceof Error ? err.message : '楽曲の追加に失敗しました')
    }
  }

  // 編集開始
  const startEdit = (song: Song) => {
    setFormData({
      title: song.title,
      releaseDate: song.releaseDate,
      genre: song.genre,
      description: song.description,
      originalTracks: song.originalTracks,
      audioPath: song.audioPath,
      coverImagePath: song.coverImagePath,
      visible: song.visible
    })
    setEditingSong(song)
    setShowAddForm(true)
  }

  // 複製開始
  const startDuplicate = (song: Song) => {
    setFormData({
      title: `${song.title} (コピー)`,
      releaseDate: song.releaseDate,
      genre: song.genre,
      description: song.description,
      originalTracks: song.originalTracks,
      audioPath: song.audioPath,
      coverImagePath: song.coverImagePath,
      visible: song.visible
    })
    setEditingSong(null) // 新規として扱う
    setShowAddForm(true)
  }

  // 更新
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSong) return
    
    clearMessages()
    
    try {
      const response = await fetch('/api/songs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingSong.id, ...formData })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '楽曲の更新に失敗しました')
      }
      
      setSuccessMessage('楽曲が正常に更新されました')
      resetForm()
      fetchSongs()
    } catch (err) {
      setError(err instanceof Error ? err.message : '楽曲の更新に失敗しました')
    }
  }

  // 削除
  const handleDelete = async (id: string) => {
    if (!confirm('この楽曲を削除してもよろしいですか？')) return
    
    clearMessages()
    
    try {
      const response = await fetch(`/api/songs?id=${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '楽曲の削除に失敗しました')
      }
      
      setSuccessMessage('楽曲が正常に削除されました')
      fetchSongs()
    } catch (err) {
      setError(err instanceof Error ? err.message : '楽曲の削除に失敗しました')
    }
  }

  // 表示・非表示の直接トグル
  const handleToggleVisibility = async (song: Song) => {
    clearMessages()
    
    try {
      const updatedSong = {
        ...song,
        visible: song.visible === 'true' ? 'false' : 'true'
      }
      
      const response = await fetch('/api/songs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSong)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '表示状態の更新に失敗しました')
      }
      
      setSuccessMessage(`「${song.title}」の表示状態を更新しました`)
      fetchSongs()
    } catch (err) {
      setError(err instanceof Error ? err.message : '表示状態の更新に失敗しました')
    }
  }

  // フォーム入力の処理
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // トグルの処理
  const handleToggleVisible = () => {
    setFormData(prev => ({ ...prev, visible: prev.visible === 'true' ? 'false' : 'true' }))
  }

  // 画像アップロード
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    clearMessages()

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload/images', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '画像のアップロードに失敗しました')
      }

      const result = await response.json()
      setFormData(prev => ({ ...prev, coverImagePath: result.filePath }))
      setSuccessMessage('画像が正常にアップロードされました')
    } catch (err) {
      setError(err instanceof Error ? err.message : '画像のアップロードに失敗しました')
    } finally {
      setUploadingImage(false)
      // ファイル入力をリセット
      e.target.value = ''
    }
  }

  // 音声アップロード
  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingAudio(true)
    clearMessages()

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload/audio', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '音声ファイルのアップロードに失敗しました')
      }

      const result = await response.json()
      setFormData(prev => ({ ...prev, audioPath: result.filePath }))
      setSuccessMessage('音声ファイルが正常にアップロードされました')
    } catch (err) {
      setError(err instanceof Error ? err.message : '音声ファイルのアップロードに失敗しました')
    } finally {
      setUploadingAudio(false)
      // ファイル入力をリセット
      e.target.value = ''
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">読み込み中...</div>
        </div>
      </div>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">楽曲管理</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">
                ログイン中: {user?.email}
              </span>
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm"
              >
                ログアウト
              </button>
            </div>
          </div>
        
        {/* メッセージ表示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-900 text-red-200 rounded-lg">
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="mb-6 p-4 bg-green-900 text-green-200 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* 追加ボタン */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            新規楽曲追加
          </button>
        </div>

        {/* 追加/編集フォーム */}
        {showAddForm && (
          <div className="mb-8 p-6 bg-gray-900 rounded-lg">
            <h2 className="text-xl font-bold mb-4">
              {editingSong ? '楽曲編集' : '新規楽曲追加'}
            </h2>
            
            <form onSubmit={editingSong ? handleUpdate : handleAdd} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">タイトル</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">リリース日</label>
                  <input
                    type="date"
                    name="releaseDate"
                    value={formData.releaseDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">ジャンル</label>
                  <input
                    type="text"
                    name="genre"
                    value={formData.genre}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">表示状態</label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={handleToggleVisible}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                        formData.visible === 'true' ? 'bg-green-600' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.visible === 'true' ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className="ml-3 text-sm">
                      {formData.visible === 'true' ? '表示' : '非表示'}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">音声ファイルパス</label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      name="audioPath"
                      value={formData.audioPath}
                      onChange={handleInputChange}
                      placeholder="/audio/filename.wav"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={handleAudioUpload}
                        disabled={uploadingAudio}
                        className="hidden"
                        id="audio-upload"
                      />
                      <label
                        htmlFor="audio-upload"
                        className={`px-3 py-1 text-sm rounded cursor-pointer transition-colors ${
                          uploadingAudio
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        {uploadingAudio ? 'アップロード中...' : '音声ファイルをアップロード'}
                      </label>
                      <span className="text-xs text-gray-400">または直接パスを入力</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">カバー画像パス</label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      name="coverImagePath"
                      value={formData.coverImagePath}
                      onChange={handleInputChange}
                      placeholder="/images/covers/filename.jpg"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className={`px-3 py-1 text-sm rounded cursor-pointer transition-colors ${
                          uploadingImage
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {uploadingImage ? 'アップロード中...' : '画像をアップロード'}
                      </label>
                      <span className="text-xs text-gray-400">または直接パスを入力</span>
                    </div>
                    {formData.coverImagePath && (
                      <div className="mt-2">
                        <img
                          src={formData.coverImagePath}
                          alt="プレビュー"
                          className="w-16 h-16 object-cover rounded border border-gray-600"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">説明</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">オリジナルトラック</label>
                <input
                  type="text"
                  name="originalTracks"
                  value={formData.originalTracks}
                  onChange={handleInputChange}
                  placeholder="Original Song A, Original Song B"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                >
                  {editingSong ? '更新' : '追加'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 楽曲一覧 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">楽曲一覧 ({songs.length}件)</h2>
          
          {songs.length === 0 ? (
            <div className="text-gray-400 text-center py-8">楽曲が登録されていません</div>
          ) : (
            <div className="grid gap-4">
              {songs.map((song) => (
                <div key={song.id} className="p-4 bg-gray-900 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4 flex-1">
                      {/* サムネイル */}
                      {song.coverImagePath && (
                        <div className="flex-shrink-0">
                          <img
                            src={song.coverImagePath}
                            alt={song.title}
                            className="w-16 h-16 object-cover rounded border border-gray-600"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                            }}
                          />
                        </div>
                      )}
                      
                      {/* 楽曲情報 */}
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="text-lg font-semibold">{song.title}</h3>
                          {/* 直接トグル可能な表示状態 */}
                          <button
                            onClick={() => handleToggleVisibility(song)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                              song.visible === 'true' ? 'bg-green-600' : 'bg-gray-600'
                            }`}
                            title={`クリックで${song.visible === 'true' ? '非表示' : '表示'}に切り替え`}
                          >
                            <span
                              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                song.visible === 'true' ? 'translate-x-5' : 'translate-x-1'
                              }`}
                            />
                          </button>
                          <span className={`text-xs ${
                            song.visible === 'true' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {song.visible === 'true' ? '表示' : '非表示'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-gray-400">
                          <div>ID: {song.id}</div>
                          <div>ジャンル: {song.genre}</div>
                          <div>リリース: {song.releaseDate}</div>
                          {song.description && <div className="md:col-span-2 lg:col-span-3">説明: {song.description}</div>}
                          {song.originalTracks && <div className="md:col-span-2 lg:col-span-3">オリジナル: {song.originalTracks}</div>}
                          {song.audioPath && <div className="md:col-span-2 lg:col-span-3">音声: {song.audioPath}</div>}
                          {song.coverImagePath && <div className="md:col-span-2 lg:col-span-3">画像: {song.coverImagePath}</div>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => startEdit(song)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-sm rounded transition-colors"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => startDuplicate(song)}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-sm rounded transition-colors"
                      >
                        複製
                      </button>
                      <button
                        onClick={() => handleDelete(song.id)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-sm rounded transition-colors"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>
    </AuthGuard>
  )
}