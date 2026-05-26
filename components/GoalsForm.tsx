'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MEMBERS } from '@/types'
import type { Goals, MemberName } from '@/types'

interface GoalsFormProps {
  initialGoals: Goals
}

export default function GoalsForm({ initialGoals }: GoalsFormProps) {
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
      if (res.ok) {
        setSaved(true)
        router.refresh()
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <label className="block text-sm font-semibold text-gray-700 mb-2">🎯 团队目标</label>
        <textarea
          value={teamGoal}
          onChange={(e) => setTeamGoal(e.target.value)}
          placeholder="输入团队共同目标，例如：本月引流150人，完成2个交付项目"
          rows={3}
          className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <p className="text-sm font-semibold text-gray-700">👤 个人目标分解</p>
        {MEMBERS.map((member) => (
          <div key={member}>
            <label className="block text-xs font-medium text-gray-500 mb-1">{member}</label>
            <input
              type="text"
              value={individualGoals[member] || ''}
              onChange={(e) =>
                setIndividualGoals((prev) => ({ ...prev, [member]: e.target.value }))
              }
              placeholder={`${member} 的个人目标`}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
      >
        {saving ? '保存中…' : saved ? '✅ 已保存' : '保存目标'}
      </button>
    </div>
  )
}
