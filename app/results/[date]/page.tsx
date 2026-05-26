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
      m,
      JSON.parse(individualRows[m]!.result) as IndividualFeedback,
    ])
  )
  const teamSummary = teamRow ? (JSON.parse(teamRow.result) as TeamSummary) : null

  const activeTab = searchParams.tab === 'team' ? 'team' : 'individual'

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← 首页</Link>
          <h1 className="text-xl font-bold text-gray-900">复盘分析 · {date}</h1>
        </div>

        <div className="flex gap-2 mb-6">
          <Link
            href={`/results/${date}?tab=individual`}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === 'individual'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300'
            }`}
          >
            个人反馈
          </Link>
          <Link
            href={`/results/${date}?tab=team`}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === 'team'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300'
            }`}
          >
            团队汇总
          </Link>
        </div>

        {activeTab === 'individual' ? (
          <div className="space-y-5">
            {MEMBERS.map((member) =>
              individual[member] ? (
                <FeedbackCard key={member} member={member} feedback={individual[member]} />
              ) : (
                <div key={member} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="px-0 py-0 mb-2">
                    <h3 className="font-bold text-gray-400 text-lg">{member}</h3>
                  </div>
                  <p className="text-sm text-gray-400">尚未提交或分析中…</p>
                </div>
              )
            )}
          </div>
        ) : teamSummary ? (
          <TeamSummaryComponent summary={teamSummary} />
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <p className="text-4xl mb-4">⏳</p>
            <p className="font-semibold text-gray-700 mb-1">等待全员提交后生成</p>
            <p className="text-sm text-gray-400">
              {MEMBERS.filter((m) => individualRows[m]).length} / 4 人已提交
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
