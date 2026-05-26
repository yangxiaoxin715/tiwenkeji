# 每日复盘工具 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local Next.js web app where 4 team members paste their daily voice-to-text review, DeepSeek AI auto-analyzes when all 4 submit, and displays structured individual feedback + team summary + daily assets.

**Architecture:** Next.js 14 App Router with SQLite (better-sqlite3) for persistence. API routes handle submit/status/results. `lib/db.ts` owns all DB operations via a factory function (testable with `:memory:`). `lib/ai.ts` builds the DeepSeek prompt and parses the JSON response. The waiting page polls `/api/status` every 3 seconds and auto-redirects when analysis is ready.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, better-sqlite3, DeepSeek API (`deepseek-chat`), Jest + ts-jest.

---

## File Map

| File | Responsibility |
|------|---------------|
| `types/index.ts` | All shared TypeScript types and constants |
| `lib/db.ts` | SQLite factory + CRUD for reviews / analysis / assets |
| `lib/ai.ts` | DeepSeek prompt builder + API call + response parser |
| `app/api/submit/route.ts` | POST: save review, trigger analysis if all 4 submitted |
| `app/api/status/route.ts` | GET: per-member submission status + `analysis_ready` flag |
| `app/api/results/route.ts` | GET: full analysis JSON for a given date |
| `app/page.tsx` | Home: 4 member cards with today's status |
| `app/submit/[member]/page.tsx` | Submit: text area + 6-question sidebar |
| `app/submit/[member]/done/page.tsx` | Waiting: polls status, auto-redirects |
| `app/results/[date]/page.tsx` | Results: individual feedback + team summary tabs |
| `components/MemberCard.tsx` | Clickable card for home page |
| `components/SubmitForm.tsx` | Controlled text area + submit button (client) |
| `components/QuestionGuide.tsx` | 6-question reference sidebar |
| `components/WaitingStatus.tsx` | Polling progress display (client) |
| `components/FeedbackCard.tsx` | One member's full feedback display |
| `components/TeamSummary.tsx` | Team summary section |
| `__tests__/lib/db.test.ts` | DB layer unit tests (in-memory) |
| `__tests__/lib/ai.test.ts` | AI prompt + parser unit tests (mocked fetch) |
| `__tests__/api/submit.test.ts` | Submit route logic tests |
| `__tests__/api/status.test.ts` | Status route logic tests |

---

## Task 1: Project Scaffold + Dependencies

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`
- Create: `jest.config.ts`, `jest.setup.ts`
- Create: `.env.local`, `.gitignore`
- Create: `data/` directory (gitignored)

- [ ] **Step 1: Initialise Next.js app inside the existing directory**

```bash
cd /Users/yangming/daily-review
npx create-next-app@14 . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"
```

When prompted:
- "Ok to proceed?" → `y`
- All other prompts: accept defaults (TypeScript ✓, Tailwind ✓, App Router ✓)

- [ ] **Step 2: Install runtime and test dependencies**

```bash
cd /Users/yangming/daily-review
npm install better-sqlite3
npm install --save-dev @types/better-sqlite3 jest @types/jest ts-jest jest-environment-node
```

- [ ] **Step 3: Create `jest.config.ts`**

```typescript
import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
}

export default config
```

- [ ] **Step 4: Replace `next.config.ts` to externalise better-sqlite3**

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3'],
}

export default nextConfig
```

- [ ] **Step 5: Create `.env.local`**

```
DEEPSEEK_API_KEY=your_key_here
```

- [ ] **Step 6: Ensure `data/` is gitignored — add to `.gitignore`**

```
# SQLite database
/data/
```

- [ ] **Step 7: Create the data directory**

```bash
mkdir -p /Users/yangming/daily-review/data
```

- [ ] **Step 8: Verify Next.js starts**

```bash
cd /Users/yangming/daily-review
npm run dev
```

Expected: server starts at `http://localhost:3000` with default Next.js page.

Stop the server (Ctrl+C).

- [ ] **Step 9: Commit**

```bash
cd /Users/yangming/daily-review
git add -A
git commit -m "feat: scaffold Next.js 14 app with better-sqlite3 and jest"
```

---

## Task 2: Shared TypeScript Types

**Files:**
- Create: `types/index.ts`

- [ ] **Step 1: Create `types/index.ts`**

```typescript
export const MEMBERS = ['点妈', '花小蜜', '蜜蜜', '点妈客服'] as const
export type MemberName = typeof MEMBERS[number]

export const LIBRARIES = ['目标库', '卡点库', 'SOP库', '话术库', '案例库', '自动化需求库'] as const
export type LibraryName = typeof LIBRARIES[number]

// Database row types
export interface ReviewRow {
  id: number
  member: MemberName
  date: string
  content: string
  submitted_at: string
}

export interface AnalysisRow {
  id: number
  date: string
  result: string  // JSON string
  created_at: string
}

export interface AssetRow {
  id: number
  date: string
  member: MemberName
  content: string
  type: string
  library: LibraryName
  use_for: string
  created_at: string
}

// AI analysis types — mirror the DeepSeek JSON output
export interface Q1Result {
  type: string
  completed: boolean
  reason: string
}

export interface Q2Result {
  type: string
  recurring: boolean
  library: string
}

export interface Q3Result {
  action: string
  why: string
  replicate_to: string
}

export interface Q4Result {
  content: string
  use_for: string
}

export interface Q5Result {
  action: string
  times: number
  minutes: number
  type: string
  automatable: string
}

export interface Q6Result {
  action: string
  new_asset: string
}

export interface DailyAsset {
  content: string
  type: string
  library: LibraryName
  use_for: string
}

export interface IndividualFeedback {
  q1: Q1Result
  q2: Q2Result
  q3: Q3Result
  q4: Q4Result
  q5: Q5Result
  q6: Q6Result
  role_analysis: string
  team_instruction?: string
  daily_asset: DailyAsset
}

export interface TeamSummary {
  bottleneck: string
  best_practice: string
  process_fix: string
  alignment: string
}

export interface AnalysisResult {
  date: string
  individual: Record<MemberName, IndividualFeedback>
  team: TeamSummary
}

// API response types
export interface StatusResponse {
  date: string
  submitted: Record<MemberName, boolean>
  all_submitted: boolean
  analysis_ready: boolean
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/yangming/daily-review
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add types/index.ts
git commit -m "feat: add shared TypeScript types"
```

---

## Task 3: Database Layer

**Files:**
- Create: `lib/db.ts`
- Create: `__tests__/lib/db.test.ts`

- [ ] **Step 1: Write failing tests for `lib/db.ts`**

Create `__tests__/lib/db.test.ts`:

```typescript
import Database from 'better-sqlite3'
import {
  createDb,
  insertReview,
  getReviewsForDate,
  getReviewByMemberAndDate,
  getSubmittedCountForDate,
  saveAnalysis,
  getAnalysis,
  saveAssets,
} from '@/lib/db'
import type { MemberName, DailyAsset } from '@/types'

let db: Database.Database

beforeEach(() => {
  db = createDb(':memory:')
})

afterEach(() => {
  db.close()
})

describe('insertReview + getReviewByMemberAndDate', () => {
  it('saves and retrieves a review', () => {
    insertReview(db, '点妈', '2026-05-26', '今天完成了引流目标')
    const row = getReviewByMemberAndDate(db, '点妈', '2026-05-26')
    expect(row).not.toBeNull()
    expect(row!.content).toBe('今天完成了引流目标')
    expect(row!.member).toBe('点妈')
  })

  it('returns null when no review exists', () => {
    const row = getReviewByMemberAndDate(db, '蜜蜜', '2026-05-26')
    expect(row).toBeNull()
  })

  it('throws on duplicate member+date', () => {
    insertReview(db, '花小蜜', '2026-05-26', '第一次')
    expect(() => insertReview(db, '花小蜜', '2026-05-26', '第二次')).toThrow()
  })
})

describe('getReviewsForDate', () => {
  it('returns all reviews for a date', () => {
    insertReview(db, '点妈', '2026-05-26', 'A')
    insertReview(db, '蜜蜜', '2026-05-26', 'B')
    const rows = getReviewsForDate(db, '2026-05-26')
    expect(rows).toHaveLength(2)
  })

  it('returns empty array when no reviews', () => {
    const rows = getReviewsForDate(db, '2026-05-27')
    expect(rows).toHaveLength(0)
  })
})

describe('getSubmittedCountForDate', () => {
  it('counts submitted members correctly', () => {
    insertReview(db, '点妈', '2026-05-26', 'A')
    insertReview(db, '花小蜜', '2026-05-26', 'B')
    expect(getSubmittedCountForDate(db, '2026-05-26')).toBe(2)
  })
})

describe('saveAnalysis + getAnalysis', () => {
  it('saves and retrieves analysis', () => {
    const result = { date: '2026-05-26', individual: {}, team: {} }
    saveAnalysis(db, '2026-05-26', result)
    const row = getAnalysis(db, '2026-05-26')
    expect(row).not.toBeNull()
    expect(JSON.parse(row!.result)).toEqual(result)
  })

  it('returns null when no analysis exists', () => {
    expect(getAnalysis(db, '2026-05-27')).toBeNull()
  })
})

describe('saveAssets', () => {
  it('saves multiple assets', () => {
    const assets: Array<{ member: MemberName; asset: DailyAsset }> = [
      {
        member: '蜜蜜',
        asset: {
          content: '对标账号判断标准：近3个月持续发引流笔记',
          type: '判断标准',
          library: '案例库',
          use_for: '引流对标',
        },
      },
    ]
    saveAssets(db, '2026-05-26', assets)
    const rows = db.prepare('SELECT * FROM assets WHERE date = ?').all('2026-05-26') as any[]
    expect(rows).toHaveLength(1)
    expect(rows[0].member).toBe('蜜蜜')
  })
})
```

- [ ] **Step 2: Run tests — expect failure**

```bash
cd /Users/yangming/daily-review
npx jest __tests__/lib/db.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/db'`

- [ ] **Step 3: Implement `lib/db.ts`**

```typescript
import Database from 'better-sqlite3'
import path from 'path'
import type { MemberName, ReviewRow, AnalysisRow, DailyAsset } from '@/types'

const DEFAULT_DB_PATH = path.join(process.cwd(), 'data', 'daily-review.db')

export function createDb(dbPath: string = DEFAULT_DB_PATH): Database.Database {
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  initSchema(db)
  return db
}

function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      member       TEXT NOT NULL,
      date         TEXT NOT NULL,
      content      TEXT NOT NULL,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(member, date)
    );

    CREATE TABLE IF NOT EXISTS analysis (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      date       TEXT NOT NULL UNIQUE,
      result     TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS assets (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      date       TEXT NOT NULL,
      member     TEXT NOT NULL,
      content    TEXT NOT NULL,
      type       TEXT NOT NULL,
      library    TEXT NOT NULL,
      use_for    TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)
}

export function insertReview(
  db: Database.Database,
  member: MemberName,
  date: string,
  content: string
): void {
  db.prepare(
    'INSERT INTO reviews (member, date, content) VALUES (?, ?, ?)'
  ).run(member, date, content)
}

export function getReviewByMemberAndDate(
  db: Database.Database,
  member: MemberName,
  date: string
): ReviewRow | null {
  return (
    (db
      .prepare('SELECT * FROM reviews WHERE member = ? AND date = ?')
      .get(member, date) as ReviewRow) || null
  )
}

export function getReviewsForDate(
  db: Database.Database,
  date: string
): ReviewRow[] {
  return db
    .prepare('SELECT * FROM reviews WHERE date = ?')
    .all(date) as ReviewRow[]
}

export function getSubmittedCountForDate(
  db: Database.Database,
  date: string
): number {
  const row = db
    .prepare('SELECT COUNT(*) as count FROM reviews WHERE date = ?')
    .get(date) as { count: number }
  return row.count
}

export function saveAnalysis(
  db: Database.Database,
  date: string,
  result: object
): void {
  db.prepare(
    'INSERT OR REPLACE INTO analysis (date, result) VALUES (?, ?)'
  ).run(date, JSON.stringify(result))
}

export function getAnalysis(
  db: Database.Database,
  date: string
): AnalysisRow | null {
  return (
    (db
      .prepare('SELECT * FROM analysis WHERE date = ?')
      .get(date) as AnalysisRow) || null
  )
}

export function saveAssets(
  db: Database.Database,
  date: string,
  assets: Array<{ member: MemberName; asset: DailyAsset }>
): void {
  const stmt = db.prepare(
    'INSERT INTO assets (date, member, content, type, library, use_for) VALUES (?, ?, ?, ?, ?, ?)'
  )
  const insertMany = db.transaction(
    (items: Array<{ member: MemberName; asset: DailyAsset }>) => {
      for (const { member, asset } of items) {
        stmt.run(date, member, asset.content, asset.type, asset.library, asset.use_for)
      }
    }
  )
  insertMany(assets)
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npx jest __tests__/lib/db.test.ts
```

Expected: all 8 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/db.ts __tests__/lib/db.test.ts
git commit -m "feat: add database layer with SQLite (better-sqlite3)"
```

---

## Task 4: AI Layer

**Files:**
- Create: `lib/ai.ts`
- Create: `__tests__/lib/ai.test.ts`

- [ ] **Step 1: Write failing tests for `lib/ai.ts`**

Create `__tests__/lib/ai.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run tests — expect failure**

```bash
npx jest __tests__/lib/ai.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/ai'`

- [ ] **Step 3: Implement `lib/ai.ts`**

```typescript
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
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npx jest __tests__/lib/ai.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/ai.ts __tests__/lib/ai.test.ts
git commit -m "feat: add AI layer with DeepSeek prompt builder and parser"
```

---

## Task 5: API Routes

**Files:**
- Create: `app/api/submit/route.ts`
- Create: `app/api/status/route.ts`
- Create: `app/api/results/route.ts`
- Create: `__tests__/api/submit.test.ts`
- Create: `__tests__/api/status.test.ts`

- [ ] **Step 1: Write failing tests for submit logic**

Create `__tests__/api/submit.test.ts`:

```typescript
import Database from 'better-sqlite3'
import { createDb, insertReview, getSubmittedCountForDate, saveAnalysis, saveAssets, getReviewsForDate } from '@/lib/db'
import { MEMBERS } from '@/types'

// Test the submit business logic directly (not the HTTP layer)
// which is: insert review, if count == 4 trigger analysis

let db: Database.Database

beforeEach(() => {
  db = createDb(':memory:')
})

afterEach(() => {
  db.close()
})

it('count is 0 before any submissions', () => {
  expect(getSubmittedCountForDate(db, '2026-05-26')).toBe(0)
})

it('count reaches 4 after all members submit', () => {
  for (const member of MEMBERS) {
    insertReview(db, member, '2026-05-26', `复盘内容 ${member}`)
  }
  expect(getSubmittedCountForDate(db, '2026-05-26')).toBe(4)
})

it('all 4 reviews are retrievable after submission', () => {
  for (const member of MEMBERS) {
    insertReview(db, member, '2026-05-26', `复盘内容 ${member}`)
  }
  const reviews = getReviewsForDate(db, '2026-05-26')
  expect(reviews).toHaveLength(4)
  expect(reviews.map((r) => r.member).sort()).toEqual([...MEMBERS].sort())
})
```

Create `__tests__/api/status.test.ts`:

```typescript
import Database from 'better-sqlite3'
import { createDb, insertReview, getReviewByMemberAndDate, getAnalysis } from '@/lib/db'
import { MEMBERS } from '@/types'

let db: Database.Database

beforeEach(() => {
  db = createDb(':memory:')
})

afterEach(() => {
  db.close()
})

it('no submissions → all false, analysis_ready false', () => {
  const submitted = Object.fromEntries(
    MEMBERS.map((m) => [m, !!getReviewByMemberAndDate(db, m, '2026-05-26')])
  )
  const analysis_ready = !!getAnalysis(db, '2026-05-26')
  expect(Object.values(submitted).every((v) => v === false)).toBe(true)
  expect(analysis_ready).toBe(false)
})

it('after all submit, all_submitted is true', () => {
  for (const member of MEMBERS) {
    insertReview(db, member, '2026-05-26', 'content')
  }
  const submitted = Object.fromEntries(
    MEMBERS.map((m) => [m, !!getReviewByMemberAndDate(db, m, '2026-05-26')])
  )
  expect(Object.values(submitted).every((v) => v === true)).toBe(true)
})
```

- [ ] **Step 2: Run tests — expect pass (they test db functions, not HTTP)**

```bash
npx jest __tests__/api/
```

Expected: all tests PASS.

- [ ] **Step 3: Implement `app/api/submit/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createDb, insertReview, getSubmittedCountForDate, getReviewsForDate, saveAnalysis, saveAssets } from '@/lib/db'
import { buildPrompt, callDeepSeek } from '@/lib/ai'
import type { MemberName, AnalysisResult } from '@/types'
import { MEMBERS } from '@/types'

const db = createDb()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { member, content } = body as { member: MemberName; content: string }

    if (!MEMBERS.includes(member)) {
      return NextResponse.json({ error: '无效的成员名称' }, { status: 400 })
    }
    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: '复盘内容不能为空' }, { status: 400 })
    }

    const today = new Date().toISOString().slice(0, 10)

    try {
      insertReview(db, member, today, content.trim())
    } catch {
      return NextResponse.json({ error: '今天已经提交过了' }, { status: 409 })
    }

    const count = getSubmittedCountForDate(db, today)

    if (count === 4) {
      // Trigger analysis asynchronously — don't block the response
      triggerAnalysis(today).catch(console.error)
    }

    return NextResponse.json({ ok: true, submitted_count: count })
  } catch (error) {
    console.error('Submit error:', error)
    return NextResponse.json({ error: '提交失败，请重试' }, { status: 500 })
  }
}

async function triggerAnalysis(date: string): Promise<void> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    console.error('DEEPSEEK_API_KEY not set')
    return
  }

  const reviews = getReviewsForDate(db, date)
  const { systemPrompt, userPrompt } = buildPrompt(date, reviews)
  const result: AnalysisResult = await callDeepSeek(systemPrompt, userPrompt, apiKey)

  saveAnalysis(db, date, result)

  const assets = MEMBERS.filter((m) => result.individual[m]?.daily_asset?.content).map((m) => ({
    member: m,
    asset: result.individual[m].daily_asset,
  }))
  saveAssets(db, date, assets)
}
```

- [ ] **Step 4: Implement `app/api/status/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createDb, getReviewByMemberAndDate, getAnalysis } from '@/lib/db'
import { MEMBERS } from '@/types'
import type { StatusResponse } from '@/types'

const db = createDb()

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get('date') || new Date().toISOString().slice(0, 10)

  const submitted = Object.fromEntries(
    MEMBERS.map((m) => [m, !!getReviewByMemberAndDate(db, m, date)])
  ) as Record<string, boolean>

  const all_submitted = MEMBERS.every((m) => submitted[m])
  const analysis_ready = !!getAnalysis(db, date)

  const response: StatusResponse = {
    date,
    submitted: submitted as StatusResponse['submitted'],
    all_submitted,
    analysis_ready,
  }

  return NextResponse.json(response)
}
```

- [ ] **Step 5: Implement `app/api/results/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createDb, getAnalysis } from '@/lib/db'
import type { AnalysisResult } from '@/types'

const db = createDb()

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get('date') || new Date().toISOString().slice(0, 10)
  const row = getAnalysis(db, date)

  if (!row) {
    return NextResponse.json({ error: '该日期暂无分析结果' }, { status: 404 })
  }

  const result: AnalysisResult = JSON.parse(row.result)
  return NextResponse.json(result)
}
```

- [ ] **Step 6: Verify app builds without errors**

```bash
npm run build
```

Expected: build completes successfully (may show warnings but no errors).

- [ ] **Step 7: Commit**

```bash
git add app/api/ __tests__/api/
git commit -m "feat: add submit, status, and results API routes"
```

---

## Task 6: Home Page

**Files:**
- Create: `components/MemberCard.tsx`
- Modify: `app/page.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Create `components/MemberCard.tsx`**

```tsx
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
```

- [ ] **Step 2: Replace `app/page.tsx`**

```tsx
import { createDb, getReviewByMemberAndDate, getAnalysis } from '@/lib/db'
import { MEMBERS } from '@/types'
import MemberCard from '@/components/MemberCard'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function HomePage() {
  const db = createDb()
  const today = new Date().toISOString().slice(0, 10)

  const submitted = Object.fromEntries(
    MEMBERS.map((m) => [m, !!getReviewByMemberAndDate(db, m, today)])
  )
  const submittedCount = Object.values(submitted).filter(Boolean).length
  const analysisReady = !!getAnalysis(db, today)

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-1">每日复盘</h1>
        <p className="text-center text-gray-500 text-sm mb-8">{today}</p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {MEMBERS.map((member) => (
            <MemberCard key={member} member={member} submitted={!!submitted[member]} />
          ))}
        </div>

        <p className="text-center text-gray-500 text-sm mb-4">
          {submittedCount} / 4 人已提交
          {submittedCount === 4 && !analysisReady && ' · AI 分析中…'}
        </p>

        {analysisReady && (
          <Link
            href={`/results/${today}`}
            className="block w-full text-center bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
          >
            查看今日分析结果 →
          </Link>
        )}
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Verify home page renders**

```bash
npm run dev
```

Open `http://localhost:3000`. Expected: 4 member cards visible, all showing "待提交".

Stop the server.

- [ ] **Step 4: Commit**

```bash
git add components/MemberCard.tsx app/page.tsx
git commit -m "feat: add home page with member cards and submission status"
```

---

## Task 7: Submit Page

**Files:**
- Create: `components/QuestionGuide.tsx`
- Create: `components/SubmitForm.tsx`
- Create: `app/submit/[member]/page.tsx`

- [ ] **Step 1: Create `components/QuestionGuide.tsx`**

```tsx
export default function QuestionGuide() {
  const questions = [
    {
      num: 'Q1',
      label: '结果',
      text: '今天你负责的一个可验收结果是什么？完成了吗？没完成的真正原因？',
    },
    {
      num: 'Q2',
      label: '卡点',
      text: '这个卡点是缺标准、缺流程、缺模板、缺案例，还是缺别人配合？它以后还会重复出现吗？',
    },
    {
      num: 'Q3',
      label: '亮点',
      text: '今天哪个动作最有效？为什么有效？能不能复制到其他产品或同事身上？',
    },
    {
      num: 'Q4',
      label: '案例',
      text: '今天有没有一个用户反馈、聊天记录、成交原因或拒绝原因值得保存？',
    },
    {
      num: 'Q5',
      label: '流程',
      text: '今天哪个动作重复、费时、烦？重复了几次？哪一步可以交给 AI？',
    },
    {
      num: 'Q6',
      label: '目标',
      text: '明天的最小闭环动作是什么？做完这一个动作会新增什么团队资产？',
    },
  ]

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">6 个参考问题</p>
      {questions.map((q) => (
        <div key={q.num} className="flex gap-2">
          <span className="shrink-0 w-16 text-xs font-bold text-indigo-500">
            {q.num} {q.label}
          </span>
          <p className="text-xs text-gray-500 leading-relaxed">{q.text}</p>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Create `components/SubmitForm.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { MemberName } from '@/types'

interface SubmitFormProps {
  member: MemberName
}

export default function SubmitForm({ member }: SubmitFormProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (content.trim().length < 20) {
      setError('内容太短，请把语音转文字粘贴进来')
      return
    }
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member, content }),
      })

      if (res.status === 409) {
        setError('今天已经提交过了')
        setLoading(false)
        return
      }
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || '提交失败，请重试')
        setLoading(false)
        return
      }

      router.push(`/submit/${encodeURIComponent(member)}/done`)
    } catch {
      setError('网络错误，请重试')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 h-full">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="把今天的语音转文字粘贴进来……&#10;&#10;覆盖六个问题：结果、卡点、亮点、案例、流程、明日目标"
        className="flex-1 w-full p-4 border-2 border-gray-200 rounded-xl resize-none text-sm leading-relaxed focus:border-indigo-400 focus:outline-none min-h-[300px]"
        disabled={loading}
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading || content.trim().length === 0}
        className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold disabled:opacity-50 hover:bg-indigo-700 transition-colors"
      >
        {loading ? '提交中…' : '提交复盘 →'}
      </button>
    </form>
  )
}
```

- [ ] **Step 3: Create `app/submit/[member]/page.tsx`**

```tsx
import { notFound } from 'next/navigation'
import { createDb, getReviewByMemberAndDate } from '@/lib/db'
import { MEMBERS } from '@/types'
import type { MemberName } from '@/types'
import SubmitForm from '@/components/SubmitForm'
import QuestionGuide from '@/components/QuestionGuide'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface Props {
  params: { member: string }
}

export default function SubmitPage({ params }: Props) {
  const member = decodeURIComponent(params.member) as MemberName
  if (!MEMBERS.includes(member)) notFound()

  const db = createDb()
  const today = new Date().toISOString().slice(0, 10)
  const existing = getReviewByMemberAndDate(db, member, today)

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← 返回</Link>
          <h1 className="text-xl font-bold text-gray-900">{member} · {today}</h1>
        </div>

        {existing ? (
          <div className="bg-white rounded-2xl p-6 border-2 border-green-200">
            <p className="text-green-600 font-semibold mb-3">✅ 今天已提交</p>
            <pre className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{existing.content}</pre>
          </div>
        ) : (
          <div className="flex gap-6">
            <div className="flex-1">
              <SubmitForm member={member} />
            </div>
            <div className="w-72 shrink-0 bg-white rounded-2xl p-5 border border-gray-100 self-start">
              <QuestionGuide />
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
```

- [ ] **Step 4: Verify submit page renders**

```bash
npm run dev
```

Open `http://localhost:3000/submit/%E8%9C%9C%E8%9C%9C` (蜜蜜's page). Expected: text area on the left, question guide on the right.

Stop the server.

- [ ] **Step 5: Commit**

```bash
git add components/QuestionGuide.tsx components/SubmitForm.tsx app/submit/
git commit -m "feat: add submit page with text area and 6-question guide"
```

---

## Task 8: Waiting Page

**Files:**
- Create: `components/WaitingStatus.tsx`
- Create: `app/submit/[member]/done/page.tsx`

- [ ] **Step 1: Create `components/WaitingStatus.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MEMBERS } from '@/types'
import type { StatusResponse } from '@/types'

interface WaitingStatusProps {
  initialStatus: StatusResponse
}

export default function WaitingStatus({ initialStatus }: WaitingStatusProps) {
  const [status, setStatus] = useState<StatusResponse>(initialStatus)
  const router = useRouter()

  useEffect(() => {
    if (status.analysis_ready) {
      router.push(`/results/${status.date}`)
      return
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/status?date=${status.date}`)
        if (!res.ok) return
        const data: StatusResponse = await res.json()
        setStatus(data)
        if (data.analysis_ready) {
          clearInterval(interval)
          router.push(`/results/${data.date}`)
        }
      } catch {
        // network error — keep polling
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [status.analysis_ready, status.date, router])

  const submittedCount = MEMBERS.filter((m) => status.submitted[m]).length

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-5xl">
        {status.analysis_ready ? '✅' : status.all_submitted ? '🤖' : '⏳'}
      </div>

      <div className="text-center">
        <p className="text-xl font-bold text-gray-900 mb-1">
          {status.analysis_ready
            ? '分析完成！正在跳转…'
            : status.all_submitted
            ? 'AI 分析中，请稍候…'
            : '已提交，等待其他人…'}
        </p>
        <p className="text-gray-500 text-sm">{submittedCount} / 4 人已提交</p>
      </div>

      <div className="w-full max-w-xs bg-white rounded-2xl p-5 border border-gray-100 space-y-2">
        {MEMBERS.map((m) => (
          <div key={m} className="flex items-center gap-3">
            <span className={status.submitted[m] ? 'text-green-500' : 'text-gray-300'}>
              {status.submitted[m] ? '✅' : '⬜'}
            </span>
            <span className={`text-sm ${status.submitted[m] ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
              {m}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `app/submit/[member]/done/page.tsx`**

```tsx
import { notFound } from 'next/navigation'
import { createDb, getReviewByMemberAndDate, getAnalysis } from '@/lib/db'
import { MEMBERS } from '@/types'
import type { MemberName, StatusResponse } from '@/types'
import WaitingStatus from '@/components/WaitingStatus'

interface Props {
  params: { member: string }
}

export const dynamic = 'force-dynamic'

export default function DonePage({ params }: Props) {
  const member = decodeURIComponent(params.member) as MemberName
  if (!MEMBERS.includes(member)) notFound()

  const db = createDb()
  const today = new Date().toISOString().slice(0, 10)

  const submitted = Object.fromEntries(
    MEMBERS.map((m) => [m, !!getReviewByMemberAndDate(db, m, today)])
  ) as StatusResponse['submitted']

  const all_submitted = MEMBERS.every((m) => submitted[m])
  const analysis_ready = !!getAnalysis(db, today)

  const initialStatus: StatusResponse = {
    date: today,
    submitted,
    all_submitted,
    analysis_ready,
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <WaitingStatus initialStatus={initialStatus} />
    </main>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/WaitingStatus.tsx app/submit/
git commit -m "feat: add waiting page with 3-second polling and auto-redirect"
```

---

## Task 9: Results Page

**Files:**
- Create: `components/FeedbackCard.tsx`
- Create: `components/TeamSummary.tsx`
- Create: `app/results/[date]/page.tsx`

- [ ] **Step 1: Create `components/FeedbackCard.tsx`**

```tsx
import type { MemberName, IndividualFeedback } from '@/types'

interface FeedbackCardProps {
  member: MemberName
  feedback: IndividualFeedback
}

export default function FeedbackCard({ member, feedback }: FeedbackCardProps) {
  const q = [
    { label: '🎯 Q1 结果', value: `${feedback.q1?.type || ''} · ${feedback.q1?.completed ? '✅ 完成' : '❌ 未完成'}${feedback.q1?.reason ? ' · ' + feedback.q1.reason : ''}` },
    { label: '🚧 Q2 卡点', value: `${feedback.q2?.type || ''} · ${feedback.q2?.recurring ? '会重复出现' : '不会重复'} · 归入：${feedback.q2?.library || '—'}` },
    { label: '✨ Q3 亮点', value: `${feedback.q3?.action || ''}${feedback.q3?.why ? '——' + feedback.q3.why : ''}` },
    { label: '📝 Q4 案例', value: feedback.q4?.content || '无' },
    { label: '🔄 Q5 流程', value: `${feedback.q5?.action || ''} · ${feedback.q5?.times || 0}次 · ${feedback.q5?.minutes || 0}分钟/次` },
    { label: '🚀 Q6 目标', value: `${feedback.q6?.action || ''} → 新增资产：${feedback.q6?.new_asset || '—'}` },
  ]

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 bg-indigo-50 border-b border-indigo-100">
        <h3 className="font-bold text-gray-900 text-lg">{member}</h3>
      </div>

      <div className="p-5 space-y-3">
        {q.map(({ label, value }) => (
          <div key={label}>
            <p className="text-xs font-semibold text-gray-400 mb-1">{label}</p>
            <p className="text-sm text-gray-700 leading-relaxed">{value}</p>
          </div>
        ))}

        {feedback.role_analysis && (
          <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
            <p className="text-xs font-semibold text-amber-600 mb-1">角色专属分析</p>
            <p className="text-sm text-gray-700 leading-relaxed">{feedback.role_analysis}</p>
          </div>
        )}

        {feedback.team_instruction && (
          <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
            <p className="text-xs font-semibold text-purple-600 mb-1">团队明日指令</p>
            <p className="text-sm text-gray-700 leading-relaxed">{feedback.team_instruction}</p>
          </div>
        )}

        {feedback.daily_asset?.content && (
          <div className="p-4 bg-green-50 rounded-xl border border-green-200">
            <p className="text-xs font-semibold text-green-600 mb-1">
              📦 今日资产 · {feedback.daily_asset.library}
            </p>
            <p className="text-sm font-medium text-gray-800">{feedback.daily_asset.content}</p>
            <p className="text-xs text-gray-500 mt-1">可用于：{feedback.daily_asset.use_for}</p>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `components/TeamSummary.tsx`**

```tsx
import type { TeamSummary as TeamSummaryType } from '@/types'

interface TeamSummaryProps {
  summary: TeamSummaryType
}

export default function TeamSummary({ summary }: TeamSummaryProps) {
  const items = [
    { icon: '🚧', label: '今日瓶颈', value: summary.bottleneck },
    { icon: '⭐', label: '最佳实践广播', value: summary.best_practice },
    { icon: '🔧', label: '优先修复的流程漏洞', value: summary.process_fix },
    { icon: '🎯', label: '目标对齐度', value: summary.alignment },
  ]

  return (
    <div className="space-y-4">
      {items.map(({ icon, label, value }) => (
        <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100">
          <p className="text-sm font-semibold text-gray-500 mb-2">{icon} {label}</p>
          <p className="text-gray-800 leading-relaxed">{value}</p>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Create `app/results/[date]/page.tsx`**

```tsx
import { notFound } from 'next/navigation'
import { createDb, getAnalysis } from '@/lib/db'
import { MEMBERS } from '@/types'
import type { AnalysisResult } from '@/types'
import FeedbackCard from '@/components/FeedbackCard'
import TeamSummaryComponent from '@/components/TeamSummary'
import Link from 'next/link'

interface Props {
  params: { date: string }
  searchParams: { tab?: string }
}

export default function ResultsPage({ params, searchParams }: Props) {
  const { date } = params
  const db = createDb()
  const row = getAnalysis(db, date)
  if (!row) notFound()

  const result: AnalysisResult = JSON.parse(row.result)
  const activeTab = searchParams.tab === 'team' ? 'team' : 'individual'

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← 首页</Link>
          <h1 className="text-xl font-bold text-gray-900">复盘分析 · {date}</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Link
            href={`/results/${date}?tab=individual`}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === 'individual'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300'
            }`}
          >
            个人反馈
          </Link>
          <Link
            href={`/results/${date}?tab=team`}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === 'team'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300'
            }`}
          >
            团队汇总
          </Link>
        </div>

        {activeTab === 'individual' ? (
          <div className="space-y-5">
            {MEMBERS.map((member) =>
              result.individual[member] ? (
                <FeedbackCard key={member} member={member} feedback={result.individual[member]} />
              ) : null
            )}
          </div>
        ) : (
          <TeamSummaryComponent summary={result.team} />
        )}
      </div>
    </main>
  )
}
```

- [ ] **Step 4: Run all tests to confirm nothing broken**

```bash
npx jest
```

Expected: all tests PASS.

- [ ] **Step 5: Verify full app flow manually**

```bash
npm run dev
```

1. Open `http://localhost:3000` — see 4 member cards
2. Click 点妈 → paste any text (20+ characters) → click "提交复盘"
3. Redirected to waiting page — shows 点妈 ✅, others ⬜
4. Return to home (`http://localhost:3000`) — 点妈 card shows ✅ 已提交

Stop the server.

- [ ] **Step 6: Final commit**

```bash
git add components/FeedbackCard.tsx components/TeamSummary.tsx app/results/
git commit -m "feat: add results page with individual feedback and team summary tabs"
```

---

## Running the App

```bash
# 1. Set your DeepSeek API key in .env.local
echo "DEEPSEEK_API_KEY=sk-your-key-here" > .env.local

# 2. Start development server
npm run dev

# 3. Open http://localhost:3000
# Each team member opens this URL, clicks their name, pastes review, submits.
# After all 4 submit, AI analysis runs automatically.
# Results appear at http://localhost:3000/results/YYYY-MM-DD
```

## Running Tests

```bash
npx jest               # all tests
npx jest --watch       # watch mode
npx jest __tests__/lib # db + ai tests only
```
