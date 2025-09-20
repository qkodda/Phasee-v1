// User registration endpoint
import { dbRun } from '../db.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    const { email, password, firstName, lastName } = req.body || {}
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })
    
    const userId = Date.now().toString(36) + Math.random().toString(36).slice(2)
    
    await dbRun(`INSERT INTO users (id, email, password, firstName, lastName) VALUES (?, ?, ?, ?, ?)`,
      [userId, email.toLowerCase(), password, firstName || '', lastName || ''])
    
    res.json({ 
      user: { id: userId, email: email.toLowerCase(), firstName, lastName },
      message: 'User created successfully' 
    })
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Email already exists' })
    }
    res.status(500).json({ error: String(err.message || err) })
  }
}
