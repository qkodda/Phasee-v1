// Vercel Serverless Function: /api/optimize
// Mirrors the local Express endpoint for optimization

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
    const { visual, copy, platform, profile } = body || {}
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return res.status(500).json({ error: 'Missing OPENAI_API_KEY' })
    const client = new OpenAI({ apiKey })

    const prompt = `You are a social media optimization expert. Improve this content for ${platform || 'social media'}:

CURRENT CONTENT:
Visual: ${visual}
Copy: ${copy}

BRAND CONTEXT:
${JSON.stringify(profile || {}, null, 2)}

OPTIMIZATION GOALS:
- Increase engagement and reach
- Match platform best practices for ${platform || 'social media'}
- Maintain brand voice and tone
- Optimize for target audience

Return a JSON object with:
- "visual": Enhanced visual concept
- "copy": Optimized post text
- "hashtags": Array of relevant hashtags (5-10)
- "improvements": Brief explanation of changes made

Return ONLY the JSON object, no other text.`

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    })
    const text = completion.choices?.[0]?.message?.content || '{}'
    const result = JSON.parse(text)
    res.status(200).json(result)
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) })
  }
}


