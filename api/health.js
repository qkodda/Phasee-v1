// Health check endpoint
export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  res.json({ ok: true, timestamp: new Date().toISOString() })
}
