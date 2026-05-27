import { createDb, getReviewByMemberAndDate, getIndividualAnalysis, getAnalysis } from '@/lib/db'
import { MEMBERS } from '@/types'
import MemberCard from '@/components/MemberCard'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function HomePage() {
  const db = createDb()
  const today = new Date().toISOString().slice(0, 10)

  const submitted = Object.fromEntries(
    MEMBERS.map((m) => [m, !!getReviewByMemberAndDate(db, m, today)])
  )
  const individualReady = Object.fromEntries(
    MEMBERS.map((m) => [m, !!getIndividualAnalysis(db, m, today)])
  )
  const submittedCount = Object.values(submitted).filter(Boolean).length
  const teamSummaryReady = !!getAnalysis(db, today)

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">每日复盘</h1>
        <p className="text-gray-500 text-sm mb-6">{today}</p>

        <Link
          href="/goals"
          className="flex items-center justify-between w-full bg-white border-2 border-indigo-200 rounded-2xl px-5 py-4 mb-6 hover:border-indigo-400 transition-colors"
        >
          <div>
            <p className="text-sm font-bold text-indigo-700">🎯 团队目标设置</p>
            <p className="text-xs text-gray-400 mt-0.5">点击查看或修改目标</p>
          </div>
          <span className="text-indigo-400 text-lg">→</span>
        </Link>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {MEMBERS.map((member) => (
            <MemberCard
              key={member}
              member={member}
              submitted={!!submitted[member]}
              individualReady={!!individualReady[member]}
              date={today}
            />
          ))}
        </div>

        <p className="text-center text-gray-500 text-sm mb-4">
          {submittedCount} / 4 人已提交
          {submittedCount === MEMBERS.length && !teamSummaryReady && ' · 团队汇总生成中…'}
        </p>

        {teamSummaryReady && (
          <Link
            href={`/results/${today}?tab=team`}
            className="block w-full text-center bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
          >
            查看团队汇总 →
          </Link>
        )}
      </div>
    </main>
  )
}
