'use client'

import { useState } from 'react'
import type { TrendAnalysis } from '@/types'

const PRESETS = [
  { label: '最近 3 天', days: 3 },
  { label: '最近 5 天', days: 5 },
  { label: '最近 7 天', days: 7 },
]

const TEAM_ITEMS = [
  { key: 'recurring_bottleneck' as const, label: '反复出现的卡点', icon: '🚧', accent: 'border-l-red-400' },
  { key: 'asset_summary' as const, label: '实际沉淀的资产', icon: '📦', accent: 'border-l-emerald-400' },
  { key: 'goal_alignment_trend' as const, label: '目标对齐趋势', icon: '🎯', accent: 'border-l-blue-400' },
  { key: 'top_recommendation' as const, label: '下周优先解决', icon: '🚀', accent: 'border-l-violet-400' },
]

const INDIVIDUAL_ITEMS = [
  { key: 'bottleneck_pattern' as const, label: '卡点规律', icon: '🔁' },
  { key: 'goal_completion_rate' as const, label: '目标完成情况', icon: '✅' },
  { key: 'asset_accumulation' as const, label: '资产沉淀', icon: '📦' },
  { key: 'growth_observation' as const, label: '成长观察', icon: '📈' },
]

const MEMBER_GRADIENT = {
  '点妈': 'from-violet-500 to-indigo-600',
  '花小蜜': 'from-pink-400 to-rose-500',
  '蜜蜜': 'from-amber-400 to-orange-400',
  '点妈客服': 'from-teal-400 to-cyan-500',
} as const

export default function TrendClient({ dates }: { dates: string[] }) {
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TrendAnalysis | null>(null)
  const [error, setError] = useState('')

  if (dates.length < 2) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
        <p className="text-5xl mb-4">📅</p>
        <p className="font-semibold text-slate-700 mb-1">数据还不够</p>
        <p className="text-sm text-slate-400">至少需要 2 天的复盘数据才能做趋势分析</p>
      </div>
    )
  }

  async function handleAnalyze(preset: number) {
    setSelectedPreset(preset)
    setLoading(true)
    setResult(null)
    setError('')

    const selected = dates.slice(0, preset).reverse()

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
        const r = await fetch(`/api/trend?key=${key}`)
        const d = await r.json()
        setResult(d.result); setLoading(false); return
      }

      const interval = setInterval(async () => {
        try {
          const r = await fetch(`/api/trend?key=${key}`)
          const d = await r.json()
          if (d.ready) { clearInterval(interval); setResult(d.result); setLoading(false) }
        } catch { /* keep polling */ }
      }, 4000)
    } catch {
      setError('网络错误，请重试')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Preset selector */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">选择分析周期</p>
        <div className="flex gap-2 flex-wrap">
          {PRESETS.filter((p) => p.days <= dates.length).map((p) => (
            <button
              key={p.days}
              onClick={() => handleAnalyze(p.days)}
              disabled={loading}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${
                selectedPreset === p.days && loading
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-300 mt-3">
          可用数据：{dates[dates.length - 1]} ~ {dates[0]}（{dates.length} 天）
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
          <div className="flex justify-center gap-2 mb-5">
            <span className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="font-semibold text-slate-700">AI 正在分析趋势…</p>
          <p className="text-sm text-slate-400 mt-1">通常需要 30~60 秒</p>
        </div>
      )}

      {error && <p className="text-red-500 text-sm text-center bg-red-50 rounded-xl py-3">{error}</p>}

      {result && <TrendResult result={result} />}
    </div>
  )
}

function TrendResult({ result }: { result: TrendAnalysis }) {
  const members = ['点妈', '花小蜜', '蜜蜜', '点妈客服'] as const

  return (
    <div className="space-y-4">
      {/* Team summary */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <h2 className="font-bold text-slate-900 mb-4">团队趋势 · <span className="text-indigo-600">{result.period}</span></h2>
        <div className="space-y-3">
          {TEAM_ITEMS.map(({ key, label, icon, accent }) => (
            <div key={key} className={`border-l-4 ${accent} pl-4`}>
              <p className="text-xs font-semibold text-slate-400 mb-1">{icon} {label}</p>
              <p className="text-sm text-slate-700 leading-relaxed">{result.team_trends[key]}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Individual trends */}
      {members.map((member) => {
        const t = result.individual_trends[member]
        if (!t) return null
        return (
          <div key={member} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className={`bg-gradient-to-r ${MEMBER_GRADIENT[member]} px-5 py-3`}>
              <h3 className="font-bold text-white">{member}</h3>
            </div>
            <div className="p-5 space-y-3">
              {INDIVIDUAL_ITEMS.map(({ key, label, icon }) => (
                <div key={key}>
                  <p className="text-xs font-semibold text-slate-400 mb-1">{icon} {label}</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{t[key]}</p>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
