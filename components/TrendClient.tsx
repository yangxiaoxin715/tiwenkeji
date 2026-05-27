'use client'

import { useState } from 'react'
import type { TrendAnalysis } from '@/types'

const PRESETS = [
  { label: '最近 3 天', days: 3 },
  { label: '最近 5 天', days: 5 },
  { label: '最近 7 天', days: 7 },
]

interface TrendClientProps {
  dates: string[]  // available dates, newest first
}

export default function TrendClient({ dates }: TrendClientProps) {
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TrendAnalysis | null>(null)
  const [error, setError] = useState('')

  if (dates.length < 2) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
        <p className="text-4xl mb-4">📅</p>
        <p className="font-semibold text-gray-700 mb-1">数据还不够</p>
        <p className="text-sm text-gray-400">至少需要 2 天的复盘数据才能做趋势分析</p>
      </div>
    )
  }

  async function handleAnalyze(preset: number) {
    setSelectedPreset(preset)
    setLoading(true)
    setResult(null)
    setError('')

    const selected = dates.slice(0, preset).reverse()  // oldest first

    try {
      const res = await fetch('/api/trend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dates: selected }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || '分析失败'); setLoading(false); return }

      const { key, ready } = data
      if (ready) {
        // Cached result — fetch it
        const r = await fetch(`/api/trend?key=${key}`)
        const d = await r.json()
        setResult(d.result)
        setLoading(false)
        return
      }

      // Poll until ready
      const interval = setInterval(async () => {
        try {
          const r = await fetch(`/api/trend?key=${key}`)
          const d = await r.json()
          if (d.ready) {
            clearInterval(interval)
            setResult(d.result)
            setLoading(false)
          }
        } catch { /* keep polling */ }
      }, 4000)
    } catch {
      setError('网络错误，请重试')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Date preset buttons */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <p className="text-sm font-semibold text-gray-700 mb-3">选择分析周期</p>
        <div className="flex gap-3 flex-wrap">
          {PRESETS.filter((p) => p.days <= dates.length).map((p) => (
            <button
              key={p.days}
              onClick={() => handleAnalyze(p.days)}
              disabled={loading}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${
                selectedPreset === p.days && loading
                  ? 'bg-indigo-600 text-white'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {dates.length > 0 && (
          <p className="text-xs text-gray-400 mt-3">
            可分析数据：{dates[dates.length - 1]} ~ {dates[0]}（共 {dates.length} 天）
          </p>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <div className="flex justify-center gap-2 mb-4">
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="font-semibold text-gray-700">AI 正在分析趋势…</p>
          <p className="text-sm text-gray-400 mt-1">通常需要 30~60 秒</p>
        </div>
      )}

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}

      {/* Results */}
      {result && <TrendResult result={result} />}
    </div>
  )
}

function TrendResult({ result }: { result: TrendAnalysis }) {
  const members = ['点妈', '花小蜜', '蜜蜜', '点妈客服'] as const

  return (
    <div className="space-y-5">
      {/* Team trends */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="font-bold text-gray-900 mb-4">团队趋势 · {result.period}</h2>
        <div className="space-y-3">
          {[
            { label: '🚧 反复出现的卡点', value: result.team_trends.recurring_bottleneck },
            { label: '📦 实际沉淀的资产', value: result.team_trends.asset_summary },
            { label: '🎯 目标对齐趋势', value: result.team_trends.goal_alignment_trend },
            { label: '🚀 下周优先解决', value: result.team_trends.top_recommendation },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs font-semibold text-gray-400 mb-1">{label}</p>
              <p className="text-sm text-gray-700 leading-relaxed">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Individual trends */}
      {members.map((member) => {
        const t = result.individual_trends[member]
        if (!t) return null
        return (
          <div key={member} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 bg-indigo-50 border-b border-indigo-100">
              <h3 className="font-bold text-gray-900">{member}</h3>
            </div>
            <div className="p-5 space-y-3">
              {[
                { label: '🔁 卡点规律', value: t.bottleneck_pattern },
                { label: '✅ 目标完成情况', value: t.goal_completion_rate },
                { label: '📦 资产沉淀', value: t.asset_accumulation },
                { label: '📈 成长观察', value: t.growth_observation },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs font-semibold text-gray-400 mb-1">{label}</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
