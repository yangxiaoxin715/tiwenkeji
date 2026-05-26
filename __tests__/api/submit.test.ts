import Database from 'better-sqlite3'
import { createDb, insertReview, getSubmittedCountForDate, getReviewsForDate } from '@/lib/db'
import { MEMBERS } from '@/types'

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
