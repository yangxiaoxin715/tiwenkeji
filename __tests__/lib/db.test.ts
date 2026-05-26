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
