import { notFound } from 'next/navigation'
import { createDb, getIndividualAnalysis, getAnalysis } from '@/lib/db'
import { MEMBERS } from '@/types'
import type { IndividualFeedback, TeamSummary } from '@/types'
import FeedbackCard from '@/components/FeedbackCard'
import TeamSummaryComponent from '@/components/TeamSummary'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface Props {
  params: { date: string }
  searchParams: { tab?: string }
}

export default function ResultsPage({ params, searchParams }: Props) {
  const { date } = params
  const db = createDb()

  const individualRows = Object.fromEntries(
    MEMBERS.map((m) => [m, getIndividualAnalysis(db, m, date)])
  )
  const teamRow = getAnalysis(db, date)

  const hasAny = MEMBERS.some((m) => individualRows[m]) || teamRow
  if (!hasAny) notFound()

  const individual = Object.fromEntries(
    MEMBERS.filter((m) => individualRows[m]).map((m) => [
      m, JSON.parse(individualRows[m]!.result) as IndividualFeedback,
    ])
  )
  const teamSummary = teamRow ? (JSON.parse(teamRow.result) as TeamSummary) : null
  const activeTab = searchParams.tab === 'team' ? 'team' : 'individual'
  const submittedCount = MEMBERS.filter((m) => individualRows[m]).length

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-600 px-6 pt-12 pb-20">
        <Link href="/" className="text-indigo-300 text-sm hover:text-white transition-colors">← 首页</Link>
        <h1 className="text-2xl font-bold text-white tracking-tight mt-2">复盘分析</h1>
        <p className="text-indigo-300 text-sm mt-0.5">{date}</p>
      </div>

      <div className="px-4 -mt-10 max-w-2xl mx-auto pb-10 space-y-4">
        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-1.5 flex gap-1">
          <Link
            href={`/results/${date}?tab=individual`}
            className={`flex-1 text-center py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === 'individual'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            个人反馈
          </Link>
          <Link
            href={`/results/${date}?tab=team`}
            className={`flex-1 text-center py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === 'team'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            团队汇总
          </Link>
        </div>

        {activeTab === 'individual' ? (
          <div className="space-y-4">
            {MEMBERS.map((member) =>
              individual[member] ? (
                <FeedbackCard key={member} member={member} feedback={individual[member]} />
              ) : (
                <div key={member} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                  <p className="text-slate-400 font-semibold mb-0.5">{member}</p>
                  <p className="text-sm text-slate-300">尚未提交或分析中…</p>
                </div>
              )
            )}
          </div>
        ) : teamSummary ? (
          <TeamSummaryComponent summary={teamSummary} />
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 text-center">
            <p className="text-4xl mb-3">⏳</p>
            <p className="font-semibold text-slate-700 mb-1">等待全员提交后生成</p>
            <p className="text-sm text-slate-400">{submittedCount} / 4 人已提交</p>
          </div>
        )}
      </div>
    </div>
  )
}
