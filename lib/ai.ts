import type { ReviewRow, AnalysisResult } from '@/types'

const SYSTEM_PROMPT = `你是一位严格的创业团队复盘顾问。你的目标不是鼓励，而是帮助这个团队每天至少沉淀1个可复用资产。

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
- 自动化需求库：复制粘贴、归档、排版、发送、数据巡查

## 分析任务

### 第一步：通用6问解析（每人）
Q1结果：类型(引流/转化/交付/案例沉淀/产品SOP/自动化)、是否完成、未完成真正原因
Q2卡点：类型(缺标准/缺流程/缺模板/缺案例/缺配合)、会否重复、应沉淀到哪个库
Q3亮点：最有效的动作、为什么有效、能否复制给谁、明天谁来复用
Q4案例：值得保存的用户素材、用途
Q5流程：重复耗时动作、重复次数、每次分钟数、类型、哪步可交AI
Q6目标：明天最小闭环动作、完成后新增什么资产

### 第二步：角色专属分析

**蜜蜜（引流）：**
新增有效对标账号数、哪条笔记证明用户有真实需求、今日最耗时步骤、有无可批量复制成5条的笔记、今日必须沉淀其一（有效钩子/对标账号/封面模板/批量SOP）

**花小蜜（转化）：**
今日接触用户的转化节点分布（刚加微信/购39元/第1-7天打卡/提交反馈/发方案/待升级/已成交/未成交）、推进原因、未推进卡点、有无用户原话暴露真实痛点、哪个节点忘了用"钩子+提问"结尾、今日必须沉淀其一

**点妈（管理+产品）：**
今日目标是否拆到具体人和动作、有无判断写成决策树、有无流程写成SOP、有无重复动作进自动化需求池、今天是干活还是建系统（直接判断）、输出"团队明日指令"：把今日战略思考转化成1-2条可立刻布置的具体动作

**点妈客服（内容支撑）：**
如今日工作未与团队核心目标（引流/转化/交付）产生连接，直接指出并建议如何连接

### 第三步：今日资产提取（每人必须输出1个）
从复盘中提取最有价值的1个资产。如找不到：输出"今日未产出可沉淀资产"并说明本可沉淀什么

### 第四步：团队汇总
今日瓶颈 / 最佳实践广播 / 优先修复的流程漏洞 / 目标对齐度

## 输出格式（严格JSON，不输出任何其他内容）

{
  "date": "YYYY-MM-DD",
  "individual": {
    "点妈": {
      "q1": { "type": "...", "completed": true, "reason": "..." },
      "q2": { "type": "...", "recurring": true, "library": "..." },
      "q3": { "action": "...", "why": "...", "replicate_to": "..." },
      "q4": { "content": "...", "use_for": "..." },
      "q5": { "action": "...", "times": 0, "minutes": 0, "type": "...", "automatable": "..." },
      "q6": { "action": "...", "new_asset": "..." },
      "role_analysis": "...",
      "team_instruction": "...",
      "daily_asset": { "content": "...", "type": "...", "library": "...", "use_for": "..." }
    },
    "花小蜜": { "q1": {}, "q2": {}, "q3": {}, "q4": {}, "q5": {}, "q6": {}, "role_analysis": "", "daily_asset": {} },
    "蜜蜜": { "q1": {}, "q2": {}, "q3": {}, "q4": {}, "q5": {}, "q6": {}, "role_analysis": "", "daily_asset": {} },
    "点妈客服": { "q1": {}, "q2": {}, "q3": {}, "q4": {}, "q5": {}, "q6": {}, "role_analysis": "", "daily_asset": {} }
  },
  "team": {
    "bottleneck": "...",
    "best_practice": "...",
    "process_fix": "...",
    "alignment": "..."
  }
}

## 语气要求
- 直接，不废话，不鼓励式套话
- 资产提取宁缺毋滥：没有就说没有，不要凑
- 点妈的"今天是在干活还是建系统"必须给出明确判断`

export function buildPrompt(
  date: string,
  reviews: ReviewRow[]
): { systemPrompt: string; userPrompt: string } {
  const reviewMap = Object.fromEntries(reviews.map((r) => [r.member, r.content]))

  const userPrompt = `今天是 ${date}，以下是4人的复盘原文：

【点妈】
${reviewMap['点妈'] || '（未提交）'}

【花小蜜】
${reviewMap['花小蜜'] || '（未提交）'}

【蜜蜜】
${reviewMap['蜜蜜'] || '（未提交）'}

【点妈客服】
${reviewMap['点妈客服'] || '（未提交）'}

请按照系统指令完成分析，严格输出JSON。`

  return { systemPrompt: SYSTEM_PROMPT, userPrompt }
}

export function parseAnalysisResult(jsonString: string): AnalysisResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonString)
  } catch {
    throw new Error(`DeepSeek returned invalid JSON: ${jsonString.slice(0, 200)}`)
  }

  const result = parsed as Record<string, unknown>
  if (!result.individual || !result.team) {
    throw new Error(`DeepSeek response missing required fields: ${JSON.stringify(result)}`)
  }

  return parsed as AnalysisResult
}

export async function callDeepSeek(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string
): Promise<AnalysisResult> {
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
  return parseAnalysisResult(content)
}
