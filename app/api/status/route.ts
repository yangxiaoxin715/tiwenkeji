import { NextRequest, NextResponse } from 'next/server'
import { createDb, getReviewByMemberAndDate, getAnalysis } from '@/lib/db'
import { MEMBERS } from '@/types'
import type { StatusResponse } from '@/types'

export async function GET(request: NextRequest) {
  const db = createDb()
  const date = request.nextUrl.searchParams.get('date') || new Date().toISOString().slice(0, 10)

  const submitted = Object.fromEntries(
    MEMBERS.map((m) => [m, !!getReviewByMemberAndDate(db, m, date)])
  ) as StatusResponse['submitted']

  const all_submitted = MEMBERS.every((m) => submitted[m])
  const analysis_ready = !!getAnalysis(db, date)

  const response: StatusResponse = {
    date,
    submitted,
    all_submitted,
    analysis_ready,
  }

  return NextResponse.json(response)
}
