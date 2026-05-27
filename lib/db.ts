import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import type { MemberName, ReviewRow, AnalysisRow, IndividualAnalysisRow, GoalsRow, Goals, DailyAsset, TrendAnalysisRow } from '@/types'

const DEFAULT_DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'daily-review.db')

export function createDb(dbPath: string = DEFAULT_DB_PATH): Database.Database {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true })
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

    CREATE TABLE IF NOT EXISTS individual_analyses (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      member     TEXT NOT NULL,
      date       TEXT NOT NULL,
      result     TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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

    CREATE TABLE IF NOT EXISTS trend_analyses (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      period     TEXT NOT NULL UNIQUE,
      result     TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS goals (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      team_goal        TEXT NOT NULL DEFAULT '',
      individual_goals TEXT NOT NULL DEFAULT '{}',
      updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP
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

export function saveIndividualAnalysis(
  db: Database.Database,
  member: MemberName,
  date: string,
  result: object
): void {
  db.prepare(
    'INSERT OR REPLACE INTO individual_analyses (member, date, result) VALUES (?, ?, ?)'
  ).run(member, date, JSON.stringify(result))
}

export function getIndividualAnalysis(
  db: Database.Database,
  member: MemberName,
  date: string
): IndividualAnalysisRow | null {
  return (
    (db
      .prepare('SELECT * FROM individual_analyses WHERE member = ? AND date = ?')
      .get(member, date) as IndividualAnalysisRow) || null
  )
}

export function getGoals(db: Database.Database): Goals {
  const row = db.prepare('SELECT * FROM goals ORDER BY id DESC LIMIT 1').get() as GoalsRow | undefined
  if (!row) return { team_goal: '', individual_goals: {} }
  return {
    team_goal: row.team_goal,
    individual_goals: JSON.parse(row.individual_goals),
  }
}

export function saveGoals(db: Database.Database, goals: Goals): void {
  const existing = db.prepare('SELECT id FROM goals LIMIT 1').get() as { id: number } | undefined
  if (existing) {
    db.prepare(
      'UPDATE goals SET team_goal = ?, individual_goals = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(goals.team_goal, JSON.stringify(goals.individual_goals), existing.id)
  } else {
    db.prepare(
      'INSERT INTO goals (team_goal, individual_goals) VALUES (?, ?)'
    ).run(goals.team_goal, JSON.stringify(goals.individual_goals))
  }
}

export function getAvailableDates(db: Database.Database): string[] {
  const rows = db
    .prepare('SELECT DISTINCT date FROM reviews ORDER BY date DESC LIMIT 30')
    .all() as { date: string }[]
  return rows.map((r) => r.date)
}

export function getReviewsForDates(db: Database.Database, dates: string[]): ReviewRow[] {
  if (dates.length === 0) return []
  const placeholders = dates.map(() => '?').join(',')
  return db
    .prepare(`SELECT * FROM reviews WHERE date IN (${placeholders}) ORDER BY date ASC`)
    .all(...dates) as ReviewRow[]
}

export function saveTrendAnalysis(db: Database.Database, period: string, result: object): void {
  db.prepare(
    'INSERT OR REPLACE INTO trend_analyses (period, result) VALUES (?, ?)'
  ).run(period, JSON.stringify(result))
}

export function getTrendAnalysis(db: Database.Database, period: string): TrendAnalysisRow | null {
  return (
    (db
      .prepare('SELECT * FROM trend_analyses WHERE period = ?')
      .get(period) as TrendAnalysisRow) || null
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
