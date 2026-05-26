import { NextRequest, NextResponse } from 'next/server'
import { createDb, getReviewByMemberAndDate, getIndividualAnalysis, getAnalysis } from '@/lib/db'
import { MEMBERS } from '@/types'
import type { StatusResponse } from '@/types'

export async function GET(request: NextRequest) {
  const db = createDb()
  const date = request.nextUrl.searchParams.get('date') || new Date().toISOString().slice(0, 10)

  const submitted = Object.fromEntries(
    MEMBERS.map((m) => [m, !!getReviewByMemberAndDate(db, m, date)])
  ) as StatusResponse['submitted']

  const individual_ready = Object.fromEntries(
    MEMBERS.map((m) => [m, !!getIndividualAnalysis(db, m, date)])
  ) as StatusResponse['individual_ready']

  const all_submitted = MEMBERS.every((m) => submitted[m])
  const team_summary_ready = !!getAnalysis(db, date)

  const response: StatusResponse = {
    date,
    submitted,
    individual_ready,
    all_submitted,
    team_summary_ready,
  }

  return NextResponse.json(response)
}
