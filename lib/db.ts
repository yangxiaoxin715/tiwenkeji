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
