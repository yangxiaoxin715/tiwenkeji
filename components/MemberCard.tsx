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
}

export default function MemberCard({ member, submitted }: MemberCardProps) {
  return (
    <Link href={`/submit/${encodeURIComponent(member)}`}>
      <div
        className={`
          flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2
          cursor-pointer transition-all hover:scale-105 hover:shadow-lg
          ${submitted
            ? 'border-green-400 bg-green-50'
            : 'border-gray-200 bg-white hover:border-indigo-400'
          }
        `}
      >
        <span className="text-4xl">{MEMBER_EMOJI[member]}</span>
        <span className="font-semibold text-gray-800 text-lg">{member}</span>
        <span className={`text-sm font-medium ${submitted ? 'text-green-600' : 'text-gray-400'}`}>
          {submitted ? '✅ 已提交' : '待提交'}
        </span>
      </div>
    </Link>
  )
}
