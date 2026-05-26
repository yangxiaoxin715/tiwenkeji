import { NextRequest, NextResponse } from 'next/server'
import { createDb, getAnalysis } from '@/lib/db'
import type { AnalysisResult } from '@/types'

export async function GET(request: NextRequest) {
  const db = createDb()
  const date = request.nextUrl.searchParams.get('date') || new Date().toISOString().slice(0, 10)
  const row = getAnalysis(db, date)

  if (!row) {
    return NextResponse.json({ error: '该日期暂无分析结果' }, { status: 404 })
  }

  const result: AnalysisResult = JSON.parse(row.result)
  return NextResponse.json(result)
}
