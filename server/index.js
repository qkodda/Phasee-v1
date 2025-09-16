/* Minimal Express server with SQLite and OpenAI generate endpoint */
import 'dotenv/config'
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
    const { profile, notes, count = 3, campaign = false, sourceDates = [], grounded = true } = req.body || {}
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return res.status(500).json({ error: 'Missing OPENAI_API_KEY' })
    const client = new OpenAI({ apiKey })

    const prompt = `You are a social media content strategist. Generate exactly ${count} engaging social media post ideas based on the brand profile. Do not return fewer than ${count}.

BRAND PROFILE:
${JSON.stringify(profile, null, 2)}

ADDITIONAL NOTES: ${notes || 'No specific notes provided'}

REQUIREMENTS:
- Create content that matches the brand's tone and industry
- Consider the target audience: ${profile?.audience || 'general audience'}
- Align with content goals: ${profile?.contentGoals || 'brand awareness'}
- Include visual suggestions that match available capabilities: ${[profile?.hasPhotography && 'photography', profile?.hasVideo && 'video', profile?.hasDesign && 'design'].filter(Boolean).join(', ') || 'basic visuals'}
${grounded ? `- Emphasize grounded, realistic, low/no-cost ideas achievable by an average person using only a modern smartphone and common household items.
- Avoid specialized equipment, studios, actors, or complex locations. Keep steps simple and time-light.
- Each idea must specify a simple, phone-friendly visual setup and a short, plain-language caption prompt.` : ''}
${campaign ? `- Treat these posts as one cohesive campaign across the following dates: ${Array.isArray(sourceDates)&&sourceDates.length? sourceDates.join(', ') : 'multiple selected dates'}. Ensure a narrative or thematic link between posts. Avoid repeating the same concept; vary angles while keeping a unifying theme. Each idea must clearly connect to the same sale/product/theme.` : ''}

Return a JSON array with objects containing:
- "visual": Detailed visual description/concept
- "copy": Engaging post text (keep under 280 characters)
- "why": Brief explanation of why this content works for the brand

Example format:
[{"visual": "Behind-the-scenes photo of...", "copy": "Your engaging post text here", "why": "Builds authenticity and trust"}]

Return ONLY the JSON array, no other text. The array length MUST equal ${count}.`

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

// AI content optimization endpoint
app.post('/api/optimize', async (req, res) => {
  try {
    const { visual, copy, platform, profile } = req.body || {}
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return res.status(500).json({ error: 'Missing OPENAI_API_KEY' })
    const client = new OpenAI({ apiKey })

    const prompt = `You are a social media optimization expert. Improve this content for ${platform || 'social media'}:

CURRENT CONTENT:
Visual: ${visual}
Copy: ${copy}

BRAND CONTEXT:
${JSON.stringify(profile, null, 2)}

OPTIMIZATION GOALS:
- Increase engagement and reach
- Match platform best practices for ${platform || 'social media'}
- Maintain brand voice and tone
- Optimize for target audience

Return a JSON object with:
- "visual": Enhanced visual concept
- "copy": Optimized post text
- "hashtags": Array of relevant hashtags (5-10)
- "improvements": Brief explanation of changes made

Return ONLY the JSON object, no other text.`

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    })
    const text = completion.choices?.[0]?.message?.content || '{}'
    const result = JSON.parse(text)
    res.json(result)
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


