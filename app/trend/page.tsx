import { createDb, getAvailableDates } from '@/lib/db'
import TrendClient from '@/components/TrendClient'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function TrendPage() {
  const db = createDb()
  const dates = getAvailableDates(db)

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← 首页</Link>
          <h1 className="text-xl font-bold text-gray-900">趋势复盘</h1>
        </div>
        <TrendClient dates={dates} />
      </div>
    </main>
  )
}
