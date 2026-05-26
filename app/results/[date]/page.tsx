import { notFound } from 'next/navigation'
import { createDb, getAnalysis } from '@/lib/db'
import { MEMBERS } from '@/types'
import type { AnalysisResult } from '@/types'
import FeedbackCard from '@/components/FeedbackCard'
import TeamSummaryComponent from '@/components/TeamSummary'
import Link from 'next/link'

interface Props {
  params: { date: string }
  searchParams: { tab?: string }
}

export default function ResultsPage({ params, searchParams }: Props) {
  const { date } = params
  const db = createDb()
  const row = getAnalysis(db, date)
  if (!row) notFound()

  const result: AnalysisResult = JSON.parse(row.result)
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
              result.individual[member] ? (
                <FeedbackCard key={member} member={member} feedback={result.individual[member]} />
              ) : null
            )}
          </div>
        ) : (
          <TeamSummaryComponent summary={result.team} />
        )}
      </div>
    </main>
  )
}
