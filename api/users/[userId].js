// User profile management endpoint
import { dbGet, dbRun } from '../db.js'

export default async function handler(req, res) {
  const { userId } = req.query
  
  try {
    if (req.method === 'GET') {
      // Get user profile
      const user = await dbGet(`SELECT id, email, firstName, lastName, createdAt, lastLoginAt FROM users WHERE id = ? AND isActive = 1`, 
        [userId])
      
      if (!user) return res.status(404).json({ error: 'User not found' })
      res.json({ user })
    } else if (req.method === 'PUT') {
      // Update user profile
      const { firstName, lastName, email } = req.body || {}
      
      const result = await dbRun(`UPDATE users SET firstName = ?, lastName = ?, email = ? WHERE id = ? AND isActive = 1`,
        [firstName || '', lastName || '', email?.toLowerCase() || '', userId])
      
      if (result.changes === 0) return res.status(404).json({ error: 'User not found' })
      res.json({ message: 'User updated successfully' })
    } else {
      res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Email already exists' })
    }
    res.status(500).json({ error: String(err.message || err) })
  }
}
