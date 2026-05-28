import { notFound } from 'next/navigation'
import { createDb, getReviewByMemberAndDate } from '@/lib/db'
import { MEMBERS } from '@/types'
import type { MemberName } from '@/types'
import SubmitForm from '@/components/SubmitForm'
import QuestionGuide from '@/components/QuestionGuide'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const HEADER_GRADIENT: Record<MemberName, string> = {
  '点妈':    'from-violet-500 to-indigo-600',
  '花小蜜':  'from-pink-400 to-rose-500',
  '蜜蜜':   'from-amber-400 to-orange-400',
  '点妈客服': 'from-teal-400 to-cyan-500',
}

interface Props {
  params: { member: string }
}

export default function SubmitPage({ params }: Props) {
  const member = decodeURIComponent(params.member) as MemberName
  if (!MEMBERS.includes(member)) notFound()

  const db = createDb()
  const today = new Date().toISOString().slice(0, 10)
  const existing = getReviewByMemberAndDate(db, member, today)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className={`bg-gradient-to-br ${HEADER_GRADIENT[member]} px-6 pt-12 pb-20`}>
        <Link href="/" className="text-white/60 text-sm hover:text-white transition-colors">← 返回</Link>
        <h1 className="text-2xl font-bold text-white tracking-tight mt-2">{member}</h1>
        <p className="text-white/70 text-sm mt-0.5">{today} · 今日复盘</p>
      </div>

      <div className="px-4 -mt-10 max-w-4xl mx-auto pb-10">
        {existing ? (
          <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-emerald-500 text-lg">✅</span>
              <p className="text-emerald-700 font-semibold">今天已提交</p>
            </div>
            <pre className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed font-sans">{existing.content}</pre>
          </div>
        ) : (
          <div className="flex flex-col-reverse gap-4 md:flex-row md:gap-6">
            <div className="flex-1">
              <SubmitForm member={member} />
            </div>
            <div className="md:w-72 md:shrink-0 bg-white rounded-2xl shadow-sm border border-slate-100 p-5 md:self-start">
              <QuestionGuide />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
