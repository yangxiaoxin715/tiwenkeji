'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { MemberName } from '@/types'

export default function SubmitForm({ member }: { member: MemberName }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (content.trim().length < 20) {
      setError('内容太短，请把语音转文字粘贴进来')
      return
    }
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member, content }),
      })

      if (res.status === 409) { setError('今天已经提交过了'); setLoading(false); return }
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || '提交失败，请重试')
        setLoading(false)
        return
      }

      router.push(`/submit/${encodeURIComponent(member)}/done`)
    } catch {
      setError('网络错误，请重试')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={'把今天的语音转文字粘贴进来…\n\n涵盖六个方面：\n结果 · 卡点 · 亮点 · 案例 · 流程 · 明日目标'}
          className="w-full p-5 text-sm text-slate-700 leading-relaxed placeholder-slate-300 focus:outline-none resize-none min-h-[320px] font-sans"
          disabled={loading}
        />
        <div className="px-5 py-3 border-t border-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-300">
            {content.length > 0 ? `${content.length} 字` : '建议 100 字以上'}
          </span>
          {content.length > 0 && content.trim().length < 20 && (
            <span className="text-xs text-amber-500">内容太短</span>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-2.5">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || content.trim().length === 0}
        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-semibold text-base hover:bg-indigo-700 active:bg-indigo-800 transition-colors disabled:opacity-40 shadow-sm"
      >
        {loading ? '提交中…' : '提交复盘 →'}
      </button>
    </form>
  )
}
