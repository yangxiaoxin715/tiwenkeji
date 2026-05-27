import { notFound } from 'next/navigation'
import { createDb, getReviewByMemberAndDate } from '@/lib/db'
import { MEMBERS } from '@/types'
import type { MemberName } from '@/types'
import SubmitForm from '@/components/SubmitForm'
import QuestionGuide from '@/components/QuestionGuide'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

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
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← 返回</Link>
          <h1 className="text-xl font-bold text-gray-900">{member} · {today}</h1>
        </div>

        {existing ? (
          <div className="bg-white rounded-2xl p-6 border-2 border-green-200">
            <p className="text-green-600 font-semibold mb-3">✅ 今天已提交</p>
            <pre className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{existing.content}</pre>
          </div>
        ) : (
          <div className="flex flex-col-reverse gap-5 md:flex-row md:gap-6">
            <div className="flex-1">
              <SubmitForm member={member} />
            </div>
            <div className="md:w-72 md:shrink-0 bg-white rounded-2xl p-5 border border-gray-100 md:self-start">
              <QuestionGuide />
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
