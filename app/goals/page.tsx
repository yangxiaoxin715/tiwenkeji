import { createDb, getGoals } from '@/lib/db'
import GoalsForm from '@/components/GoalsForm'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function GoalsPage() {
  const db = createDb()
  const goals = getGoals(db)

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-br from-indigo-600 to-violet-600 px-6 pt-12 pb-20">
        <Link href="/" className="text-indigo-300 text-sm hover:text-white transition-colors">← 首页</Link>
        <h1 className="text-2xl font-bold text-white tracking-tight mt-2">目标设置</h1>
        <p className="text-indigo-300 text-sm mt-0.5">会议后在此录入，AI 分析时自动参照</p>
      </div>

      <div className="px-4 -mt-10 max-w-xl mx-auto pb-10">
        <GoalsForm initialGoals={goals} />
      </div>
    </div>
  )
}
