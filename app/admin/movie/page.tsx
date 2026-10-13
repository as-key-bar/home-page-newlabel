'use client'

import { useState, useEffect } from 'react'
import AuthGuard from '../../../components/AuthGuard'
import AdminNav from '../../../components/AdminNav'
import { useAuth } from '../../../contexts/AuthContext'
import { MovieWork } from '../../../lib/firestore'
import { getYoutubeEmbedUrl } from '../../../lib/youtube'

export default function MovieAdminPage() {
  const { user } = useAuth()
  const [movies, setMovies] = useState<MovieWork[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingMovie, setEditingMovie] = useState<MovieWork | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    youtubeUrl: '',
    description: '',
    visible: 'true'
  })

  // 管理API用: Firebase IDトークンを Authorization ヘッダーに付与
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

  // 動画一覧を取得
  const fetchMovies = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/movies')
      if (!res.ok) throw new Error('動画一覧の取得に失敗しました')
      const data = await res.json()
      setMovies(data.movies || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : '動画一覧の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMovies()
  }, [])

  const resetForm = () => {
    setFormData({
      title: '',
      youtubeUrl: '',
      description: '',
      visible: 'true'
    })
    setEditingMovie(null)
    setShowAddForm(false)
  }

  const clearMessages = () => {
    setError('')
    setSuccessMessage('')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // 新規追加
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMessages()

    try {
      const res = await authFetch('/api/movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          youtubeUrl: formData.youtubeUrl.trim(),
          description: formData.description.trim(),
          visible: formData.visible === 'true'
        })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || '動画の追加に失敗しました')
      }

      setSuccessMessage('動画実績を追加しました')
      resetForm()
      fetchMovies()
    } catch (err) {
      setError(err instanceof Error ? err.message : '動画の追加に失敗しました')
    }
  }

  // 編集開始
  const startEdit = (movie: MovieWork) => {
    setFormData({
      title: movie.title,
      youtubeUrl: movie.youtubeUrl,
      description: movie.description,
      visible: movie.visible ? 'true' : 'false'
    })
    setEditingMovie(movie)
    setShowAddForm(true)
  }

  // 更新
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMovie) return
    clearMessages()

    try {
      const res = await authFetch('/api/movies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingMovie.id,
          title: formData.title.trim(),
          youtubeUrl: formData.youtubeUrl.trim(),
          description: formData.description.trim(),
          visible: formData.visible === 'true'
        })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || '動画の更新に失敗しました')
      }

      setSuccessMessage('動画実績を更新しました')
      resetForm()
      fetchMovies()
    } catch (err) {
      setError(err instanceof Error ? err.message : '動画の更新に失敗しました')
    }
  }

  // 削除
  const handleDelete = async (id: string) => {
    if (!confirm('この動画実績を削除してもよろしいですか？')) return
    clearMessages()

    try {
      const res = await authFetch(`/api/movies?id=${id}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || '動画の削除に失敗しました')
      }

      setMovies(prev => prev.filter(m => m.id !== id))
      setSuccessMessage('動画実績を削除しました')
    } catch (err) {
      setError(err instanceof Error ? err.message : '動画の削除に失敗しました')
    }
  }

  // 公開トグル
  const handleToggleVisibility = async (movie: MovieWork) => {
    clearMessages()
    try {
      const res = await authFetch('/api/movies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: movie.id,
          visible: !movie.visible
        })
      })

      if (!res.ok) throw new Error('表示状態の更新に失敗しました')
      fetchMovies()
    } catch (err) {
      setError(err instanceof Error ? err.message : '表示状態の更新に失敗しました')
    }
  }

  // 表示順変更
  const handleReorder = async (id: string, action: 'up' | 'down' | 'top' | 'bottom') => {
    clearMessages()
    try {
      const res = await authFetch('/api/movies/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action })
      })

      if (!res.ok) throw new Error('表示順の変更に失敗しました')
      fetchMovies()
    } catch (err) {
      setError(err instanceof Error ? err.message : '表示順の変更に失敗しました')
    }
  }

  const previewEmbedUrl = getYoutubeEmbedUrl(formData.youtubeUrl)

  return (
    <AuthGuard>
      <div className="min-h-screen bg-black text-white p-6 sm:p-8">
        <div className="max-w-5xl mx-auto">
          <AdminNav />

          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">動画実績管理（/admin/movie）</h1>
              <p className="text-xs text-gray-400 mt-1">
                制作実績（/work）ページの「動画実績」タブに掲載する YouTube 動画を登録・編集します。
              </p>
            </div>
            {!showAddForm && (
              <button
                onClick={() => {
                  resetForm()
                  setShowAddForm(true)
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                ＋ 新規動画追加
              </button>
            )}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900/80 border border-red-700 text-red-200 rounded-lg text-sm">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 bg-green-900/80 border border-green-700 text-green-200 rounded-lg text-sm">
              {successMessage}
            </div>
          )}

          {/* 追加/編集フォーム */}
          {showAddForm && (
            <div className="mb-8 p-6 bg-gray-900 rounded-lg border border-gray-800">
              <h2 className="text-lg font-bold mb-4">
                {editingMovie ? '動画実績の編集' : '新規動画実績の追加'}
              </h2>

              <form onSubmit={editingMovie ? handleUpdate : handleAdd} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">タイトル <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    placeholder="例: 幽閉フラクタル 告知MV"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">YouTube URL または 動画ID <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    name="youtubeUrl"
                    value={formData.youtubeUrl}
                    onChange={handleInputChange}
                    required
                    placeholder="例: https://www.youtube.com/watch?v=XXXXXX または https://youtu.be/XXXXXX"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-xs text-gray-400 mt-0.5 block">
                    ※ 通常の動画URL、共有リンク（youtu.be）、Shorts動画URLなどに対応しています。
                  </span>

                  {/* 埋め込みプレビュー */}
                  {previewEmbedUrl && (
                    <div className="mt-3 p-3 bg-gray-800/60 rounded border border-gray-700">
                      <span className="text-xs text-green-400 block mb-2 font-medium">
                        ✓ 埋め込みプレビュー:
                      </span>
                      <div className="aspect-video w-full max-w-md rounded overflow-hidden bg-black">
                        <iframe
                          src={previewEmbedUrl}
                          title="YouTube Preview"
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">実績説明 <span className="text-red-400">*</span></label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={2}
                    placeholder="例: サークル「幽閉フラクタル」様のご依頼で製作"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={formData.visible === 'true'}
                      onChange={(e) => setFormData(prev => ({ ...prev, visible: e.target.checked ? 'true' : 'false' }))}
                      className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-300">公開する（チェックを外すと非公開）</span>
                  </label>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {editingMovie ? '更新を保存' : '追加する'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
                  >
                    キャンセル
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 動画一覧 */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold">登録済み動画一覧 ({movies.length}件)</h2>

            {loading ? (
              <div className="text-gray-400 text-center py-8">読み込み中...</div>
            ) : movies.length === 0 ? (
              <div className="text-gray-400 text-center py-10 bg-gray-900 rounded-lg border border-dashed border-gray-800">
                動画実績がまだ登録されていません。「＋ 新規動画追加」から登録してください。
              </div>
            ) : (
              <div className="grid gap-4">
                {movies.map((movie) => {
                  const embedUrl = getYoutubeEmbedUrl(movie.youtubeUrl)

                  return (
                    <div
                      key={movie.id}
                      className="p-4 bg-gray-900 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
                        {/* プレビュー動画 */}
                        <div className="w-full sm:w-64 aspect-video rounded-md overflow-hidden bg-black flex-shrink-0 border border-gray-700">
                          {embedUrl ? (
                            <iframe
                              src={embedUrl}
                              title={movie.title}
                              className="w-full h-full border-0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                              無効なURL
                            </div>
                          )}
                        </div>

                        {/* メタ情報 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="text-base font-semibold text-white">{movie.title}</h3>
                            <button
                              onClick={() => handleToggleVisibility(movie)}
                              className={`px-2 py-0.5 text-xs rounded font-medium transition-colors ${
                                movie.visible
                                  ? 'bg-green-600/30 text-green-300 border border-green-500/50'
                                  : 'bg-red-600/30 text-red-300 border border-red-500/50'
                              }`}
                            >
                              {movie.visible ? '公開中' : '非公開'}
                            </button>
                            <span className="text-xs text-gray-500 font-mono">
                              表示順: {movie.order}
                            </span>
                          </div>

                          <div className="text-sm text-emerald-400 font-medium mb-1">
                            {movie.description}
                          </div>

                          <a
                            href={movie.youtubeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-gray-400 hover:text-blue-400 truncate block underline font-mono"
                          >
                            {movie.youtubeUrl}
                          </a>
                        </div>

                        {/* 操作ボタン */}
                        <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto justify-end sm:justify-start">
                          {/* 並び順 */}
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleReorder(movie.id, 'top')}
                              className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-xs rounded transition-colors"
                              title="最上位へ"
                            >
                              ↑↑
                            </button>
                            <button
                              onClick={() => handleReorder(movie.id, 'up')}
                              className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-xs rounded transition-colors"
                              title="1つ上へ"
                            >
                              ↑
                            </button>
                            <button
                              onClick={() => handleReorder(movie.id, 'down')}
                              className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-xs rounded transition-colors"
                              title="1つ下へ"
                            >
                              ↓
                            </button>
                            <button
                              onClick={() => handleReorder(movie.id, 'bottom')}
                              className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-xs rounded transition-colors"
                              title="最下位へ"
                            >
                              ↓↓
                            </button>
                          </div>

                          {/* 編集・削除 */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEdit(movie)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-xs rounded transition-colors flex-1"
                            >
                              編集
                            </button>
                            <button
                              onClick={() => handleDelete(movie.id)}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-xs rounded transition-colors flex-1"
                            >
                              削除
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}

