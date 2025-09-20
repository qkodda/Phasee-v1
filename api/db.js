// Database connection utility for Vercel serverless functions
import sqlite3 from 'sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Use /tmp directory for SQLite in Vercel (ephemeral but works for demo)
// For production, consider using a persistent database like PlanetScale, Supabase, etc.
const DB_PATH = process.env.NODE_ENV === 'production' 
  ? '/tmp/data.sqlite' 
  : path.join(__dirname, '..', 'server', 'data.sqlite')

let db = null

export function getDatabase() {
  if (db) return db
  
  const sqlite3Verbose = sqlite3.verbose()
  db = new sqlite3Verbose.Database(DB_PATH)
  
  // Initialize tables
  db.serialize(() => {
    // Ideas table
    db.run(`CREATE TABLE IF NOT EXISTS ideas (
      id TEXT PRIMARY KEY,
      visual TEXT,
      copy TEXT,
      why TEXT,
      assignedDate TEXT,
      platform TEXT,
      accepted INTEGER DEFAULT 0,
      userId TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users (id)
    )`)
    
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      firstName TEXT,
      lastName TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      lastLoginAt TEXT,
      isActive INTEGER DEFAULT 1
    )`)
    
    // Brand profiles table
    db.run(`CREATE TABLE IF NOT EXISTS brand_profiles (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      brandName TEXT,
      yearFounded TEXT,
      industry TEXT,
      audience TEXT,
      tone TEXT,
      hasPhotography INTEGER DEFAULT 0,
      hasVideo INTEGER DEFAULT 0,
      hasDesign INTEGER DEFAULT 0,
      companyDescription TEXT,
      brandCulture TEXT,
      contentGoals TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users (id)
    )`)
    
    // User settings table
    db.run(`CREATE TABLE IF NOT EXISTS user_settings (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      settingKey TEXT NOT NULL,
      settingValue TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users (id),
      UNIQUE(userId, settingKey)
    )`)
    
    // Migrations
    db.run(`ALTER TABLE ideas ADD COLUMN userId TEXT`, function(err) {
      if (err && !err.message.includes('duplicate column')) {
        console.log('Migration note:', err.message)
      }
    })
    
    db.run(`ALTER TABLE ideas ADD COLUMN why TEXT`, function(err) {
      if (err && !err.message.includes('duplicate column')) {
        console.log('Migration note:', err.message)
      }
    })
  })
  
  return db
}

// Helper to promisify database operations
export function dbGet(query, params = []) {
  return new Promise((resolve, reject) => {
    getDatabase().get(query, params, (err, row) => {
      if (err) reject(err)
      else resolve(row)
    })
  })
}

export function dbAll(query, params = []) {
  return new Promise((resolve, reject) => {
    getDatabase().all(query, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

export function dbRun(query, params = []) {
  return new Promise((resolve, reject) => {
    getDatabase().run(query, params, function(err) {
      if (err) reject(err)
      else resolve({ changes: this.changes, lastID: this.lastID })
    })
  })
}
