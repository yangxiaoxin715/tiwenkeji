import type { MemberName, IndividualFeedback } from '@/types'

const HEADER_GRADIENT: Record<MemberName, string> = {
  '点妈':    'from-violet-500 to-indigo-600',
  '花小蜜':  'from-pink-400 to-rose-500',
  '蜜蜜':   'from-amber-400 to-orange-400',
  '点妈客服': 'from-teal-400 to-cyan-500',
}

interface FeedbackCardProps {
  member: MemberName
  feedback: IndividualFeedback
}

export default function FeedbackCard({ member, feedback }: FeedbackCardProps) {
  const items = [
    {
      label: 'Q1 结果',
      value: `${feedback.q1?.type || '—'} · ${feedback.q1?.completed ? '✅ 完成' : '❌ 未完成'}${feedback.q1?.reason ? ' · ' + feedback.q1.reason : ''}`,
    },
    {
      label: 'Q2 卡点',
      value: `${feedback.q2?.type || '—'}${feedback.q2?.recurring ? ' · 会重复出现' : ''}${feedback.q2?.library ? ' · 归入：' + feedback.q2.library : ''}`,
    },
    {
      label: 'Q3 亮点',
      value: `${feedback.q3?.action || '—'}${feedback.q3?.why ? ' — ' + feedback.q3.why : ''}`,
    },
    {
      label: 'Q4 案例',
      value: feedback.q4?.content || '无',
    },
    {
      label: 'Q5 流程',
      value: `${feedback.q5?.action || '—'}${feedback.q5?.times ? ' · ' + feedback.q5.times + '次' : ''}${feedback.q5?.minutes ? ' · ' + feedback.q5.minutes + '分钟/次' : ''}`,
    },
    {
      label: 'Q6 目标',
      value: `${feedback.q6?.action || '—'}${feedback.q6?.new_asset ? ' → 新增资产：' + feedback.q6.new_asset : ''}`,
    },
  ]

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
      {/* Gradient header */}
      <div className={`bg-gradient-to-r ${HEADER_GRADIENT[member]} px-5 py-4`}>
        <h3 className="font-bold text-white text-lg tracking-tight">{member}</h3>
      </div>

      <div className="p-5 space-y-4">
        {/* Q items */}
        <div className="space-y-3">
          {items.map(({ label, value }) => (
            <div key={label} className="flex gap-3">
              <span className="shrink-0 text-xs font-bold text-slate-400 w-14 pt-0.5">{label}</span>
              <p className="text-sm text-slate-700 leading-relaxed">{value}</p>
            </div>
          ))}
        </div>

        {/* Role analysis */}
        {feedback.role_analysis && (
          <div className="bg-amber-50 rounded-xl border border-amber-100 p-4">
            <p className="text-xs font-semibold text-amber-600 mb-1.5 uppercase tracking-wide">角色专属分析</p>
            <p className="text-sm text-slate-700 leading-relaxed">{feedback.role_analysis}</p>
          </div>
        )}

        {/* Team instruction (点妈 only) */}
        {feedback.team_instruction && (
          <div className="bg-violet-50 rounded-xl border border-violet-100 p-4">
            <p className="text-xs font-semibold text-violet-600 mb-1.5 uppercase tracking-wide">团队明日指令</p>
            <p className="text-sm text-slate-700 leading-relaxed">{feedback.team_instruction}</p>
          </div>
        )}

        {/* Daily asset */}
        {feedback.daily_asset?.content && (
          <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-base">📦</span>
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                今日资产 · {feedback.daily_asset.library}
              </p>
            </div>
            <p className="text-sm font-medium text-slate-800">{feedback.daily_asset.content}</p>
            {feedback.daily_asset.use_for && (
              <p className="text-xs text-slate-500 mt-1">可用于：{feedback.daily_asset.use_for}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
