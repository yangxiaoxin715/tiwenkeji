import { notFound } from 'next/navigation'
import { createDb, getReviewByMemberAndDate, getIndividualAnalysis, getAnalysis } from '@/lib/db'
import { MEMBERS } from '@/types'
import type { MemberName, StatusResponse } from '@/types'
import WaitingStatus from '@/components/WaitingStatus'

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

export default function DonePage({ params }: Props) {
  const member = decodeURIComponent(params.member) as MemberName
  if (!MEMBERS.includes(member)) notFound()

  const db = createDb()
  const today = new Date().toISOString().slice(0, 10)

  const submitted = Object.fromEntries(
    MEMBERS.map((m) => [m, !!getReviewByMemberAndDate(db, m, today)])
  ) as StatusResponse['submitted']

  const individual_ready = Object.fromEntries(
    MEMBERS.map((m) => [m, !!getIndividualAnalysis(db, m, today)])
  ) as StatusResponse['individual_ready']

  const initialStatus: StatusResponse = {
    date: today,
    submitted,
    individual_ready,
    all_submitted: MEMBERS.every((m) => submitted[m]),
    team_summary_ready: !!getAnalysis(db, today),
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${HEADER_GRADIENT[member]} flex items-center justify-center p-6`}>
      <WaitingStatus member={member} initialStatus={initialStatus} />
    </div>
  )
}
