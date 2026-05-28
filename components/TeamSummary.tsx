import type { TeamSummary as TeamSummaryType } from '@/types'

const ITEMS = [
  { icon: '🚧', label: '今日瓶颈', key: 'bottleneck' as const, accent: 'border-l-red-400' },
  { icon: '⭐', label: '最佳实践广播', key: 'best_practice' as const, accent: 'border-l-amber-400' },
  { icon: '🔧', label: '优先修复的流程漏洞', key: 'process_fix' as const, accent: 'border-l-blue-400' },
  { icon: '🎯', label: '目标对齐度', key: 'alignment' as const, accent: 'border-l-emerald-400' },
]

export default function TeamSummary({ summary }: { summary: TeamSummaryType }) {
  return (
    <div className="space-y-3">
      {ITEMS.map(({ icon, label, key, accent }) => (
        <div key={key} className={`bg-white rounded-2xl shadow-sm border border-slate-100 border-l-4 ${accent} p-5`}>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            {icon} {label}
          </p>
          <p className="text-sm text-slate-700 leading-relaxed">{summary[key]}</p>
        </div>
      ))}
    </div>
  )
}
