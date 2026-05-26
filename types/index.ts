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
