'use client'

import { useState, useEffect } from 'react'
import { Song } from '../../api/songs/route'
import AuthGuard from '../../../components/AuthGuard'
import { useAuth } from '../../../contexts/AuthContext'
import { storage } from '../../../lib/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

export default function SongsAdmin() {
  const { user, logout } = useAuth()

  // 管理API用: Firebase IDトークンを Authorization ヘッダーに付与する
  const authFetch = async (url: string, init: RequestInit = {}) => {
    const token = await user?.getIdToken()
    return fetch(url, {
      ...init,
      headers: {
        ...(init.headers as Record<string, string> | undefined),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    })
  }
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
    visible: 'true',
    showInTop: true,
    showInPortfolio: true,
    clientOrProject: ''
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
      visible: 'true',
      showInTop: true,
      showInPortfolio: true,
      clientOrProject: ''
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
      const response = await authFetch('/api/songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          visible: formData.visible === 'true',
          showInTop: formData.showInTop,
          showInPortfolio: formData.showInPortfolio,
          clientOrProject: formData.clientOrProject.trim()
        })
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
      visible: song.visible ? 'true' : 'false',
      showInTop: song.showInTop !== false,
      showInPortfolio: song.showInPortfolio !== false,
      clientOrProject: song.clientOrProject || ''
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
      visible: song.visible ? 'true' : 'false',
      showInTop: song.showInTop !== false,
      showInPortfolio: song.showInPortfolio !== false,
      clientOrProject: song.clientOrProject || ''
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
      const response = await authFetch('/api/songs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: editingSong.id, 
          ...formData,
          visible: formData.visible === 'true',
          showInTop: formData.showInTop,
          showInPortfolio: formData.showInPortfolio,
          clientOrProject: formData.clientOrProject.trim()
        })
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
    
    // 削除中は楽曲を視覚的に無効化
    setSongs(prevSongs => 
      prevSongs.map(song => 
        song.id === id ? { ...song, _deleting: true } : song
      )
    )
    
    try {
      const response = await authFetch(`/api/songs?id=${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        // エラー時は_deletingフラグを削除
        setSongs(prevSongs => 
          prevSongs.map(song => 
            song.id === id ? { ...song, _deleting: false } : song
          )
        )
        throw new Error(errorData.error || '楽曲の削除に失敗しました')
      }
      
      // 削除成功時は即座にUIから楽曲を削除
      setSongs(prevSongs => prevSongs.filter(song => song.id !== id))
      setSuccessMessage('楽曲が正常に削除されました')
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
        visible: !song.visible
      }
      
      const response = await authFetch('/api/songs', {
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

  // 表示先（トップ / 実績）の直接トグル
  const handleToggleField = async (song: Song, field: 'showInTop' | 'showInPortfolio') => {
    clearMessages()
    try {
      const currentValue = song[field] !== false
      const updatedSong = {
        ...song,
        [field]: !currentValue
      }
      const response = await authFetch('/api/songs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSong)
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '表示先の更新に失敗しました')
      }
      const label = field === 'showInTop' ? 'トップ表示' : '実績表示'
      setSuccessMessage(`「${song.title}」の${label}を切り替えました`)
      fetchSongs()
    } catch (err) {
      setError(err instanceof Error ? err.message : '表示先の更新に失敗しました')
    }
  }

  // 表示順変更
  const handleReorder = async (songId: string, action: 'up' | 'down' | 'top' | 'bottom') => {
    clearMessages()
    
    try {
      const response = await authFetch('/api/songs/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: songId, action })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '表示順の変更に失敗しました')
      }
      
      setSuccessMessage('表示順が正常に変更されました')
      fetchSongs()
    } catch (err) {
      setError(err instanceof Error ? err.message : '表示順の変更に失敗しました')
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

  // 画像アップロード（Firebase Storage直接）
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // ファイルサイズチェック
    const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
    if (file.size > MAX_IMAGE_SIZE) {
      setError('画像ファイルサイズが大きすぎます（最大5MB）')
      return
    }

    // ファイル形式チェック
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('対応していない画像形式です（JPEG, PNG, GIF, WebPのみ）')
      return
    }

    setUploadingImage(true)
    clearMessages()

    try {
      // Firebase認証状態を確認
      if (!user) {
        throw new Error('認証が必要です')
      }

      // ファイル名を安全な形式に変換
      const timestamp = Date.now()
      const safeName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      
      console.log(`🔥 Firebase Storageアップロード開始: images/covers/${safeName}`)
      
      // Firebase Storageにアップロード
      const storageRef = ref(storage, `images/covers/${safeName}`)
      const uploadResult = await uploadBytes(storageRef, file)
      
      console.log(`📤 アップロード完了、URL取得中...`)
      const downloadURL = await getDownloadURL(uploadResult.ref)
      
      console.log(`✅ ダウンロードURL取得完了: ${downloadURL}`)
      
      setFormData(prev => ({ ...prev, coverImagePath: downloadURL }))
      setSuccessMessage('画像が正常にアップロードされました')
    } catch (err) {
      console.error('Image upload error:', err)
      if (err instanceof Error && err.message.includes('storage/unauthorized')) {
        setError('アップロード権限がありません。管理者としてログインしていることを確認してください。')
      } else {
        setError(err instanceof Error ? err.message : '画像のアップロードに失敗しました')
      }
    } finally {
      setUploadingImage(false)
      // ファイル入力をリセット
      e.target.value = ''
    }
  }

  // 音声アップロード（Firebase Storage直接）
  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // ファイルサイズチェック
    const MAX_AUDIO_SIZE = 50 * 1024 * 1024 // 50MB
    if (file.size > MAX_AUDIO_SIZE) {
      setError('音声ファイルサイズが大きすぎます（最大50MB）')
      return
    }

    // ファイル形式チェック
    const allowedTypes = [
      'audio/wav', 'audio/wave', 'audio/x-wav',
      'audio/mp3', 'audio/mpeg',
      'audio/flac', 'audio/x-flac',
      'audio/aac', 'audio/mp4',
      'audio/ogg', 'audio/vorbis'
    ]
    if (!allowedTypes.includes(file.type)) {
      setError('対応していない音声形式です（WAV, MP3, FLAC, AAC, OGGのみ）')
      return
    }

    setUploadingAudio(true)
    clearMessages()

    try {
      // Firebase認証状態を確認
      if (!user) {
        throw new Error('認証が必要です')
      }

      // ファイル名を安全な形式に変換
      const timestamp = Date.now()
      const safeName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      
      console.log(`🔥 Firebase Storageアップロード開始: audio/${safeName}`)
      
      // Firebase Storageにアップロード
      const storageRef = ref(storage, `audio/${safeName}`)
      const uploadResult = await uploadBytes(storageRef, file)
      
      console.log(`📤 アップロード完了、URL取得中...`)
      const downloadURL = await getDownloadURL(uploadResult.ref)
      
      console.log(`✅ ダウンロードURL取得完了: ${downloadURL}`)
      
      setFormData(prev => ({ ...prev, audioPath: downloadURL }))
      setSuccessMessage('音声ファイルが正常にアップロードされました')
    } catch (err) {
      console.error('Audio upload error:', err)
      if (err instanceof Error && err.message.includes('storage/unauthorized')) {
        setError('アップロード権限がありません。管理者としてログインしていることを確認してください。')
      } else {
        setError(err instanceof Error ? err.message : '音声ファイルのアップロードに失敗しました')
      }
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
                  <label className="block text-sm font-medium mb-1">音声ファイルパス</label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      name="audioPath"
                      value={formData.audioPath}
                      onChange={handleInputChange}
                      placeholder="Firebase Storage URLまたは/audio/filename.wav"
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
                      placeholder="Firebase Storage URLまたは/images/covers/filename.jpg"
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

              {/* 掲載設定 */}
              <div className="p-4 bg-gray-800/80 rounded-lg border border-gray-700 space-y-3">
                <span className="block text-sm font-semibold text-gray-200">掲載・表示設定</span>
                <div className="flex flex-wrap gap-6 items-center">
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={handleToggleVisible}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formData.visible === 'true' ? 'bg-green-600' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.visible === 'true' ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className="ml-2 text-sm font-medium">
                      全体公開: {formData.visible === 'true' ? '公開' : '非公開'}
                    </span>
                  </div>

                  <label className="inline-flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={formData.showInTop}
                      onChange={(e) => setFormData(prev => ({ ...prev, showInTop: e.target.checked }))}
                      className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-blue-300 font-medium">トップページに表示</span>
                  </label>

                  <label className="inline-flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={formData.showInPortfolio}
                      onChange={(e) => setFormData(prev => ({ ...prev, showInPortfolio: e.target.checked }))}
                      className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-purple-300 font-medium">実績（ポートフォリオ）に表示</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">クライアント / 案件・用途名（任意）</label>
                <input
                  type="text"
                  name="clientOrProject"
                  value={formData.clientOrProject}
                  onChange={handleInputChange}
                  placeholder="例: 株式会社〇〇 / 個人VTuber 〇〇様 / 音ゲー提供楽曲"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500"
                />
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
                <div key={song.id} className={`p-4 bg-gray-900 rounded-lg transition-all duration-200 ${
                  (song as any)._deleting ? 'opacity-50 pointer-events-none bg-red-900' : ''
                }`}>
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
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{song.title}</h3>
                          
                          {/* 全体公開状態トグル */}
                          <button
                            onClick={() => handleToggleVisibility(song)}
                            className={`px-2 py-0.5 text-xs rounded font-medium transition-colors ${
                              song.visible ? 'bg-green-600/30 text-green-300 border border-green-500/50' : 'bg-red-600/30 text-red-300 border border-red-500/50'
                            }`}
                            title="クリックで全体公開/非表示を切り替え"
                          >
                            全体: {song.visible ? '公開' : '非公開'}
                          </button>

                          {/* トップ表示トグル */}
                          <button
                            onClick={() => handleToggleField(song, 'showInTop')}
                            className={`px-2 py-0.5 text-xs rounded font-medium transition-colors ${
                              song.showInTop !== false ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50' : 'bg-gray-800 text-gray-400 border border-gray-700'
                            }`}
                            title="クリックでトップ表示を切り替え"
                          >
                            トップ: {song.showInTop !== false ? '表示' : '非表示'}
                          </button>

                          {/* 実績表示トグル */}
                          <button
                            onClick={() => handleToggleField(song, 'showInPortfolio')}
                            className={`px-2 py-0.5 text-xs rounded font-medium transition-colors ${
                              song.showInPortfolio !== false ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50' : 'bg-gray-800 text-gray-400 border border-gray-700'
                            }`}
                            title="クリックで実績表示を切り替え"
                          >
                            実績: {song.showInPortfolio !== false ? '表示' : '非表示'}
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-gray-400">
                          <div>ID: {song.id}</div>
                          <div>表示順: {song.order}</div>
                          <div>ジャンル: {song.genre}</div>
                          <div>リリース: {song.releaseDate}</div>
                          {song.clientOrProject && <div className="md:col-span-2 lg:col-span-3 text-cyan-400 font-medium">案件・用途: {song.clientOrProject}</div>}
                          {song.description && <div className="md:col-span-2 lg:col-span-3">説明: {song.description}</div>}
                          {song.originalTracks && <div className="md:col-span-2 lg:col-span-3">オリジナル: {song.originalTracks}</div>}
                          {song.audioPath && <div className="md:col-span-2 lg:col-span-3">音声: {song.audioPath}</div>}
                          {song.coverImagePath && <div className="md:col-span-2 lg:col-span-3">画像: {song.coverImagePath}</div>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      {/* 表示順操作ボタン */}
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleReorder(song.id, 'top')}
                          className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-xs rounded transition-colors"
                          title="最上位に移動"
                        >
                          ↑↑
                        </button>
                        <button
                          onClick={() => handleReorder(song.id, 'up')}
                          className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-xs rounded transition-colors"
                          title="上に移動"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => handleReorder(song.id, 'down')}
                          className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-xs rounded transition-colors"
                          title="下に移動"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => handleReorder(song.id, 'bottom')}
                          className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-xs rounded transition-colors"
                          title="最下位に移動"
                        >
                          ↓↓
                        </button>
                      </div>
                      
                      {/* 基本操作ボタン */}
                      <div className="flex gap-2">
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
                          disabled={(song as any)._deleting}
                          className={`px-3 py-1 text-sm rounded transition-colors ${
                            (song as any)._deleting 
                              ? 'bg-gray-600 cursor-not-allowed' 
                              : 'bg-red-600 hover:bg-red-700'
                          }`}
                        >
                          {(song as any)._deleting ? '削除中...' : '削除'}
                        </button>
                      </div>
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