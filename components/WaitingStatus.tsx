'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { MemberName, StatusResponse } from '@/types'

interface WaitingStatusProps {
  member: MemberName
  initialStatus: StatusResponse
}

export default function WaitingStatus({ member, initialStatus }: WaitingStatusProps) {
  const [status, setStatus] = useState<StatusResponse>(initialStatus)
  const router = useRouter()

  useEffect(() => {
    if (status.individual_ready[member]) {
      router.push(`/results/${status.date}`)
      return
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/status?date=${status.date}`)
        if (!res.ok) return
        const data: StatusResponse = await res.json()
        setStatus(data)
        if (data.individual_ready[member]) {
          clearInterval(interval)
          router.push(`/results/${data.date}`)
        }
      } catch {
        // network error — keep polling
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [status.individual_ready, member, status.date, router])

  const ready = status.individual_ready[member]

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-5xl">
        {ready ? '✅' : '🤖'}
      </div>

      <div className="text-center">
        <p className="text-xl font-bold text-gray-900 mb-1">
          {ready ? '分析完成！正在跳转…' : 'AI 正在生成你的个人反馈…'}
        </p>
        <p className="text-gray-500 text-sm">
          {ready ? '' : '通常需要 10~30 秒，请稍候'}
        </p>
      </div>

      {!ready && (
        <div className="flex gap-2">
          <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      )}
    </div>
  )
}
