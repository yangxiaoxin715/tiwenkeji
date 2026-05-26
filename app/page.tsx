import { createDb, getReviewByMemberAndDate, getAnalysis } from '@/lib/db'
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
  const submittedCount = Object.values(submitted).filter(Boolean).length
  const analysisReady = !!getAnalysis(db, today)

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-1">每日复盘</h1>
        <p className="text-center text-gray-500 text-sm mb-8">{today}</p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {MEMBERS.map((member) => (
            <MemberCard key={member} member={member} submitted={!!submitted[member]} />
          ))}
        </div>

        <p className="text-center text-gray-500 text-sm mb-4">
          {submittedCount} / 4 人已提交
          {submittedCount === 4 && !analysisReady && ' · AI 分析中…'}
        </p>

        {analysisReady && (
          <Link
            href={`/results/${today}`}
            className="block w-full text-center bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
          >
            查看今日分析结果 →
          </Link>
        )}
      </div>
    </main>
  )
}
