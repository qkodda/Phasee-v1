// Get brand profile for user endpoint
import { dbGet } from '../db.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    const { userId } = req.query
    const profile = await dbGet(`SELECT * FROM brand_profiles WHERE userId = ? ORDER BY updatedAt DESC LIMIT 1`, 
      [userId])
    
    if (!profile) return res.status(404).json({ error: 'Brand profile not found' })
    
    // Convert integer fields back to boolean
    const brandProfile = {
      ...profile,
      hasPhotography: !!profile.hasPhotography,
      hasVideo: !!profile.hasVideo,
      hasDesign: !!profile.hasDesign
    }
    res.json({ profile: brandProfile })
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) })
  }
}
