// User login endpoint
import { dbGet, dbRun } from '../db.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    const { email, password } = req.body || {}
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })
    
    const user = await dbGet(`SELECT id, email, firstName, lastName FROM users WHERE email = ? AND password = ? AND isActive = 1`, 
      [email.toLowerCase(), password])
    
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })
    
    // Update last login
    await dbRun(`UPDATE users SET lastLoginAt = CURRENT_TIMESTAMP WHERE id = ?`, [user.id])
    
    res.json({ 
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
      message: 'Login successful' 
    })
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) })
  }
}
