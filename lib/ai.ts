import type { ReviewRow, IndividualFeedback, TeamSummary, Goals, MemberName } from '@/types'

const TEAM_CONTEXT = `你是一位严格的创业团队复盘顾问。你的目标不是鼓励，而是帮助这个团队每天至少沉淀1个可复用资产。

## 团队背景
4人教育创业团队，核心业务：
- 引流：小红书内容 → 私域（目标150人/月，蜜蜜负责）
- 转化：体验营39元 → 年费499元（花小蜜负责）
- 交付：985导航、拖拉磨蹭训练营、小说家训练营（点妈负责）
- 内容支撑：日记整理、书稿（点妈客服负责）

## 6个库
- 目标库：本周/每日目标、每人指标
- 卡点库：做不下去、等人、流程不清的问题
- SOP库：引流/转化/交付/反馈/案例整理流程
- 话术库：成交节点、回访、问题结尾、朋友圈私聊
- 案例库：用户原话、孩子变化、成交/拒绝原因
- 自动化需求库：复制粘贴、归档、排版、发送、数据巡查`

const ROLE_ANALYSIS: Record<MemberName, string> = {
  '蜜蜜': `**角色专属分析（蜜蜜·引流）：**
新增有效对标账号数、哪条笔记证明用户有真实需求、今日最耗时步骤、有无可批量复制成5条的笔记、今日必须沉淀其一（有效钩子/对标账号/封面模板/批量SOP）`,

  '花小蜜': `**角色专属分析（花小蜜·转化）：**
今日接触用户的转化节点分布（刚加微信/购39元/第1-7天打卡/提交反馈/发方案/待升级/已成交/未成交）、推进原因、未推进卡点、有无用户原话暴露真实痛点、哪个节点忘了用"钩子+提问"结尾、今日必须沉淀其一`,

  '点妈': `**角色专属分析（点妈·管理+产品）：**
今日目标是否拆到具体人和动作、有无判断写成决策树、有无流程写成SOP、有无重复动作进自动化需求池、今天是干活还是建系统（直接判断）
额外输出"团队明日指令"字段：把今日战略思考转化成1-2条可立刻布置的具体动作`,

  '点妈客服': `**角色专属分析（点妈客服·内容支撑）：**
如今日工作未与团队核心目标（引流/转化/交付）产生连接，直接指出并建议如何连接`,
}

const INDIVIDUAL_OUTPUT_FORMAT = `## 输出格式（严格JSON，不输出任何其他内容）

{
  "q1": { "type": "引流|转化|交付|案例沉淀|产品SOP|自动化", "completed": true, "reason": "未完成时填写真正原因" },
  "q2": { "type": "缺标准|缺流程|缺模板|缺案例|缺配合", "recurring": true, "library": "应沉淀到哪个库" },
  "q3": { "action": "最有效的动作", "why": "为什么有效", "replicate_to": "明天谁来复用" },
  "q4": { "content": "值得保存的用户素材", "use_for": "用途" },
  "q5": { "action": "重复耗时动作", "times": 0, "minutes": 0, "type": "类型", "automatable": "哪步可交AI" },
  "q6": { "action": "明天最小闭环动作", "new_asset": "完成后新增什么资产" },
  "role_analysis": "角色专属分析结果",
  "team_instruction": "仅点妈填写，其他人留空字符串",
  "daily_asset": { "content": "资产内容，找不到时写'今日未产出可沉淀资产'", "type": "类型", "library": "归属库名", "use_for": "可用于" }
}

## 语气要求
- 直接，不废话，不鼓励式套话
- 资产提取宁缺毋滥：没有就说没有，不要凑
- 点妈的"今天是在干活还是建系统"必须给出明确判断`

export function buildIndividualPrompt(
  date: string,
  member: MemberName,
  content: string,
  goals: Goals
): { systemPrompt: string; userPrompt: string } {
  const individualGoal = goals.individual_goals[member] || '（未设定）'

  const systemPrompt = `${TEAM_CONTEXT}

## 分析任务：${member} 的今日复盘

### 第一步：通用6问解析
Q1结果：类型(引流/转化/交付/案例沉淀/产品SOP/自动化)、是否完成、未完成真正原因
Q2卡点：类型(缺标准/缺流程/缺模板/缺案例/缺配合)、会否重复、应沉淀到哪个库
Q3亮点：最有效的动作、为什么有效、能否复制给谁、明天谁来复用
Q4案例：值得保存的用户素材、用途
Q5流程：重复耗时动作、重复次数、每次分钟数、类型、哪步可交AI
Q6目标：明天最小闭环动作（结合个人目标）、完成后新增什么资产

### 第二步：角色专属分析
${ROLE_ANALYSIS[member]}

### 第三步：今日资产提取（必须输出1个）
从复盘中提取最有价值的1个资产。如找不到：输出"今日未产出可沉淀资产"并说明本可沉淀什么

${INDIVIDUAL_OUTPUT_FORMAT}`

  const userPrompt = `今天是 ${date}

**团队目标：** ${goals.team_goal || '（未设定）'}
**${member} 个人目标：** ${individualGoal}

**${member} 今日复盘：**
${content}

请按照系统指令完成分析，严格输出JSON。`

  return { systemPrompt, userPrompt }
}

export function buildTeamPrompt(
  date: string,
  reviews: ReviewRow[],
  goals: Goals
): { systemPrompt: string; userPrompt: string } {
  const reviewMap = Object.fromEntries(reviews.map((r) => [r.member, r.content]))

  const systemPrompt = `${TEAM_CONTEXT}

## 分析任务：团队汇总

基于全员今日复盘，结合团队目标，生成团队层面的分析：
- 今日瓶颈：全队最核心的障碍是什么
- 最佳实践广播：谁的什么动作值得全队学习
- 优先修复的流程漏洞：最该解决的一个流程问题
- 目标对齐度：今日行动与团队目标的契合程度评估

## 输出格式（严格JSON，不输出任何其他内容）

{
  "bottleneck": "...",
  "best_practice": "...",
  "process_fix": "...",
  "alignment": "..."
}

直接，不废话。`

  const individualGoalLines = (Object.entries(goals.individual_goals) as [string, string][])
    .map(([m, g]) => `- ${m}：${g}`)
    .join('\n')

  const userPrompt = `今天是 ${date}

**团队目标：** ${goals.team_goal || '（未设定）'}
**个人目标：**
${individualGoalLines || '（未设定）'}

【点妈】
${reviewMap['点妈'] || '（未提交）'}

【花小蜜】
${reviewMap['花小蜜'] || '（未提交）'}

【蜜蜜】
${reviewMap['蜜蜜'] || '（未提交）'}

【点妈客服】
${reviewMap['点妈客服'] || '（未提交）'}

请按照系统指令完成分析，严格输出JSON。`

  return { systemPrompt, userPrompt }
}

async function callDeepSeek(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string
): Promise<unknown> {
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    throw new Error(`DeepSeek API error ${response.status}: ${await response.text()}`)
  }

  const data = await response.json()
  const content = data.choices[0].message.content as string

  try {
    return JSON.parse(content)
  } catch {
    throw new Error(`DeepSeek returned invalid JSON: ${content.slice(0, 200)}`)
  }
}

export async function analyzeIndividual(
  date: string,
  member: MemberName,
  content: string,
  goals: Goals,
  apiKey: string
): Promise<IndividualFeedback> {
  const { systemPrompt, userPrompt } = buildIndividualPrompt(date, member, content, goals)
  const result = await callDeepSeek(systemPrompt, userPrompt, apiKey) as Record<string, unknown>
  if (!result.q1 || !result.role_analysis) {
    throw new Error(`Individual analysis missing required fields: ${JSON.stringify(result)}`)
  }
  return result as unknown as IndividualFeedback
}

export async function analyzeTeam(
  date: string,
  reviews: ReviewRow[],
  goals: Goals,
  apiKey: string
): Promise<TeamSummary> {
  const { systemPrompt, userPrompt } = buildTeamPrompt(date, reviews, goals)
  const result = await callDeepSeek(systemPrompt, userPrompt, apiKey) as Record<string, unknown>
  if (!result.bottleneck || !result.alignment) {
    throw new Error(`Team analysis missing required fields: ${JSON.stringify(result)}`)
  }
  return result as unknown as TeamSummary
}
