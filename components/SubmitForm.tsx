'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { MemberName } from '@/types'

interface SubmitFormProps {
  member: MemberName
}

export default function SubmitForm({ member }: SubmitFormProps) {
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

      if (res.status === 409) {
        setError('今天已经提交过了')
        setLoading(false)
        return
      }
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 h-full">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={'把今天的语音转文字粘贴进来……\n\n覆盖六个问题：结果、卡点、亮点、案例、流程、明日目标'}
        className="flex-1 w-full p-4 border-2 border-gray-200 rounded-xl resize-none text-sm leading-relaxed focus:border-indigo-400 focus:outline-none min-h-[300px]"
        disabled={loading}
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading || content.trim().length === 0}
        className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold disabled:opacity-50 hover:bg-indigo-700 transition-colors"
      >
        {loading ? '提交中…' : '提交复盘 →'}
      </button>
    </form>
  )
}
