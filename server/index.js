/* Minimal Express server with SQLite and OpenAI generate endpoint */
import express from 'express'
import path from 'path'
import sqlite3 from 'sqlite3'
import OpenAI from 'openai'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.use(express.json())

const DB_PATH = path.join(__dirname, 'data.sqlite')
const sqlite3Verbose = sqlite3.verbose()
const db = new sqlite3Verbose.Database(DB_PATH)

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS ideas (
    id TEXT PRIMARY KEY,
    visual TEXT,
    copy TEXT,
    why TEXT,
    assignedDate TEXT,
    platform TEXT,
    accepted INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`)
  
  // Add why column if it doesn't exist (migration)
  db.run(`ALTER TABLE ideas ADD COLUMN why TEXT`, function(err) {
    if (err && !err.message.includes('duplicate column')) {
      // Ignore if column already exists, otherwise log error
      console.log('Migration note:', err.message)
    }
  })
})

app.get('/api/health', (req, res) => {
  res.json({ ok: true })
})

app.post('/api/generate', async (req, res) => {
  try {
    const { profile, notes, count = 3 } = req.body || {}
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return res.status(500).json({ error: 'Missing OPENAI_API_KEY' })
    const client = new OpenAI({ apiKey })

    const prompt = `Generate ${count} short social post ideas as JSON array with fields visual and copy.
Profile: ${JSON.stringify(profile)}
Notes: ${notes || 'none'}
Return only JSON.`

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
    })
    const text = completion.choices?.[0]?.message?.content || '[]'
    const ideas = JSON.parse(text)
    res.json({ ideas })
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) })
  }
})

// Upsert accepted idea
app.post('/api/ideas', (req, res) => {
  const { id, visual, copy, why, assignedDate, platform, accepted } = req.body || {}
  if (!id) return res.status(400).json({ error: 'Missing id' })
  const stmt = db.prepare(`INSERT INTO ideas (id, visual, copy, why, assignedDate, platform, accepted)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET visual=excluded.visual, copy=excluded.copy, why=excluded.why, assignedDate=excluded.assignedDate, platform=excluded.platform, accepted=excluded.accepted`)
  stmt.run(id, visual || '', copy || '', why || '', assignedDate || null, platform || null, accepted ? 1 : 0, function(err){
    if (err) return res.status(500).json({ error: String(err.message || err) })
    res.json({ ok: true })
  })
})

// List accepted ideas
app.get('/api/ideas', (req, res) => {
  db.all(`SELECT id, visual, copy, why, assignedDate, platform, accepted FROM ideas WHERE accepted = 1 ORDER BY assignedDate ASC, createdAt ASC`, (err, rows) => {
    if (err) return res.status(500).json({ error: String(err.message || err) })
    res.json({ ideas: rows.map(r => ({...r, accepted: !!r.accepted})) })
  })
})

const PORT = process.env.PORT || 8787
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`))


