# 每日复盘工具 — 设计文档

**日期**：2026-05-26  
**状态**：已确认，待实现

---

## 一、产品背景

四人教育创业团队（点妈、花小蜜、蜜蜜、点妈客服）每天下班后录语音复盘，当前流程是语音转文字后发群，没有结构化分析和资产沉淀。

本工具的目标：**每日复盘不只是"说完就完"，而是每人每天至少沉淀 1 个可复用资产**，并逐步建立六个团队知识库。

---

## 二、核心需求

| 需求 | 决策 |
|------|------|
| 登录方式 | 点击自己名字进入，无需密码 |
| 输入方式 | 单一文本框，粘贴语音转文字原文（用 get笔记等工具转写后复制进来） |
| AI 触发 | 四人全部提交后自动触发，无需手动点击 |
| AI 模型 | DeepSeek API（deepseek-chat） |
| 输出内容 | 个人反馈（6问解析 + 角色专属分析 + 今日资产）+ 团队汇总 |
| 部署方式 | 一期本地运行；二期部署到云端 |

---

## 三、技术选型

**框架**：Next.js 14（App Router）  
**数据库**：SQLite（better-sqlite3）  
**AI**：DeepSeek API  
**运行**：`npm run dev`，本地访问 `http://localhost:3000`  
**环境变量**：`.env.local` 中存放 `DEEPSEEK_API_KEY`

---

## 四、页面结构

### 4.1 首页 `/`
- 显示四个成员卡片：点妈、花小蜜、蜜蜜、点妈客服
- 每张卡片显示今日提交状态（✅已提交 / 待提交）
- 点击卡片进入提交页
- 底部显示"X / 4 人已提交"

### 4.2 提交页 `/submit/[member]`
- 顶部显示成员姓名和日期
- 左侧：大文本框（占主要空间），placeholder 提示"把今天的语音转文字粘贴进来"
- 右侧（折叠/侧边栏）：显示 6 个问题作为提示参考
- 提交按钮
- 若当日已提交则显示已提交内容（可查看，不可修改）

### 4.3 等待页（提交后跳转）`/submit/[member]/done`
- 显示"已提交成功"
- 实时显示四人提交进度（轮询 `/api/status`）
- 四人全提交后自动跳转到结果页

### 4.4 结果页 `/results/[date]`
- Tab 切换：个人反馈 / 团队汇总
- **个人反馈 Tab**：
  - 每人一张卡片，展开显示：
    - Q1-Q6 解析结果
    - 角色专属分析
    - 今日资产（高亮展示，标注归属哪个库）
- **团队汇总 Tab**：
  - 今日瓶颈
  - 最佳实践广播
  - 优先修复的流程漏洞
  - 目标对齐度
- 历史记录入口（查看过去某天的结果）

---

## 五、数据模型

```sql
-- 每日复盘原文
CREATE TABLE reviews (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  member      TEXT NOT NULL,           -- '点妈'|'花小蜜'|'蜜蜜'|'点妈客服'
  date        TEXT NOT NULL,           -- 'YYYY-MM-DD'
  content     TEXT NOT NULL,           -- 原始语音转文字
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(member, date)
);

-- AI 分析结果
CREATE TABLE analysis (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  date        TEXT NOT NULL UNIQUE,    -- 'YYYY-MM-DD'
  result      TEXT NOT NULL,           -- DeepSeek 返回的 JSON 字符串
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 资产库（从 analysis 解析后写入，供二期库页面使用）
CREATE TABLE assets (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  date        TEXT NOT NULL,
  member      TEXT NOT NULL,
  content     TEXT NOT NULL,
  type        TEXT NOT NULL,  -- '案例'|'话术'|'SOP步骤'|'模板'|'判断标准'|'避坑'|'AI提示词'|'自动化需求'
  library     TEXT NOT NULL,  -- '目标库'|'卡点库'|'SOP库'|'话术库'|'案例库'|'自动化需求库'
  use_for     TEXT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 六、API 路由

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/submit` | 保存某人当日复盘；若四人全提交则触发分析 |
| GET  | `/api/status?date=YYYY-MM-DD` | 返回今日各人提交状态 + `analysis_ready` 布尔值 |
| GET  | `/api/results?date=YYYY-MM-DD` | 返回某日分析结果 |

分析在 `/api/submit` 内部触发，不对外暴露单独接口。

---

## 七、AI 分析流程

1. 第四个人提交后，`/api/submit` 取出当日四份原文
2. 拼接为完整 prompt（见第八节），调用 DeepSeek API
3. 解析返回的 JSON，写入 `analysis` 表
4. 将每人的 `daily_asset` 字段写入 `assets` 表
5. 前端等待页轮询 `/api/status`，检测到 `analysis_ready: true` 后跳转结果页

---

## 八、AI 提示词

### 系统 Prompt

```
你是一位严格的创业团队复盘顾问。你的目标不是鼓励，
而是帮助这个团队每天至少沉淀1个可复用资产。

## 团队背景
4人教育创业团队，核心业务：
- 引流：小红书内容 → 私域（目标150人/月，蜜蜜负责）
- 转化：体验营39元 → 年费499元（花小蜜负责）
- 交付：985导航、拖拉磨蹭训练营、小说家训练营（点妈负责）
- 内容支撑：日记整理、书稿（点妈客服负责）

## 6个库（资产归属目标）
- 目标库：本周/每日目标、每人指标
- 卡点库：做不下去、等人、流程不清的问题
- SOP库：引流/转化/交付/反馈/案例整理流程
- 话术库：成交节点、回访、问题结尾、朋友圈私聊
- 案例库：用户原话、孩子变化、成交/拒绝原因
- 自动化需求库：复制粘贴、归档、排版、发送、数据巡查
```

### 用户 Prompt 结构

```
今天是 {date}，以下是4人的复盘原文：

【点妈】
{点妈的原文}

【花小蜜】
{花小蜜的原文}

【蜜蜜】
{蜜蜜的原文}

【点妈客服】
{点妈客服的原文}
```

### 分析指令（接在系统 Prompt 后）

```
## 分析任务

### 第一步：通用6问解析（每人）

Q1结果：今天可验收结果 → 类型(引流/转化/交付/案例沉淀/产品SOP/自动化)、是否完成、未完成真正原因
Q2卡点：类型(缺标准/缺流程/缺模板/缺案例/缺配合)、会否重复、应沉淀到哪个库
Q3亮点：最有效的动作、为什么有效、能否复制给谁、明天谁来复用
Q4案例：值得保存的用户素材、用途(朋友圈/小红书/话术/交付/产品升级)
Q5流程：重复耗时动作、重复次数、每次分钟数、类型、哪步可交AI
Q6目标：明天最小闭环动作、完成后新增什么资产

### 第二步：角色专属分析

**蜜蜜（引流）：**
新增有效对标账号数、哪条笔记证明用户有真实需求、今日最耗时步骤、
有无可批量复制成5条的笔记、今日必须沉淀其一（有效钩子/对标账号/封面模板/批量SOP）

**花小蜜（转化）：**
今日接触用户的转化节点分布（刚加微信/购39元/第1-7天打卡/提交反馈/发方案/待升级/已成交/未成交）、
推进原因、未推进卡点、有无用户原话暴露真实痛点、
哪个节点忘了用"钩子+提问"结尾、今日必须沉淀其一（节点图/痛点/话术/未成交原因）

**点妈（管理+产品）：**
今日目标是否拆到具体人和动作、有无判断写成决策树、有无流程写成SOP、
有无重复动作进自动化需求池、今天是干活还是建系统（直接判断）、
输出"团队明日指令"：把今日战略思考转化成1-2条可立刻布置的具体动作

**点妈客服（内容支撑）：**
如今日工作未与团队核心目标（引流/转化/交付）产生连接，直接指出并建议如何连接

### 第三步：今日资产提取（每人必须输出1个）
从复盘中提取最有价值的1个资产：内容（一句话）、类型、归库、可用于
如找不到明显资产：输出"今日未产出可沉淀资产"并说明本可沉淀什么

### 第四步：团队汇总
- 今日瓶颈：谁目标不清晰？谁在等谁？谁是今天摩擦点？
- 最佳实践广播：全团队立刻可复用的1个方法
- 优先修复的流程漏洞：出现频率最高的重复耗时动作
- 对齐度：4人是否都在推进同一核心目标？谁偏了？

## 输出格式（严格JSON，不输出其他内容）

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
    "花小蜜": { "q1": {...}, "q2": {...}, "q3": {...}, "q4": {...}, "q5": {...}, "q6": {...}, "role_analysis": "...", "daily_asset": {...} },
    "蜜蜜":   { "q1": {...}, "q2": {...}, "q3": {...}, "q4": {...}, "q5": {...}, "q6": {...}, "role_analysis": "...", "daily_asset": {...} },
    "点妈客服": { "q1": {...}, "q2": {...}, "q3": {...}, "q4": {...}, "q5": {...}, "q6": {...}, "role_analysis": "...", "daily_asset": {...} }
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
- 点妈的"今天是在干活还是建系统"必须给出明确判断
```

---

## 九、项目结构

```
daily-review/
├── app/
│   ├── page.tsx                    # 首页：四人卡片
│   ├── submit/
│   │   └── [member]/
│   │       ├── page.tsx            # 提交页
│   │       └── done/page.tsx       # 等待页
│   ├── results/
│   │   └── [date]/page.tsx         # 结果页
│   └── api/
│       ├── submit/route.ts         # 提交 + 触发分析
│       ├── status/route.ts         # 查询提交状态
│       └── results/route.ts        # 查询分析结果
├── lib/
│   ├── db.ts                       # SQLite 初始化 + 查询函数
│   └── prompt.ts                   # DeepSeek prompt 拼装 + 调用
├── components/
│   ├── MemberCard.tsx
│   ├── SubmitForm.tsx
│   ├── FeedbackCard.tsx
│   └── TeamSummary.tsx
├── .env.local                      # DEEPSEEK_API_KEY=xxx
└── package.json
```

---

## 十、分期计划

### 一期（当前目标）
- 四人提交 → AI 分析 → 个人反馈 + 团队汇总 + 今日资产展示
- 资产写入 `assets` 表备用
- 本地运行

### 二期（跑稳之后）
- 六个库的展示页面：按库分类浏览历史资产
- 支持按成员、日期、类型筛选
- 云端部署（Vercel + 远程 SQLite 或迁移到 PostgreSQL）

---

## 十一、不在本期范围内

- 用户权限管理
- 推送通知（提醒成员提交）
- 语音录制功能（用户继续用现有工具转写）
- 资产编辑/删除
