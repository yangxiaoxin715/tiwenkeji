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
