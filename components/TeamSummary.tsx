import type { TeamSummary as TeamSummaryType } from '@/types'

interface TeamSummaryProps {
  summary: TeamSummaryType
}

export default function TeamSummary({ summary }: TeamSummaryProps) {
  const items = [
    { icon: '🚧', label: '今日瓶颈', value: summary.bottleneck },
    { icon: '⭐', label: '最佳实践广播', value: summary.best_practice },
    { icon: '🔧', label: '优先修复的流程漏洞', value: summary.process_fix },
    { icon: '🎯', label: '目标对齐度', value: summary.alignment },
  ]

  return (
    <div className="space-y-4">
      {items.map(({ icon, label, value }) => (
        <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100">
          <p className="text-sm font-semibold text-gray-500 mb-2">{icon} {label}</p>
          <p className="text-gray-800 leading-relaxed">{value}</p>
        </div>
      ))}
    </div>
  )
}
