import Link from 'next/link'
import type { MemberName } from '@/types'

const THEME: Record<MemberName, { gradient: string; badge: string; badgeText: string }> = {
  '点妈':    { gradient: 'from-violet-500 to-indigo-600', badge: 'bg-violet-100 text-violet-700', badgeText: 'bg-violet-100 text-violet-700' },
  '花小蜜':  { gradient: 'from-pink-400 to-rose-500',    badge: 'bg-pink-100 text-pink-700',    badgeText: 'bg-pink-100 text-pink-700'    },
  '蜜蜜':   { gradient: 'from-amber-400 to-orange-400',  badge: 'bg-amber-100 text-amber-700',  badgeText: 'bg-amber-100 text-amber-700'  },
  '点妈客服': { gradient: 'from-teal-400 to-cyan-500',    badge: 'bg-teal-100 text-teal-700',    badgeText: 'bg-teal-100 text-teal-700'    },
}

const EMOJI: Record<MemberName, string> = {
  '点妈': '👩', '花小蜜': '🌸', '蜜蜜': '🍯', '点妈客服': '💬',
}

interface MemberCardProps {
  member: MemberName
  submitted: boolean
  individualReady: boolean
  date: string
}

export default function MemberCard({ member, submitted, individualReady, date }: MemberCardProps) {
  const theme = THEME[member]
  const href = individualReady ? `/results/${date}` : `/submit/${encodeURIComponent(member)}`

  return (
    <Link href={href}>
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-0.5 transition-all">
        <div className={`h-1.5 bg-gradient-to-r ${theme.gradient}`} />
        <div className="p-4 flex flex-col items-center gap-2.5">
          <span className="text-3xl">{EMOJI[member]}</span>
          <span className="font-semibold text-slate-800 text-base">{member}</span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            individualReady
              ? 'bg-indigo-100 text-indigo-600'
              : submitted
              ? 'bg-emerald-100 text-emerald-600'
              : 'bg-slate-100 text-slate-400'
          }`}>
            {individualReady ? '📊 查看反馈' : submitted ? '✅ 已提交' : '待提交'}
          </span>
        </div>
      </div>
    </Link>
  )
}
