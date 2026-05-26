import { createDb, getGoals } from '@/lib/db'
import { MEMBERS } from '@/types'
import GoalsForm from '@/components/GoalsForm'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function GoalsPage() {
  const db = createDb()
  const goals = getGoals(db)

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← 首页</Link>
          <h1 className="text-xl font-bold text-gray-900">目标设置</h1>
        </div>
        <p className="text-sm text-gray-500 mb-6">在此设置团队目标和各人个人目标，AI 分析时会以此为参照。</p>
        <GoalsForm initialGoals={goals} />
      </div>
    </main>
  )
}
