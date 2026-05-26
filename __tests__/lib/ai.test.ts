import { buildIndividualPrompt, buildTeamPrompt, analyzeIndividual, analyzeTeam } from '@/lib/ai'
import type { ReviewRow, Goals, IndividualFeedback, TeamSummary } from '@/types'

const mockGoals: Goals = {
  team_goal: '本月引流150人，完成2个交付项目',
  individual_goals: {
    '点妈': '完成985导航SOP',
    '花小蜜': '转化5个499用户',
    '蜜蜜': '引流50人',
    '点妈客服': '整理10本日记',
  },
}

const mockReviews: ReviewRow[] = [
  { id: 1, member: '点妈', date: '2026-05-26', content: '今天目标是梳理团队指标...', submitted_at: '' },
  { id: 2, member: '花小蜜', date: '2026-05-26', content: '今天招募了1个499元的...', submitted_at: '' },
  { id: 3, member: '蜜蜜', date: '2026-05-26', content: '今天目标是引流5人...', submitted_at: '' },
  { id: 4, member: '点妈客服', date: '2026-05-26', content: '今天整理了一本日记...', submitted_at: '' },
]

describe('buildIndividualPrompt', () => {
  it('includes the member name and date', () => {
    const { systemPrompt, userPrompt } = buildIndividualPrompt('2026-05-26', '点妈', '今天目标是梳理团队指标...', mockGoals)
    expect(systemPrompt).toContain('点妈')
    expect(userPrompt).toContain('2026-05-26')
  })

  it('includes the review content', () => {
    const { userPrompt } = buildIndividualPrompt('2026-05-26', '蜜蜜', '今天目标是引流5人', mockGoals)
    expect(userPrompt).toContain('今天目标是引流5人')
  })

  it('includes team goal and individual goal', () => {
    const { userPrompt } = buildIndividualPrompt('2026-05-26', '花小蜜', '内容', mockGoals)
    expect(userPrompt).toContain('本月引流150人')
    expect(userPrompt).toContain('转化5个499用户')
  })

  it('returns a non-empty systemPrompt', () => {
    const { systemPrompt } = buildIndividualPrompt('2026-05-26', '点妈', '内容', mockGoals)
    expect(systemPrompt.length).toBeGreaterThan(100)
  })
})

describe('buildTeamPrompt', () => {
  it('includes all 4 member reviews', () => {
    const { userPrompt } = buildTeamPrompt('2026-05-26', mockReviews, mockGoals)
    expect(userPrompt).toContain('【点妈】')
    expect(userPrompt).toContain('【花小蜜】')
    expect(userPrompt).toContain('【蜜蜜】')
    expect(userPrompt).toContain('【点妈客服】')
  })

  it('includes team goal in the prompt', () => {
    const { userPrompt } = buildTeamPrompt('2026-05-26', mockReviews, mockGoals)
    expect(userPrompt).toContain('本月引流150人')
  })
})

const mockIndividualFeedback: IndividualFeedback = {
  q1: { type: '产品SOP', completed: false, reason: '目标没想清楚' },
  q2: { type: '缺标准', recurring: true, library: '卡点库' },
  q3: { action: '用AI管理团队', why: '效率高', replicate_to: '全团队' },
  q4: { content: '用户原话', use_for: '案例库' },
  q5: { action: '手动排版导航', times: 5, minutes: 10, type: '排版清洗', automatable: '排版步骤可交AI' },
  q6: { action: '写完拖拉磨蹭推文', new_asset: 'SOP步骤' },
  role_analysis: '今天在干活，没在建系统',
  team_instruction: '明天蜜蜜继续找对标账号',
  daily_asset: { content: '排版可用豆包自动化', type: '自动化需求', library: '自动化需求库', use_for: '导航交付' },
}

describe('analyzeIndividual', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(mockIndividualFeedback) } }],
      }),
    })
  })

  it('calls DeepSeek and returns individual feedback', async () => {
    const result = await analyzeIndividual('2026-05-26', '点妈', '内容', mockGoals, 'test-key')
    expect(result.q1.type).toBe('产品SOP')
    expect(result.role_analysis).toBe('今天在干活，没在建系统')
    expect(fetch).toHaveBeenCalledWith(
      'https://api.deepseek.com/v1/chat/completions',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('throws when DeepSeek returns non-ok status', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 429, text: async () => 'rate limit' })
    await expect(analyzeIndividual('2026-05-26', '点妈', '内容', mockGoals, 'test-key')).rejects.toThrow('DeepSeek API error 429')
  })
})

describe('analyzeTeam', () => {
  const mockTeamSummary: TeamSummary = {
    bottleneck: '点妈客服工作与核心目标连接弱',
    best_practice: '花小蜜用PPT发方案体现专业性',
    process_fix: '导航交付手动排版可接入豆包',
    alignment: '蜜蜜和花小蜜对齐，点妈客服偏离',
  }

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(mockTeamSummary) } }],
      }),
    })
  })

  it('calls DeepSeek and returns team summary', async () => {
    const result = await analyzeTeam('2026-05-26', mockReviews, mockGoals, 'test-key')
    expect(result.bottleneck).toContain('点妈客服')
    expect(result.alignment).toContain('花小蜜')
  })
})
