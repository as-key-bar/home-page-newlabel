'use client'

import { useState, useEffect } from 'react'
import AuthGuard from '../../../components/AuthGuard'
import AdminNav from '../../../components/AdminNav'
import ReorderButtons from '../../../components/admin/ReorderButtons'
import { useAuth } from '../../../contexts/AuthContext'
import { DesignWork } from '../../../lib/firestore'
import { ReorderAction, uploadFileToStorage } from '../../../lib/admin-utils'

export default function DesignAdminPage() {
  const { authFetch } = useAuth()
  const [designs, setDesigns] = useState<DesignWork[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingDesign, setEditingDesign] = useState<DesignWork | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    imagePath: '',
    description: '',
    visible: 'true'
  })

  // デザイン一覧を取得
  const fetchDesigns = async () => {
    try {
      setLoading(true)
      try {
        const res = await fetch('/api/designs')
        if (res.ok) {
          const data = await res.json()
          if (data && Array.isArray(data.designs) && data.designs.length > 0) {
            setDesigns(data.designs)
            setLoading(false)
            return
          }
        }
      } catch (apiErr) {
        console.warn('API fetchDesigns failed, falling back to direct Firestore:', apiErr)
      }

      const { getDesigns } = await import('../../../lib/firestore')
      const directDesigns = await getDesigns()
      if (directDesigns.length > 0) {
        setDesigns(directDesigns)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'デザイン一覧の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDesigns()
  }, [])

  const resetForm = () => {
    setFormData({
      title: '',
      imagePath: '',
      description: '',
      visible: 'true'
    })
    setEditingDesign(null)
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

  // 画像アップロード処理
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    clearMessages()
    setUploadingImage(true)

    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('画像ファイル（PNG, JPEG, WebP等）を選択してください')
      }

      const downloadURL = await uploadFileToStorage({
        file,
        folder: 'images/designs',
        maxSizeBytes: 10 * 1024 * 1024
      })

      setFormData(prev => ({ ...prev, imagePath: downloadURL }))
      setSuccessMessage('画像が正常にアップロードされました')
    } catch (err) {
      console.error('Image upload error:', err)
      setError(err instanceof Error ? err.message : '画像のアップロードに失敗しました')
    } finally {
      setUploadingImage(false)
    }
  }

  // 新規追加
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMessages()

    const payload = {
      title: formData.title.trim(),
      imagePath: formData.imagePath.trim(),
      description: formData.description.trim(),
      visible: formData.visible === 'true'
    }

    try {
      const res = await authFetch('/api/designs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'デザインの追加に失敗しました')
      }

      setSuccessMessage('デザイン実績を追加しました')
      resetForm()
      fetchDesigns()
    } catch (err) {
      console.warn('API addDesign failed, trying direct Firestore client SDK:', err)
      try {
        const { addDesignClient } = await import('../../../lib/firestore')
        await addDesignClient(payload)
        setSuccessMessage('デザイン実績を追加しました')
        resetForm()
        fetchDesigns()
      } catch (clientErr) {
        console.error('Direct Firestore addDesignClient also failed:', clientErr)
        setError(err instanceof Error ? err.message : 'デザインの追加に失敗しました')
      }
    }
  }

  // 編集開始
  const startEdit = (design: DesignWork) => {
    setFormData({
      title: design.title,
      imagePath: design.imagePath,
      description: design.description,
      visible: design.visible ? 'true' : 'false'
    })
    setEditingDesign(design)
    setShowAddForm(true)
  }

  // 更新
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingDesign) return
    clearMessages()

    const updates = {
      title: formData.title.trim(),
      imagePath: formData.imagePath.trim(),
      description: formData.description.trim(),
      visible: formData.visible === 'true'
    }

    try {
      const res = await authFetch('/api/designs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingDesign.id,
          ...updates
        })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'デザインの更新に失敗しました')
      }

      setSuccessMessage('デザイン実績を更新しました')
      resetForm()
      fetchDesigns()
    } catch (err) {
      console.warn('API updateDesign failed, trying direct Firestore client SDK:', err)
      try {
        const { updateDesignClient } = await import('../../../lib/firestore')
        await updateDesignClient(editingDesign.id, updates)
        setSuccessMessage('デザイン実績を更新しました')
        resetForm()
        fetchDesigns()
      } catch (clientErr) {
        console.error('Direct Firestore updateDesignClient also failed:', clientErr)
        setError(err instanceof Error ? err.message : 'デザインの更新に失敗しました')
      }
    }
  }

  // 削除
  const handleDelete = async (id: string) => {
    if (!confirm('このデザイン実績を削除してもよろしいですか？')) return
    clearMessages()

    try {
      const res = await authFetch(`/api/designs?id=${id}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'デザインの削除に失敗しました')
      }

      setDesigns(prev => prev.filter(d => d.id !== id))
      setSuccessMessage('デザイン実績を削除しました')
    } catch (err) {
      console.warn('API deleteDesign failed, trying direct Firestore client SDK:', err)
      try {
        const { deleteDesignClient } = await import('../../../lib/firestore')
        await deleteDesignClient(id)
        setDesigns(prev => prev.filter(d => d.id !== id))
        setSuccessMessage('デザイン実績を削除しました')
      } catch (clientErr) {
        console.error('Direct Firestore deleteDesignClient also failed:', clientErr)
        setError(err instanceof Error ? err.message : 'デザインの削除に失敗しました')
      }
    }
  }

  // 公開トグル
  const handleToggleVisibility = async (design: DesignWork) => {
    clearMessages()
    try {
      const res = await authFetch('/api/designs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: design.id,
          visible: !design.visible
        })
      })

      if (!res.ok) throw new Error('表示状態の更新に失敗しました')
      fetchDesigns()
    } catch (err) {
      console.warn('API toggleDesignVisibility failed, trying direct Firestore client SDK:', err)
      try {
        const { updateDesignClient } = await import('../../../lib/firestore')
        await updateDesignClient(design.id, { visible: !design.visible })
        fetchDesigns()
      } catch (clientErr) {
        console.error('Direct Firestore toggleDesignVisibility also failed:', clientErr)
        setError(err instanceof Error ? err.message : '表示状態の更新に失敗しました')
      }
    }
  }

  // 表示順変更
  const handleReorder = async (id: string, action: ReorderAction) => {
    clearMessages()
    try {
      const res = await authFetch('/api/designs/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action })
      })

      if (!res.ok) throw new Error('表示順の変更に失敗しました')
      fetchDesigns()
    } catch (err) {
      console.warn('API reorderDesign failed, trying direct Firestore client SDK:', err)
      try {
        const { reorderDesignByActionClient } = await import('../../../lib/firestore')
        await reorderDesignByActionClient(id, action)
        fetchDesigns()
      } catch (clientErr) {
        console.error('Direct Firestore reorderDesign also failed:', clientErr)
        setError(err instanceof Error ? err.message : '表示順の変更に失敗しました')
      }
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-black text-white p-6 sm:p-8">
        <div className="max-w-5xl mx-auto">
          <AdminNav />

          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">デザイン実績管理（/admin/design）</h1>
              <p className="text-xs text-gray-400 mt-1">
                制作実績（/work）ページの「デザイン実績」タブに掲載するグラフィックやロゴ画像を登録・編集します。
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
                ＋ 新規デザイン追加
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
                {editingDesign ? 'デザイン実績の編集' : '新規デザイン実績の追加'}
              </h2>

              <form onSubmit={editingDesign ? handleUpdate : handleAdd} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">タイトル <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    placeholder="例: CDジャケット・告知フライヤー"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">画像 <span className="text-red-400">*</span></label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      name="imagePath"
                      value={formData.imagePath}
                      onChange={handleInputChange}
                      required
                      placeholder="Firebase Storage URLまたは画像URL /images/..."
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500"
                    />

                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="hidden"
                        id="design-image-upload"
                      />
                      <label
                        htmlFor="design-image-upload"
                        className={`px-3 py-1.5 text-xs rounded cursor-pointer transition-colors ${
                          uploadingImage
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {uploadingImage ? 'アップロード中...' : '画像をアップロード'}
                      </label>
                      <span className="text-xs text-gray-400">または直接URLを入力</span>
                    </div>

                    {formData.imagePath && (
                      <div className="mt-3 p-3 bg-gray-800/60 rounded border border-gray-700 flex items-center gap-4">
                        <img
                          src={formData.imagePath}
                          alt="プレビュー"
                          className="h-24 w-auto max-w-[200px] object-contain rounded bg-black/40 border border-gray-600"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                          }}
                        />
                        <span className="text-xs text-gray-400 truncate flex-1 font-mono">
                          {formData.imagePath}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">実績説明 <span className="text-red-400">*</span></label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={2}
                    placeholder="例: 同人CDアルバムジャケットおよびロゴマークのデザインを担当"
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
                    {editingDesign ? '更新を保存' : '追加する'}
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

          {/* デザイン一覧 */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold">登録済みデザイン一覧 ({designs.length}件)</h2>

            {loading ? (
              <div className="text-gray-400 text-center py-8">読み込み中...</div>
            ) : designs.length === 0 ? (
              <div className="text-gray-400 text-center py-10 bg-gray-900 rounded-lg border border-dashed border-gray-800">
                デザイン実績がまだ登録されていません。「＋ 新規デザイン追加」から登録してください。
              </div>
            ) : (
              <div className="grid gap-4">
                {designs.map((design) => (
                  <div
                    key={design.id}
                    className="p-4 bg-gray-900 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
                      {/* 画像サムネイル */}
                      <div className="w-full sm:w-40 h-28 rounded-md overflow-hidden bg-black/60 flex items-center justify-center flex-shrink-0 border border-gray-700">
                        {design.imagePath ? (
                          <img
                            src={design.imagePath}
                            alt={design.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                            }}
                          />
                        ) : (
                          <span className="text-xs text-gray-500">NO IMAGE</span>
                        )}
                      </div>

                      {/* メタ情報 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="text-base font-semibold text-white">{design.title}</h3>
                          <button
                            onClick={() => handleToggleVisibility(design)}
                            className={`px-2 py-0.5 text-xs rounded font-medium transition-colors ${
                              design.visible
                                ? 'bg-green-600/30 text-green-300 border border-green-500/50'
                                : 'bg-red-600/30 text-red-300 border border-red-500/50'
                            }`}
                          >
                            {design.visible ? '公開中' : '非公開'}
                          </button>
                          <span className="text-xs text-gray-500 font-mono">
                            表示順: {design.order}
                          </span>
                        </div>

                        <div className="text-sm text-emerald-400 font-medium mb-1">
                          {design.description}
                        </div>

                        <div className="text-xs text-gray-400 truncate font-mono">
                          {design.imagePath}
                        </div>
                      </div>

                      {/* 操作ボタン */}
                      <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto justify-end sm:justify-start">
                        {/* 並び順 */}
                        <ReorderButtons id={design.id} onReorder={handleReorder} />

                        {/* 編集・削除 */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(design)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-xs rounded transition-colors flex-1"
                          >
                            編集
                          </button>
                          <button
                            onClick={() => handleDelete(design.id)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-xs rounded transition-colors flex-1"
                          >
                            削除
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

