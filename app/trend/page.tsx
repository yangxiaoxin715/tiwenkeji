import { createDb, getAvailableDates } from '@/lib/db'
import TrendClient from '@/components/TrendClient'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function TrendPage() {
  const db = createDb()
  const dates = getAvailableDates(db)

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-br from-indigo-600 to-violet-600 px-6 pt-12 pb-20">
        <Link href="/" className="text-indigo-300 text-sm hover:text-white transition-colors">← 首页</Link>
        <h1 className="text-2xl font-bold text-white tracking-tight mt-2">趋势复盘</h1>
        <p className="text-indigo-300 text-sm mt-0.5">多天数据纵向分析</p>
      </div>

      <div className="px-4 -mt-10 max-w-2xl mx-auto pb-10">
        <TrendClient dates={dates} />
      </div>
    </div>
  )
}
