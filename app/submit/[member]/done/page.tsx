import { notFound } from 'next/navigation'
import { createDb, getReviewByMemberAndDate, getAnalysis } from '@/lib/db'
import { MEMBERS } from '@/types'
import type { MemberName, StatusResponse } from '@/types'
import WaitingStatus from '@/components/WaitingStatus'

export const dynamic = 'force-dynamic'

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

  const all_submitted = MEMBERS.every((m) => submitted[m])
  const analysis_ready = !!getAnalysis(db, today)

  const initialStatus: StatusResponse = {
    date: today,
    submitted,
    all_submitted,
    analysis_ready,
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <WaitingStatus initialStatus={initialStatus} />
    </main>
  )
}
