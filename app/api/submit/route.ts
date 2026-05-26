import { NextRequest, NextResponse } from 'next/server'
import { createDb, insertReview, getSubmittedCountForDate, getReviewsForDate, saveAnalysis, saveAssets } from '@/lib/db'
import { buildPrompt, callDeepSeek } from '@/lib/ai'
import { MEMBERS } from '@/types'
import type { MemberName, AnalysisResult } from '@/types'
import type Database from 'better-sqlite3'

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

    if (count === 4) {
      triggerAnalysis(db, today).catch(console.error)
    }

    return NextResponse.json({ ok: true, submitted_count: count })
  } catch (error) {
    console.error('Submit error:', error)
    return NextResponse.json({ error: '提交失败，请重试' }, { status: 500 })
  }
}

async function triggerAnalysis(db: Database.Database, date: string): Promise<void> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey || apiKey === 'your_key_here') {
    console.error('DEEPSEEK_API_KEY not configured')
    return
  }

  const reviews = getReviewsForDate(db, date)
  const { systemPrompt, userPrompt } = buildPrompt(date, reviews)
  const result: AnalysisResult = await callDeepSeek(systemPrompt, userPrompt, apiKey)

  saveAnalysis(db, date, result)

  const assets = MEMBERS.filter((m) => result.individual[m]?.daily_asset?.content).map((m) => ({
    member: m,
    asset: result.individual[m].daily_asset,
  }))
  saveAssets(db, date, assets)
}
