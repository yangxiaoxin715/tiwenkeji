'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MEMBERS } from '@/types'
import type { Goals, MemberName } from '@/types'

const MEMBER_COLOR: Record<MemberName, string> = {
  '点妈':    'text-violet-600',
  '花小蜜':  'text-pink-600',
  '蜜蜜':   'text-amber-600',
  '点妈客服': 'text-teal-600',
}

export default function GoalsForm({ initialGoals }: { initialGoals: Goals }) {
  const [teamGoal, setTeamGoal] = useState(initialGoals.team_goal)
  const [individualGoals, setIndividualGoals] = useState<Partial<Record<MemberName, string>>>(
    initialGoals.individual_goals
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const router = useRouter()

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_goal: teamGoal, individual_goals: individualGoals }),
      })
      if (res.ok) { setSaved(true); router.refresh() }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Team goal */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          🎯 团队共同目标
        </label>
        <textarea
          value={teamGoal}
          onChange={(e) => setTeamGoal(e.target.value)}
          placeholder="例如：本月引流150人，完成985导航和拖拉磨蹭2个交付项目"
          rows={3}
          className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none leading-relaxed"
        />
      </div>

      {/* Individual goals */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">👤 个人目标分解</p>
        {MEMBERS.map((member) => (
          <div key={member}>
            <label className={`block text-xs font-semibold mb-1.5 ${MEMBER_COLOR[member]}`}>
              {member}
            </label>
            <input
              type="text"
              value={individualGoals[member] || ''}
              onChange={(e) => setIndividualGoals((prev) => ({ ...prev, [member]: e.target.value }))}
              placeholder={`${member} 的个人目标`}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full py-4 rounded-2xl font-semibold text-base transition-colors shadow-sm disabled:opacity-50 ${
          saved
            ? 'bg-emerald-500 text-white'
            : 'bg-indigo-600 text-white hover:bg-indigo-700'
        }`}
      >
        {saving ? '保存中…' : saved ? '✅ 已保存' : '保存目标'}
      </button>
    </div>
  )
}
