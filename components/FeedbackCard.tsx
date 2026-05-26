import type { MemberName, IndividualFeedback } from '@/types'

interface FeedbackCardProps {
  member: MemberName
  feedback: IndividualFeedback
}

export default function FeedbackCard({ member, feedback }: FeedbackCardProps) {
  const q = [
    {
      label: '🎯 Q1 结果',
      value: `${feedback.q1?.type || '—'} · ${feedback.q1?.completed ? '✅ 完成' : '❌ 未完成'}${feedback.q1?.reason ? ' · ' + feedback.q1.reason : ''}`,
    },
    {
      label: '🚧 Q2 卡点',
      value: `${feedback.q2?.type || '—'}${feedback.q2?.recurring ? ' · 会重复出现' : ''}${feedback.q2?.library ? ' · 归入：' + feedback.q2.library : ''}`,
    },
    {
      label: '✨ Q3 亮点',
      value: `${feedback.q3?.action || '—'}${feedback.q3?.why ? '——' + feedback.q3.why : ''}`,
    },
    {
      label: '📝 Q4 案例',
      value: feedback.q4?.content || '无',
    },
    {
      label: '🔄 Q5 流程',
      value: `${feedback.q5?.action || '—'}${feedback.q5?.times ? ' · ' + feedback.q5.times + '次' : ''}${feedback.q5?.minutes ? ' · ' + feedback.q5.minutes + '分钟/次' : ''}`,
    },
    {
      label: '🚀 Q6 目标',
      value: `${feedback.q6?.action || '—'}${feedback.q6?.new_asset ? ' → 新增资产：' + feedback.q6.new_asset : ''}`,
    },
  ]

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 bg-indigo-50 border-b border-indigo-100">
        <h3 className="font-bold text-gray-900 text-lg">{member}</h3>
      </div>

      <div className="p-5 space-y-3">
        {q.map(({ label, value }) => (
          <div key={label}>
            <p className="text-xs font-semibold text-gray-400 mb-1">{label}</p>
            <p className="text-sm text-gray-700 leading-relaxed">{value}</p>
          </div>
        ))}

        {feedback.role_analysis && (
          <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
            <p className="text-xs font-semibold text-amber-600 mb-1">角色专属分析</p>
            <p className="text-sm text-gray-700 leading-relaxed">{feedback.role_analysis}</p>
          </div>
        )}

        {feedback.team_instruction && (
          <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
            <p className="text-xs font-semibold text-purple-600 mb-1">团队明日指令</p>
            <p className="text-sm text-gray-700 leading-relaxed">{feedback.team_instruction}</p>
          </div>
        )}

        {feedback.daily_asset?.content && (
          <div className="p-4 bg-green-50 rounded-xl border border-green-200">
            <p className="text-xs font-semibold text-green-600 mb-1">
              📦 今日资产 · {feedback.daily_asset.library}
            </p>
            <p className="text-sm font-medium text-gray-800">{feedback.daily_asset.content}</p>
            {feedback.daily_asset.use_for && (
              <p className="text-xs text-gray-500 mt-1">可用于：{feedback.daily_asset.use_for}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
