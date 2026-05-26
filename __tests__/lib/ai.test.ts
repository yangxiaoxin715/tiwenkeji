import { buildPrompt, callDeepSeek, parseAnalysisResult } from '@/lib/ai'
import type { ReviewRow, AnalysisResult } from '@/types'

const mockReviews: ReviewRow[] = [
  { id: 1, member: '点妈', date: '2026-05-26', content: '今天目标是梳理团队指标...', submitted_at: '' },
  { id: 2, member: '花小蜜', date: '2026-05-26', content: '今天招募了1个499元的...', submitted_at: '' },
  { id: 3, member: '蜜蜜', date: '2026-05-26', content: '今天目标是引流5人...', submitted_at: '' },
  { id: 4, member: '点妈客服', date: '2026-05-26', content: '今天整理了一本日记...', submitted_at: '' },
]

describe('buildPrompt', () => {
  it('contains all 4 member names', () => {
    const { userPrompt } = buildPrompt('2026-05-26', mockReviews)
    expect(userPrompt).toContain('【点妈】')
    expect(userPrompt).toContain('【花小蜜】')
    expect(userPrompt).toContain('【蜜蜜】')
    expect(userPrompt).toContain('【点妈客服】')
  })

  it('includes the review content', () => {
    const { userPrompt } = buildPrompt('2026-05-26', mockReviews)
    expect(userPrompt).toContain('今天目标是梳理团队指标')
    expect(userPrompt).toContain('今天招募了1个499元的')
  })

  it('includes the date', () => {
    const { userPrompt } = buildPrompt('2026-05-26', mockReviews)
    expect(userPrompt).toContain('2026-05-26')
  })

  it('returns a non-empty systemPrompt', () => {
    const { systemPrompt } = buildPrompt('2026-05-26', mockReviews)
    expect(systemPrompt.length).toBeGreaterThan(100)
  })
})

describe('parseAnalysisResult', () => {
  const validResult: AnalysisResult = {
    date: '2026-05-26',
    individual: {
      '点妈': {
        q1: { type: '产品SOP', completed: false, reason: '目标没想清楚' },
        q2: { type: '缺标准', recurring: true, library: '卡点库' },
        q3: { action: '用AI管理团队', why: '效率高', replicate_to: '全团队' },
        q4: { content: '用户原话', use_for: '案例库' },
        q5: { action: '手动排版导航', times: 5, minutes: 10, type: '排版清洗', automatable: '排版步骤可交AI' },
        q6: { action: '写完拖拉磨蹭推文', new_asset: 'SOP步骤' },
        role_analysis: '今天在干活，没在建系统',
        team_instruction: '明天蜜蜜继续找对标账号',
        daily_asset: { content: '排版可用豆包自动化', type: '自动化需求', library: '自动化需求库', use_for: '导航交付' },
      },
      '花小蜜': {
        q1: { type: '转化', completed: true, reason: '' },
        q2: { type: '缺配合', recurring: false, library: '' },
        q3: { action: '用PPT发转化方案', why: '更专业', replicate_to: '其他产品转化' },
        q4: { content: '用户说不需要再体验', use_for: '话术库' },
        q5: { action: '复制打卡记录', times: 5, minutes: 5, type: '文档归档', automatable: '可用脚本归档' },
        q6: { action: '优化7天转化流程', new_asset: '转化节点图' },
        role_analysis: '转化节点清晰，推进顺利',
        daily_asset: { content: '用PPT发方案体现专业性', type: '话术', library: '话术库', use_for: '所有产品转化' },
      },
      '蜜蜜': {
        q1: { type: '引流', completed: false, reason: '没找到有效钩子' },
        q2: { type: '缺模板', recurring: true, library: 'SOP库' },
        q3: { action: '迁移成功写作方法', why: '有现成模板', replicate_to: '其他内容创作' },
        q4: { content: '无', use_for: '' },
        q5: { action: '手动改AI文章开头', times: 3, minutes: 20, type: 'AI生成', automatable: '优化提示词避免重复开头' },
        q6: { action: '固定笔记模板批量生产', new_asset: '封面模板' },
        role_analysis: '找到了迁移方法论，效率有提升',
        daily_asset: { content: '迁移成功写法：先找对标再套模板', type: 'SOP步骤', library: 'SOP库', use_for: '所有内容创作' },
      },
      '点妈客服': {
        q1: { type: '案例沉淀', completed: true, reason: '' },
        q2: { type: '缺工具', recurring: false, library: '' },
        q3: { action: '用豆包整理书稿', why: '比元宝准确', replicate_to: '其他文稿整理' },
        q4: { content: '无', use_for: '' },
        q5: { action: '手动整理水笔', times: 1, minutes: 60, type: '信息收集', automatable: '部分可用OCR' },
        q6: { action: '完成一本日记整理', new_asset: '案例素材' },
        role_analysis: '工作未与团队引流/转化目标产生连接，建议整理内容直接用于公众号或小红书',
        daily_asset: { content: '豆包整理书稿比元宝准确且不偷工减料', type: '判断标准', library: '案例库', use_for: '工具选型' },
      },
    },
    team: {
      bottleneck: '点妈和点妈客服今日目标不清晰',
      best_practice: '花小蜜用PPT发方案，体现专业性，可复制到所有产品转化节点',
      process_fix: '导航交付手动排版每次10分钟×5次，优先接入豆包自动排版',
      alignment: '蜜蜜和花小蜜对齐，点妈客服工作与团队核心目标连接弱',
    },
  }

  it('parses valid JSON string', () => {
    const result = parseAnalysisResult(JSON.stringify(validResult))
    expect(result.date).toBe('2026-05-26')
    expect(result.individual['点妈'].q1.type).toBe('产品SOP')
    expect(result.team.bottleneck).toContain('点妈')
  })

  it('throws on invalid JSON', () => {
    expect(() => parseAnalysisResult('not json')).toThrow()
  })

  it('throws when individual field is missing', () => {
    const bad = JSON.stringify({ date: '2026-05-26', team: {} })
    expect(() => parseAnalysisResult(bad)).toThrow()
  })
})

describe('callDeepSeek', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                date: '2026-05-26',
                individual: {
                  '点妈': { q1: {}, q2: {}, q3: {}, q4: {}, q5: {}, q6: {}, role_analysis: '', team_instruction: '', daily_asset: {} },
                  '花小蜜': { q1: {}, q2: {}, q3: {}, q4: {}, q5: {}, q6: {}, role_analysis: '', daily_asset: {} },
                  '蜜蜜': { q1: {}, q2: {}, q3: {}, q4: {}, q5: {}, q6: {}, role_analysis: '', daily_asset: {} },
                  '点妈客服': { q1: {}, q2: {}, q3: {}, q4: {}, q5: {}, q6: {}, role_analysis: '', daily_asset: {} },
                },
                team: { bottleneck: '', best_practice: '', process_fix: '', alignment: '' },
              }),
            },
          },
        ],
      }),
    })
  })

  it('calls DeepSeek and returns parsed result', async () => {
    const result = await callDeepSeek('system', 'user', 'test-key')
    expect(result.date).toBe('2026-05-26')
    expect(fetch).toHaveBeenCalledWith(
      'https://api.deepseek.com/v1/chat/completions',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('throws when DeepSeek returns non-ok status', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 429, text: async () => 'rate limit' })
    await expect(callDeepSeek('system', 'user', 'test-key')).rejects.toThrow('DeepSeek API error 429')
  })
})
