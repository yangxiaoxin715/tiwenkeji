import { NextRequest, NextResponse } from 'next/server'
import { createDb, getGoals, saveGoals } from '@/lib/db'
import type { Goals } from '@/types'

export async function GET() {
  const db = createDb()
  const goals = getGoals(db)
  return NextResponse.json(goals)
}

export async function POST(request: NextRequest) {
  const db = createDb()
  try {
    const body = await request.json() as Goals
    if (typeof body.team_goal !== 'string' || typeof body.individual_goals !== 'object') {
      return NextResponse.json({ error: '格式错误' }, { status: 400 })
    }
    saveGoals(db, body)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Goals save error:', error)
    return NextResponse.json({ error: '保存失败' }, { status: 500 })
  }
}
