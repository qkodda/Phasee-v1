// Vercel Serverless Function: /api/generate
// Mirrors the local Express endpoint without SQLite

import OpenAI from 'openai'

function parseBody(req) {
  return new Promise((resolve) => {
    let data = ''
    req.on('data', (chunk) => { data += chunk })
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')) } catch { resolve({}) }
    })
    req.on('error', () => resolve({}))
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' })
    return
  }
  try {
    const body = req.body && Object.keys(req.body).length ? req.body : await parseBody(req)
    const { profile, notes, count = 3, campaign = false, sourceDates = [] } = body || {}

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      res.status(500).json({ error: 'Missing OPENAI_API_KEY' })
      return
    }
    const client = new OpenAI({ apiKey })

    const prompt = `You are a social media content strategist. Generate exactly ${count} engaging social media post ideas based on the brand profile. Do not return fewer than ${count}.

BRAND PROFILE:
${JSON.stringify(profile || {}, null, 2)}

ADDITIONAL NOTES: ${notes || 'No specific notes provided'}

REQUIREMENTS:
- Create content that matches the brand's tone and industry
- Consider the target audience: ${(profile && profile.audience) || 'general audience'}
- Align with content goals: ${(profile && profile.contentGoals) || 'brand awareness'}
- Include visual suggestions that match available capabilities: ${[(profile && profile.hasPhotography) && 'photography', (profile && profile.hasVideo) && 'video', (profile && profile.hasDesign) && 'design'].filter(Boolean).join(', ') || 'basic visuals'}
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
    res.status(200).json({ ideas })
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) })
  }
}


