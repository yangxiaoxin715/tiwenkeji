'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MEMBERS } from '@/types'
import type { StatusResponse } from '@/types'

interface WaitingStatusProps {
  initialStatus: StatusResponse
}

export default function WaitingStatus({ initialStatus }: WaitingStatusProps) {
  const [status, setStatus] = useState<StatusResponse>(initialStatus)
  const router = useRouter()

  useEffect(() => {
    if (status.analysis_ready) {
      router.push(`/results/${status.date}`)
      return
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/status?date=${status.date}`)
        if (!res.ok) return
        const data: StatusResponse = await res.json()
        setStatus(data)
        if (data.analysis_ready) {
          clearInterval(interval)
          router.push(`/results/${data.date}`)
        }
      } catch {
        // network error — keep polling
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [status.analysis_ready, status.date, router])

  const submittedCount = MEMBERS.filter((m) => status.submitted[m]).length

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-5xl">
        {status.analysis_ready ? '✅' : status.all_submitted ? '🤖' : '⏳'}
      </div>

      <div className="text-center">
        <p className="text-xl font-bold text-gray-900 mb-1">
          {status.analysis_ready
            ? '分析完成！正在跳转…'
            : status.all_submitted
            ? 'AI 分析中，请稍候…'
            : '已提交，等待其他人…'}
        </p>
        <p className="text-gray-500 text-sm">{submittedCount} / 4 人已提交</p>
      </div>

      <div className="w-full max-w-xs bg-white rounded-2xl p-5 border border-gray-100 space-y-2">
        {MEMBERS.map((m) => (
          <div key={m} className="flex items-center gap-3">
            <span className={status.submitted[m] ? 'text-green-500' : 'text-gray-300'}>
              {status.submitted[m] ? '✅' : '⬜'}
            </span>
            <span className={`text-sm ${status.submitted[m] ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
              {m}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
