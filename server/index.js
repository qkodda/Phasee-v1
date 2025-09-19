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
  
  // Add userId column to ideas if it doesn't exist (migration)
  db.run(`ALTER TABLE ideas ADD COLUMN userId TEXT`, function(err) {
    if (err && !err.message.includes('duplicate column')) {
      console.log('Migration note:', err.message)
    }
  })
  
  // Add why column if it doesn't exist (migration)
  db.run(`ALTER TABLE ideas ADD COLUMN why TEXT`, function(err) {
    if (err && !err.message.includes('duplicate column')) {
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

// ===== USER MANAGEMENT ENDPOINTS =====

// Register new user
app.post('/api/auth/register', (req, res) => {
  const { email, password, firstName, lastName } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' })
  
  const userId = Date.now().toString(36) + Math.random().toString(36).slice(2)
  const stmt = db.prepare(`INSERT INTO users (id, email, password, firstName, lastName) VALUES (?, ?, ?, ?, ?)`)
  
  stmt.run(userId, email.toLowerCase(), password, firstName || '', lastName || '', function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(409).json({ error: 'Email already exists' })
      }
      return res.status(500).json({ error: String(err.message || err) })
    }
    res.json({ 
      user: { id: userId, email: email.toLowerCase(), firstName, lastName },
      message: 'User created successfully' 
    })
  })
})

// Login user
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' })
  
  db.get(`SELECT id, email, firstName, lastName FROM users WHERE email = ? AND password = ? AND isActive = 1`, 
    [email.toLowerCase(), password], (err, user) => {
    if (err) return res.status(500).json({ error: String(err.message || err) })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })
    
    // Update last login
    db.run(`UPDATE users SET lastLoginAt = CURRENT_TIMESTAMP WHERE id = ?`, [user.id])
    
    res.json({ 
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
      message: 'Login successful' 
    })
  })
})

// Get user profile
app.get('/api/users/:userId', (req, res) => {
  const { userId } = req.params
  db.get(`SELECT id, email, firstName, lastName, createdAt, lastLoginAt FROM users WHERE id = ? AND isActive = 1`, 
    [userId], (err, user) => {
    if (err) return res.status(500).json({ error: String(err.message || err) })
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json({ user })
  })
})

// Update user profile
app.put('/api/users/:userId', (req, res) => {
  const { userId } = req.params
  const { firstName, lastName, email } = req.body || {}
  
  const stmt = db.prepare(`UPDATE users SET firstName = ?, lastName = ?, email = ? WHERE id = ? AND isActive = 1`)
  stmt.run(firstName || '', lastName || '', email?.toLowerCase() || '', userId, function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(409).json({ error: 'Email already exists' })
      }
      return res.status(500).json({ error: String(err.message || err) })
    }
    if (this.changes === 0) return res.status(404).json({ error: 'User not found' })
    res.json({ message: 'User updated successfully' })
  })
})

// ===== BRAND PROFILE ENDPOINTS =====

// Get brand profile for user
app.get('/api/brand-profile/:userId', (req, res) => {
  const { userId } = req.params
  db.get(`SELECT * FROM brand_profiles WHERE userId = ? ORDER BY updatedAt DESC LIMIT 1`, 
    [userId], (err, profile) => {
    if (err) return res.status(500).json({ error: String(err.message || err) })
    if (!profile) return res.status(404).json({ error: 'Brand profile not found' })
    
    // Convert integer fields back to boolean
    const brandProfile = {
      ...profile,
      hasPhotography: !!profile.hasPhotography,
      hasVideo: !!profile.hasVideo,
      hasDesign: !!profile.hasDesign
    }
    res.json({ profile: brandProfile })
  })
})

// Create or update brand profile
app.post('/api/brand-profile', (req, res) => {
  const { 
    userId, brandName, yearFounded, industry, audience, tone,
    hasPhotography, hasVideo, hasDesign, companyDescription, 
    brandCulture, contentGoals 
  } = req.body || {}
  
  if (!userId) return res.status(400).json({ error: 'User ID required' })
  
  const profileId = Date.now().toString(36) + Math.random().toString(36).slice(2)
  // First check if profile exists for this user
  db.get(`SELECT id FROM brand_profiles WHERE userId = ?`, [userId], (err, existing) => {
    if (err) return res.status(500).json({ error: String(err.message || err) })
    
    if (existing) {
      // Update existing profile
      const updateStmt = db.prepare(`UPDATE brand_profiles SET
        brandName = ?, yearFounded = ?, industry = ?, audience = ?, tone = ?,
        hasPhotography = ?, hasVideo = ?, hasDesign = ?, companyDescription = ?, 
        brandCulture = ?, contentGoals = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE userId = ?`)
      
      updateStmt.run(
        brandName || '', yearFounded || '', industry || '', audience || '', tone || '',
        hasPhotography ? 1 : 0, hasVideo ? 1 : 0, hasDesign ? 1 : 0,
        companyDescription || '', brandCulture || '', contentGoals || '', userId,
        function(err) {
          if (err) return res.status(500).json({ error: String(err.message || err) })
          res.json({ message: 'Brand profile updated successfully', profileId: existing.id })
        })
    } else {
      // Create new profile
      const insertStmt = db.prepare(`INSERT INTO brand_profiles (
        id, userId, brandName, yearFounded, industry, audience, tone,
        hasPhotography, hasVideo, hasDesign, companyDescription, 
        brandCulture, contentGoals
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      
      insertStmt.run(
        profileId, userId, brandName || '', yearFounded || '', industry || '', 
        audience || '', tone || '', hasPhotography ? 1 : 0, hasVideo ? 1 : 0, 
        hasDesign ? 1 : 0, companyDescription || '', brandCulture || '', 
        contentGoals || '', function(err) {
        if (err) return res.status(500).json({ error: String(err.message || err) })
        res.json({ message: 'Brand profile created successfully', profileId })
      })
    }
  })
})

// ===== USER SETTINGS ENDPOINTS =====

// Get user settings
app.get('/api/settings/:userId', (req, res) => {
  const { userId } = req.params
  db.all(`SELECT settingKey, settingValue FROM user_settings WHERE userId = ?`, 
    [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: String(err.message || err) })
    
    const settings = {}
    rows.forEach(row => {
      try {
        settings[row.settingKey] = JSON.parse(row.settingValue)
      } catch {
        settings[row.settingKey] = row.settingValue
      }
    })
    res.json({ settings })
  })
})

// Save user setting
app.post('/api/settings', (req, res) => {
  const { userId, settingKey, settingValue } = req.body || {}
  if (!userId || !settingKey) return res.status(400).json({ error: 'User ID and setting key required' })
  
  const settingId = Date.now().toString(36) + Math.random().toString(36).slice(2)
  const valueStr = typeof settingValue === 'string' ? settingValue : JSON.stringify(settingValue)
  
  const stmt = db.prepare(`INSERT INTO user_settings (id, userId, settingKey, settingValue, updatedAt)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(userId, settingKey) DO UPDATE SET
      settingValue = excluded.settingValue,
      updatedAt = CURRENT_TIMESTAMP`)
  
  stmt.run(settingId, userId, settingKey, valueStr, function(err) {
    if (err) return res.status(500).json({ error: String(err.message || err) })
    res.json({ message: 'Setting saved successfully' })
  })
})

// Update ideas endpoint to include userId
app.post('/api/ideas', (req, res) => {
  const { id, visual, copy, why, assignedDate, platform, accepted, userId } = req.body || {}
  if (!id) return res.status(400).json({ error: 'Missing id' })
  const stmt = db.prepare(`INSERT INTO ideas (id, visual, copy, why, assignedDate, platform, accepted, userId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET visual=excluded.visual, copy=excluded.copy, why=excluded.why, assignedDate=excluded.assignedDate, platform=excluded.platform, accepted=excluded.accepted, userId=excluded.userId`)
  stmt.run(id, visual || '', copy || '', why || '', assignedDate || null, platform || null, accepted ? 1 : 0, userId || null, function(err){
    if (err) return res.status(500).json({ error: String(err.message || err) })
    res.json({ ok: true })
  })
})

// Update ideas list to filter by user
app.get('/api/ideas/:userId?', (req, res) => {
  const { userId } = req.params
  const query = userId 
    ? `SELECT id, visual, copy, why, assignedDate, platform, accepted FROM ideas WHERE accepted = 1 AND userId = ? ORDER BY assignedDate ASC, createdAt ASC`
    : `SELECT id, visual, copy, why, assignedDate, platform, accepted FROM ideas WHERE accepted = 1 ORDER BY assignedDate ASC, createdAt ASC`
  
  const params = userId ? [userId] : []
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: String(err.message || err) })
    res.json({ ideas: rows.map(r => ({...r, accepted: !!r.accepted})) })
  })
})

const PORT = process.env.PORT || 8787
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`))


