// Get user settings endpoint
import { dbAll } from '../db.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    const { userId } = req.query
    const rows = await dbAll(`SELECT settingKey, settingValue FROM user_settings WHERE userId = ?`, 
      [userId])
    
    const settings = {}
    rows.forEach(row => {
      try {
        settings[row.settingKey] = JSON.parse(row.settingValue)
      } catch {
        settings[row.settingKey] = row.settingValue
      }
    })
    res.json({ settings })
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) })
  }
}
