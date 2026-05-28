import { createDb, getReviewByMemberAndDate, getIndividualAnalysis, getAnalysis, getGoals } from '@/lib/db'
import { MEMBERS } from '@/types'
import MemberCard from '@/components/MemberCard'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function HomePage() {
  const db = createDb()
  const today = new Date().toISOString().slice(0, 10)
  const goals = getGoals(db)

  const submitted = Object.fromEntries(
    MEMBERS.map((m) => [m, !!getReviewByMemberAndDate(db, m, today)])
  )
  const individualReady = Object.fromEntries(
    MEMBERS.map((m) => [m, !!getIndividualAnalysis(db, m, today)])
  )
  const submittedCount = Object.values(submitted).filter(Boolean).length
  const teamSummaryReady = !!getAnalysis(db, today)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Gradient header */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 px-6 pt-12 pb-20">
        <p className="text-indigo-300 text-sm mb-1 font-medium">{today}</p>
        <h1 className="text-3xl font-bold text-white tracking-tight">每日复盘</h1>
      </div>

      {/* Content — overlaps header with -mt */}
      <div className="px-4 -mt-10 max-w-md mx-auto space-y-3 pb-10">

        {/* Goals card */}
        <Link href="/goals" className="block bg-white rounded-2xl shadow-sm p-4 border border-slate-100 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">🎯 团队目标</p>
              <p className="text-sm text-slate-700 leading-relaxed line-clamp-2">
                {goals.team_goal || '点击设置团队目标…'}
              </p>
            </div>
            <span className="text-slate-300 shrink-0 mt-0.5 text-lg">✏️</span>
          </div>
        </Link>

        {/* Progress */}
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-100">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">今日进度</p>
            <p className="text-sm font-bold text-slate-700">{submittedCount} / 4</p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-indigo-500 to-violet-500 h-2 rounded-full transition-all duration-700"
              style={{ width: `${(submittedCount / 4) * 100}%` }}
            />
          </div>
          {submittedCount === MEMBERS.length && !teamSummaryReady && (
            <p className="text-xs text-indigo-500 mt-2 font-medium animate-pulse">⚡ AI 生成团队汇总中…</p>
          )}
        </div>

        {/* Member grid */}
        <div className="grid grid-cols-2 gap-3">
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

        {/* Team summary */}
        {teamSummaryReady && (
          <Link
            href={`/results/${today}?tab=team`}
            className="flex items-center justify-between w-full bg-indigo-600 text-white px-5 py-4 rounded-2xl font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <span>查看今日团队汇总</span>
            <span className="text-indigo-300">→</span>
          </Link>
        )}

        {/* Trend entry */}
        <Link
          href="/trend"
          className="flex items-center justify-between w-full bg-white border border-slate-200 px-5 py-4 rounded-2xl text-sm font-medium text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors shadow-sm"
        >
          <span>📈 趋势复盘（多天分析）</span>
          <span className="text-slate-300">→</span>
        </Link>
      </div>
    </div>
  )
}
