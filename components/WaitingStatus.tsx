'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { MemberName, StatusResponse } from '@/types'

const MEMBER_GRADIENT: Record<MemberName, string> = {
  '点妈':    'from-violet-500 to-indigo-600',
  '花小蜜':  'from-pink-400 to-rose-500',
  '蜜蜜':   'from-amber-400 to-orange-400',
  '点妈客服': 'from-teal-400 to-cyan-500',
}

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
      } catch { /* keep polling */ }
    }, 3000)

    return () => clearInterval(interval)
  }, [status.individual_ready, member, status.date, router])

  const ready = status.individual_ready[member]
  const gradient = MEMBER_GRADIENT[member]

  return (
    <div className="flex flex-col items-center gap-6 text-center max-w-xs">
      {/* Animated circle */}
      <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg ${ready ? '' : 'animate-pulse'}`}>
        <span className="text-4xl">{ready ? '✅' : '🤖'}</span>
      </div>

      <div>
        <p className="text-xl font-bold text-slate-800 mb-1">
          {ready ? '分析完成！' : 'AI 正在生成反馈…'}
        </p>
        <p className="text-sm text-slate-400">
          {ready ? '正在跳转…' : '通常需要 10~30 秒，请稍候'}
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
