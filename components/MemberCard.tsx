import Link from 'next/link'
import type { MemberName } from '@/types'

const MEMBER_EMOJI: Record<MemberName, string> = {
  '点妈': '👩',
  '花小蜜': '🌸',
  '蜜蜜': '🍯',
  '点妈客服': '💬',
}

interface MemberCardProps {
  member: MemberName
  submitted: boolean
  individualReady: boolean
  date: string
}

export default function MemberCard({ member, submitted, individualReady, date }: MemberCardProps) {
  const card = (
    <div
      className={`
        flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2
        cursor-pointer transition-all hover:scale-105 hover:shadow-lg
        ${individualReady
          ? 'border-indigo-400 bg-indigo-50'
          : submitted
          ? 'border-green-400 bg-green-50'
          : 'border-gray-200 bg-white hover:border-indigo-400'
        }
      `}
    >
      <span className="text-4xl">{MEMBER_EMOJI[member]}</span>
      <span className="font-semibold text-gray-800 text-lg">{member}</span>
      <span className={`text-sm font-medium ${
        individualReady ? 'text-indigo-600' : submitted ? 'text-green-600' : 'text-gray-400'
      }`}>
        {individualReady ? '📊 查看反馈' : submitted ? '✅ 已提交' : '待提交'}
      </span>
    </div>
  )

  if (individualReady) {
    return (
      <Link href={`/results/${date}`}>
        {card}
      </Link>
    )
  }

  return (
    <Link href={`/submit/${encodeURIComponent(member)}`}>
      {card}
    </Link>
  )
}
