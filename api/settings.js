// User settings management endpoint
import { dbRun } from './db.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    const { userId, settingKey, settingValue } = req.body || {}
    if (!userId || !settingKey) return res.status(400).json({ error: 'User ID and setting key required' })
    
    const settingId = Date.now().toString(36) + Math.random().toString(36).slice(2)
    const valueStr = typeof settingValue === 'string' ? settingValue : JSON.stringify(settingValue)
    
    await dbRun(`INSERT INTO user_settings (id, userId, settingKey, settingValue, updatedAt)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(userId, settingKey) DO UPDATE SET
        settingValue = excluded.settingValue,
        updatedAt = CURRENT_TIMESTAMP`,
      [settingId, userId, settingKey, valueStr])
    
    res.json({ message: 'Setting saved successfully' })
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) })
  }
}
