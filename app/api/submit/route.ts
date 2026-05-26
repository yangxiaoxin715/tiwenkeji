export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import {
  createDb,
  insertReview,
  getSubmittedCountForDate,
  getReviewsForDate,
  getGoals,
  saveIndividualAnalysis,
  saveAnalysis,
  saveAssets,
} from '@/lib/db'
import { analyzeIndividual, analyzeTeam } from '@/lib/ai'
import { MEMBERS } from '@/types'
import type { MemberName } from '@/types'

export async function POST(request: NextRequest) {
  const db = createDb()
  try {
    const body = await request.json()
    const { member, content } = body as { member: MemberName; content: string }

    if (!MEMBERS.includes(member)) {
      return NextResponse.json({ error: '无效的成员名称' }, { status: 400 })
    }
    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: '复盘内容不能为空' }, { status: 400 })
    }

    const today = new Date().toISOString().slice(0, 10)

    try {
      insertReview(db, member, today, content.trim())
    } catch {
      return NextResponse.json({ error: '今天已经提交过了' }, { status: 409 })
    }

    const count = getSubmittedCountForDate(db, today)
    const apiKey = process.env.DEEPSEEK_API_KEY

    if (apiKey && apiKey !== 'your_key_here') {
      const goals = getGoals(db)

      // Immediately trigger individual analysis for this member
      analyzeIndividual(today, member, content.trim(), goals, apiKey)
        .then((feedback) => {
          const db2 = createDb()
          saveIndividualAnalysis(db2, member, today, feedback)
          if (feedback.daily_asset?.content) {
            saveAssets(db2, today, [{ member, asset: feedback.daily_asset }])
          }
        })
        .catch(console.error)

      // When all 4 submitted, trigger team summary
      if (count === MEMBERS.length) {
        const reviews = getReviewsForDate(db, today)
        analyzeTeam(today, reviews, goals, apiKey)
          .then((summary) => {
            const db2 = createDb()
            saveAnalysis(db2, today, summary)
          })
          .catch(console.error)
      }
    }

    return NextResponse.json({ ok: true, submitted_count: count })
  } catch (error) {
    console.error('Submit error:', error)
    return NextResponse.json({ error: '提交失败，请重试' }, { status: 500 })
  }
}
