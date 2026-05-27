export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import {
  createDb,
  getAvailableDates,
  getReviewsForDates,
  getGoals,
  saveTrendAnalysis,
  getTrendAnalysis,
} from '@/lib/db'
import { analyzeTrend } from '@/lib/ai'

// GET /api/trend — list available dates
// GET /api/trend?key=2026-05-21~2026-05-27 — get analysis result
export async function GET(request: NextRequest) {
  const db = createDb()
  const key = request.nextUrl.searchParams.get('key')

  if (key) {
    const row = getTrendAnalysis(db, key)
    if (!row) return NextResponse.json({ pending: true })
    return NextResponse.json({ ready: true, result: JSON.parse(row.result) })
  }

  const dates = getAvailableDates(db)
  return NextResponse.json({ dates })
}

// POST /api/trend — trigger analysis for selected dates
export async function POST(request: NextRequest) {
  const db = createDb()
  const { dates } = await request.json() as { dates: string[] }

  if (!Array.isArray(dates) || dates.length < 2) {
    return NextResponse.json({ error: '至少选择2天' }, { status: 400 })
  }

  const sorted = [...dates].sort()
  const period = `${sorted[0]}~${sorted[sorted.length - 1]}`

  // Return cached result if exists
  const existing = getTrendAnalysis(db, period)
  if (existing) {
    return NextResponse.json({ key: period, ready: true })
  }

  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey || apiKey === 'your_key_here') {
    return NextResponse.json({ error: 'API key 未配置' }, { status: 500 })
  }

  const reviews = getReviewsForDates(db, sorted)
  const goals = getGoals(db)

  // Async — return key immediately, client polls
  analyzeTrend(sorted, reviews, goals, apiKey)
    .then((result) => {
      const db2 = createDb()
      saveTrendAnalysis(db2, period, result)
    })
    .catch(console.error)

  return NextResponse.json({ key: period, ready: false })
}
