// Ideas management endpoint
import { dbRun, dbAll } from './db.js'

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      // Create/update idea
      const { id, visual, copy, why, assignedDate, platform, accepted, userId } = req.body || {}
      if (!id) return res.status(400).json({ error: 'Missing id' })
      
      await dbRun(`INSERT INTO ideas (id, visual, copy, why, assignedDate, platform, accepted, userId)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET visual=excluded.visual, copy=excluded.copy, why=excluded.why, assignedDate=excluded.assignedDate, platform=excluded.platform, accepted=excluded.accepted, userId=excluded.userId`,
        [id, visual || '', copy || '', why || '', assignedDate || null, platform || null, accepted ? 1 : 0, userId || null])
      
      res.json({ ok: true })
    } else if (req.method === 'GET') {
      // Get ideas list
      const { userId } = req.query
      const query = userId 
        ? `SELECT id, visual, copy, why, assignedDate, platform, accepted FROM ideas WHERE accepted = 1 AND userId = ? ORDER BY assignedDate ASC, createdAt ASC`
        : `SELECT id, visual, copy, why, assignedDate, platform, accepted FROM ideas WHERE accepted = 1 ORDER BY assignedDate ASC, createdAt ASC`
      
      const params = userId ? [userId] : []
      const rows = await dbAll(query, params)
      res.json({ ideas: rows.map(r => ({...r, accepted: !!r.accepted})) })
    } else {
      res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) })
  }
}
