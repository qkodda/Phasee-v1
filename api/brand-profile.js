// Brand profile management endpoint
import { dbGet, dbRun } from './db.js'

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      // Create or update brand profile
      const { 
        userId, brandName, yearFounded, industry, audience, tone,
        hasPhotography, hasVideo, hasDesign, companyDescription, 
        brandCulture, contentGoals 
      } = req.body || {}
      
      if (!userId) return res.status(400).json({ error: 'User ID required' })
      
      const profileId = Date.now().toString(36) + Math.random().toString(36).slice(2)
      
      // Check if profile exists for this user
      const existing = await dbGet(`SELECT id FROM brand_profiles WHERE userId = ?`, [userId])
      
      if (existing) {
        // Update existing profile
        await dbRun(`UPDATE brand_profiles SET
          brandName = ?, yearFounded = ?, industry = ?, audience = ?, tone = ?,
          hasPhotography = ?, hasVideo = ?, hasDesign = ?, companyDescription = ?, 
          brandCulture = ?, contentGoals = ?, updatedAt = CURRENT_TIMESTAMP
          WHERE userId = ?`,
          [brandName || '', yearFounded || '', industry || '', audience || '', tone || '',
           hasPhotography ? 1 : 0, hasVideo ? 1 : 0, hasDesign ? 1 : 0,
           companyDescription || '', brandCulture || '', contentGoals || '', userId])
        
        res.json({ message: 'Brand profile updated successfully', profileId: existing.id })
      } else {
        // Create new profile
        await dbRun(`INSERT INTO brand_profiles (
          id, userId, brandName, yearFounded, industry, audience, tone,
          hasPhotography, hasVideo, hasDesign, companyDescription, 
          brandCulture, contentGoals
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [profileId, userId, brandName || '', yearFounded || '', industry || '', 
           audience || '', tone || '', hasPhotography ? 1 : 0, hasVideo ? 1 : 0, 
           hasDesign ? 1 : 0, companyDescription || '', brandCulture || '', 
           contentGoals || ''])
        
        res.json({ message: 'Brand profile created successfully', profileId })
      }
    } else {
      res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) })
  }
}
